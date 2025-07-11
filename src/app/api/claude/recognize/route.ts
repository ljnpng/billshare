import { NextRequest, NextResponse } from 'next/server'
import Anthropic, { toFile } from '@anthropic-ai/sdk'
import { AIRecognizedReceipt, AIProcessingResult } from '@/types'
import { AI_CONFIG } from '@/lib/config'
import { COMPLETE_RECEIPT_PROMPT } from '@/lib/prompts'
import { aiLogger } from '@/lib/logger'
import convert from 'heic-convert'

// 配置API路由
export const runtime = 'nodejs'
export const maxDuration = 60

// 初始化Anthropic客户端
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

/**
 * 检查文件是否为支持的图片格式
 */
const isSupportedImageFormat = (mimeType: string): boolean => {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
  return supportedTypes.includes(mimeType)
}

/**
 * 检查文件是否为 HEIC 格式
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
    
    // 将 ArrayBuffer 转换为 Buffer
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
 * 上传文件到 Claude Files API
 */
const uploadToFilesAPI = async (file: File): Promise<string> => {
  try {
    aiLogger.info('开始上传文件到 Files API...')

    const fileUpload = await anthropic.beta.files.upload({
      file: await toFile(file, file.name, { type: file.type }),
      betas: ['files-api-2025-04-14'],
    })

    aiLogger.info('文件上传成功', {
      fileId: fileUpload.id,
      fileName: file.name,
      fileSize: file.size,
    })

    return fileUpload.id
  } catch (error) {
    aiLogger.error('文件上传失败:', error)
    throw new Error('文件上传失败')
  }
}

/**
 * 基本格式验证
 */
const validateBasicFormat = (response: any): boolean => {
  if (typeof response !== 'object' || response === null) {
    aiLogger.warn('验证失败：响应不是有效的对象')
    return false
  }

  if (!Array.isArray(response.items)) {
    aiLogger.warn('验证失败：缺少 items 数组')
    return false
  }

  return true
}

/**
 * 验证AI响应格式
 */
const validateResponse = (response: any): boolean => {
  if (!validateBasicFormat(response)) {
    return false
  }

  if (response.items.length === 0) {
    aiLogger.warn('验证失败：items 数组为空')
    return false
  }

  // 检查每个商品项目
  for (let i = 0; i < response.items.length; i++) {
    const item = response.items[i]
    if (!item.name || typeof item.name !== 'string') {
      aiLogger.warn(`验证失败：商品 ${i + 1} 缺少有效的 name`)
      return false
    }
    if (item.price !== null && item.price !== undefined && 
        (typeof item.price !== 'number' || item.price < 0)) {
      aiLogger.warn(`验证失败：商品 ${i + 1} 的 price 格式错误`)
      return false
    }
  }

  // 检查金额数据
  const amountFields = ['subtotal', 'tax', 'tip', 'total']
  for (const field of amountFields) {
    if (response[field] !== undefined && response[field] !== null) {
      if (typeof response[field] !== 'number' || response[field] < 0) {
        aiLogger.warn(`验证失败：${field} 不是有效的数字`)
        return false
      }
    }
  }

  return true
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

    aiLogger.info('开始 AI 识别流程...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    // 1. 预处理图片（转换 HEIC 格式）
    let processedFile = file
    if (isHeicFormat(file)) {
      processedFile = await convertHeicToJpeg(file)
    }

    // 2. 上传到 Files API
    const fileId = await uploadToFilesAPI(processedFile)

    // 3. 调用 Claude API 进行识别
    aiLogger.info('开始调用 Claude API...')

    const response = await anthropic.beta.messages.create({
      model: AI_CONFIG.claude.model,
      max_tokens: AI_CONFIG.claude.maxTokens,
      temperature: AI_CONFIG.claude.temperature,
      betas: [...AI_CONFIG.claude.betas],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: COMPLETE_RECEIPT_PROMPT,
            },
            {
              type: 'image',
              source: {
                type: 'file',
                file_id: fileId,
              },
            },
          ],
        },
      ],
    })

    aiLogger.info('Claude API 调用成功')

    // 4. 解析响应
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('无效的API响应格式')
    }

    const responseText = content.text
    if (!responseText) {
      throw new Error('API响应为空')
    }

    // 5. 解析 JSON 结果
    let recognizedData: AIRecognizedReceipt
    try {
      recognizedData = JSON.parse(responseText)
      aiLogger.info('JSON 直接解析成功')
    } catch (e) {
      // 如果直接解析失败，尝试提取 JSON 部分
      aiLogger.warn('JSON 直接解析失败，尝试提取 JSON 部分')
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
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

    // 9. 清理上传的文件
    try {
      await anthropic.beta.files.delete(fileId)
      aiLogger.info('临时文件已清理')
    } catch (cleanupError) {
      aiLogger.warn('清理临时文件失败:', cleanupError)
    }

    const result: AIProcessingResult = {
      success: true,
      data: recognizedData,
    }

    return NextResponse.json(result)

  } catch (error) {
    aiLogger.error('AI 识别失败:', error)
    
    const result: AIProcessingResult = {
      success: false,
      error: error instanceof Error ? error.message : '识别失败',
    }

    return NextResponse.json(result, { status: 500 })
  }
} 