import { NextRequest, NextResponse } from 'next/server'
import Anthropic, { toFile } from '@anthropic-ai/sdk'
import { AIRecognizedReceipt, AIProcessingResult } from '@/types'
import { AI_CONFIG } from '@/lib/config'
import { getReceiptAnalysisPrompt } from '@/lib/prompts'
import { aiLogger } from '@/lib/logger'
import { validateAndPreprocessImage, validateAIResponse, parseAIResponse } from '@/lib/imageUtils'

// 配置API路由
export const runtime = 'nodejs'
export const maxDuration = 60

// 初始化Anthropic客户端
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || 'dummy-key-for-build',
})



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



export async function POST(request: NextRequest) {
  try {
    // 获取上传的文件和语言参数
    const formData = await request.formData()
    const file = formData.get('file') as File
    const locale = formData.get('locale') as string || 'zh'

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到上传的文件' },
        { status: 400 }
      )
    }

    aiLogger.info('开始 AI 识别流程...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    // 1. 验证并预处理图片
    const processedFile = await validateAndPreprocessImage(file)

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
              text: getReceiptAnalysisPrompt(locale),
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

    // 5. 解析和验证 JSON 结果
    const recognizedData: AIRecognizedReceipt = parseAIResponse(responseText)
    
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