import { NextRequest, NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'
import { AIRecognizedReceipt, AIProcessingResult } from '@/types'
import { AI_CONFIG } from '@/lib/config'
import { COMPLETE_RECEIPT_PROMPT } from '@/lib/prompts'
import { aiLogger } from '@/lib/logger'
import convert from 'heic-convert'

// 配置API路由
export const runtime = 'nodejs'

// 获取 Groq 客户端实例
const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY 环境变量未配置')
  }
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })
}

/**
 * 检查文件是否为支持的图片格式
 */
const isSupportedImageFormat = (mimeType: string): boolean => {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
  return supportedTypes.includes(mimeType)
}

/**
 * 检查是否为 HEIC 格式
 */
const isHeicFormat = (file: File): boolean => {
  return file.type === 'image/heic' || file.type === 'image/heif' || 
         file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
}

/**
 * 转换 HEIC 格式到 JPEG
 */
const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    aiLogger.info('开始转换 HEIC 格式...', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    })
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const outputBuffer = await convert({
      buffer: buffer,
      format: 'JPEG',
      quality: 0.9
    })
    
    const jpegFile = new File([outputBuffer], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
    
    aiLogger.info('HEIC 转换完成', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      convertedSize: `${(jpegFile.size / 1024 / 1024).toFixed(2)}MB`,
    })
    
    return jpegFile
  } catch (error) {
    aiLogger.error('HEIC 转换失败:', error)
    throw new Error(`HEIC 转换失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 将图片文件转换为 base64 数据URL
 */
const fileToBase64 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  return `data:${file.type};base64,${base64}`
}

/**
 * 基本格式验证
 */
const validateBasicFormat = (data: any): boolean => {
  return data && 
         typeof data === 'object' && 
         Array.isArray(data.items) && 
         data.items.length > 0
}

/**
 * 验证识别结果
 */
const validateResponse = (data: AIRecognizedReceipt): boolean => {
  if (!data.items || data.items.length === 0) {
    return false
  }
  
  return data.items.every(item => 
    item.name && 
    typeof item.name === 'string' && 
    item.name.trim().length > 0 &&
    (item.price === null || (typeof item.price === 'number' && item.price >= 0))
  )
}

export async function POST(request: NextRequest) {
  try {
    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到上传的文件' },
        { status: 400 }
      )
    }

    // 验证文件格式
    if (!isSupportedImageFormat(file.type)) {
      return NextResponse.json(
        { success: false, error: '不支持的文件格式' },
        { status: 400 }
      )
    }

    // 验证文件大小
    if (file.size > AI_CONFIG.image.maxFileSize) {
      return NextResponse.json(
        { success: false, error: '文件过大' },
        { status: 400 }
      )
    }

    aiLogger.info('开始 Groq AI 识别流程...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    // 1. 预处理图片（转换 HEIC 格式）
    let processedFile = file
    if (isHeicFormat(file)) {
      processedFile = await convertHeicToJpeg(file)
    }

    // 2. 将图片转换为 base64
    const imageBase64 = await fileToBase64(processedFile)

    // 3. 调用 Groq API 进行识别
    aiLogger.info('开始调用 Groq API...')

    const groq = getGroqClient()
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: COMPLETE_RECEIPT_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      model: AI_CONFIG.groq.model,
      temperature: AI_CONFIG.groq.temperature,
      max_tokens: AI_CONFIG.groq.maxTokens,
    })

    aiLogger.info('Groq API 调用成功')

    // 4. 解析响应
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('API响应为空')
    }

    // 5. 解析 JSON 结果
    let recognizedData: AIRecognizedReceipt
    try {
      recognizedData = JSON.parse(content)
      aiLogger.info('JSON 直接解析成功')
    } catch (e) {
      // 如果直接解析失败，尝试提取 JSON 部分
      aiLogger.warn('JSON 直接解析失败，尝试提取 JSON 部分')
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        recognizedData = JSON.parse(jsonMatch[0])
        aiLogger.info('JSON 提取解析成功')
      } else {
        aiLogger.error('无法解析 JSON 响应')
        throw new Error('无法解析识别结果')
      }
    }

    // 6. 基本格式验证
    if (!validateBasicFormat(recognizedData)) {
      throw new Error('识别结果格式错误')
    }

    // 7. 清理数据
    recognizedData.items = recognizedData.items.filter(item => 
      item.name && typeof item.name === 'string' && item.name.trim().length > 0
    )

    // 标准化价格字段
    recognizedData.items = recognizedData.items.map(item => ({
      ...item,
      price: (typeof item.price === 'number' && item.price >= 0) ? item.price : null
    }))

    if (recognizedData.items.length === 0) {
      throw new Error('未识别到有效的商品信息')
    }

    // 8. 最终验证
    if (!validateResponse(recognizedData)) {
      throw new Error('识别结果验证失败')
    }

    const result: AIProcessingResult = {
      success: true,
      data: recognizedData,
    }

    return NextResponse.json(result)

  } catch (error) {
    aiLogger.error('Groq API 调用失败:', error)
    
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
} 