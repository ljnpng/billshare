import { NextRequest, NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'
import { AIRecognizedReceipt, AIProcessingResult } from '@/types'
import { AI_CONFIG } from '@/lib/config'
import { COMPLETE_RECEIPT_PROMPT } from '@/lib/prompts'
import { aiLogger } from '@/lib/logger'
import { validateAndPreprocessImage, validateAIResponse, parseAIResponse } from '@/lib/imageUtils'

// 配置API路由
export const runtime = 'nodejs'

// 初始化 Groq 客户端
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build',
})



/**
 * 将图片文件转换为 base64 数据URL
 */
const fileToBase64 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  return `data:${file.type};base64,${base64}`
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

    aiLogger.info('开始 Groq AI 识别流程...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    // 1. 验证并预处理图片
    const processedFile = await validateAndPreprocessImage(file)

    // 2. 将图片转换为 base64
    const imageBase64 = await fileToBase64(processedFile)

    // 3. 调用 Groq API 进行识别
    aiLogger.info('开始调用 Groq API...')

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
    const recognizedData: AIRecognizedReceipt = parseAIResponse(content)

    // 6. 验证响应格式
    if (!validateAIResponse(recognizedData)) {
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