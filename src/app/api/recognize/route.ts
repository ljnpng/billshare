import { NextRequest, NextResponse } from 'next/server'
import Anthropic, { toFile } from '@anthropic-ai/sdk'
import { Groq } from 'groq-sdk'
import { AIRecognizedReceipt, AIProcessingResult } from '@/types'
import { AI_CONFIG } from '@/lib/config'
import { getReceiptAnalysisPrompt } from '@/lib/prompts'
import { aiLogger } from '@/lib/logger'
import { validateAndPreprocessImage, validateAIResponse, parseAIResponse } from '@/lib/imageUtils'
import { getErrorType } from '@/lib/errorMessages'

export const runtime = 'nodejs'
export const maxDuration = 60

// 服务端读取 provider 配置
const getProvider = () => (process.env.AI_PROVIDER || 'claude') as 'claude' | 'groq' | 'openai-compatible'

// 初始化 AI 客户端（懒加载）
let anthropicClient: Anthropic | null = null
let groqClient: Groq | null = null

const getAnthropicClient = () => {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || 'dummy-key-for-build',
    })
  }
  return anthropicClient
}

const getGroqClient = () => {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build',
    })
  }
  return groqClient
}

/**
 * 将图片文件转换为 base64 数据URL (Groq 用)
 */
const fileToBase64 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  return `data:${file.type};base64,${base64}`
}

/**
 * 上传文件到 Claude Files API
 */
const uploadToFilesAPI = async (file: File): Promise<string> => {
  const anthropic = getAnthropicClient()
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
}

/**
 * 使用 Claude 进行识别
 */
const recognizeWithClaude = async (file: File, locale: string): Promise<AIRecognizedReceipt> => {
  const anthropic = getAnthropicClient()

  const fileId = await uploadToFilesAPI(file)

  try {
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
            { type: 'text', text: getReceiptAnalysisPrompt(locale) },
            { type: 'image', source: { type: 'file', file_id: fileId } },
          ],
        },
      ],
    })

    aiLogger.info('Claude API 调用成功')

    const content = response.content[0]
    if (content.type !== 'text' || !content.text) {
      throw new Error('API响应为空')
    }

    return parseAIResponse(content.text)
  } finally {
    // 清理上传的文件
    try {
      await anthropic.beta.files.delete(fileId)
      aiLogger.info('临时文件已清理')
    } catch (cleanupError) {
      aiLogger.warn('清理临时文件失败:', cleanupError)
    }
  }
}

/**
 * 使用 Groq 进行识别
 */
const recognizeWithGroq = async (file: File, locale: string): Promise<AIRecognizedReceipt> => {
  const groq = getGroqClient()

  const imageBase64 = await fileToBase64(file)

  aiLogger.info('开始调用 Groq API...')

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: getReceiptAnalysisPrompt(locale) },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ],
      },
    ],
    model: AI_CONFIG.groq.model,
    temperature: AI_CONFIG.groq.temperature,
    max_tokens: AI_CONFIG.groq.maxTokens,
  })

  aiLogger.info('Groq API 调用成功')

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('API响应为空')
  }

  return parseAIResponse(content)
}

/** Use an OpenAI-compatible endpoint with image_url input. */
const recognizeWithOpenAICompatible = async (file: File, locale: string): Promise<AIRecognizedReceipt> => {
  const baseUrl = (process.env.OPENAI_COMPATIBLE_BASE_URL || '').replace(/\/$/, '')
  const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY
  const model = process.env.OPENAI_COMPATIBLE_MODEL || 'deepseek-v4-flash-vision-exp'

  if (!baseUrl || !apiKey) {
    throw new Error('OpenAI-compatible provider is not configured')
  }

  aiLogger.info('开始调用 OpenAI-compatible API...')
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: AI_CONFIG.groq.temperature,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: getReceiptAnalysisPrompt(locale) },
          { type: 'image_url', image_url: { url: await fileToBase64(file) } },
        ],
      }],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI-compatible API ${response.status}: ${await response.text()}`)
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('API响应为空')
  aiLogger.info('OpenAI-compatible API 调用成功')
  return parseAIResponse(content)
}

/**
 * 清理和验证识别结果
 */
const cleanAndValidate = (data: AIRecognizedReceipt, fileName: string, fileSize: number): AIRecognizedReceipt => {
  if (!validateAIResponse(data)) {
    aiLogger.error('AI 响应验证失败', {
      recognizedData: JSON.stringify(data).substring(0, 500),
      fileName,
      fileSize
    })
    throw new Error('formatError')
  }

  const originalItemsCount = data.items?.length || 0

  // 过滤无效项目
  data.items = data.items.filter(item =>
    item.name && typeof item.name === 'string' && item.name.trim().length > 0
  )

  // 标准化价格字段
  data.items = data.items.map(item => ({
    ...item,
    price: (typeof item.price === 'number' && item.price >= 0) ? item.price : null
  }))

  // 清理无效的金额字段（AI可能返回负数或非数字）
  const amountFields = ['subtotal', 'tax', 'tip', 'total'] as const
  for (const field of amountFields) {
    const value = data[field]
    if (value !== undefined && value !== null) {
      if (typeof value !== 'number' || value < 0) {
        aiLogger.info(`清理无效金额字段 ${field}: ${value} -> undefined`)
        data[field] = undefined
      }
    }
  }

  aiLogger.info('数据清理完成', {
    originalItemsCount,
    filteredItemsCount: data.items.length,
    businessName: data.businessName,
    fileName
  })

  if (data.items.length === 0) {
    aiLogger.warn('清理后无有效商品项目', {
      originalItemsCount,
      businessName: data.businessName,
      fileName,
      fileSize
    })
    throw new Error('noItemsFound')
  }

  return data
}

export async function POST(request: NextRequest) {
  let file: File | null = null
  let locale: string = 'zh'
  const provider = getProvider()

  try {
    const formData = await request.formData()
    file = formData.get('file') as File
    locale = formData.get('locale') as string || 'zh'

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到上传的文件' },
        { status: 400 }
      )
    }

    aiLogger.info(`开始 AI 识别流程 (provider: ${provider})`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    // 1. 验证并预处理图片
    const processedFile = await validateAndPreprocessImage(file)

    // 2. 根据 provider 调用对应的 AI 服务
    let recognizedData: AIRecognizedReceipt
    if (provider === 'groq') {
      recognizedData = await recognizeWithGroq(processedFile, locale)
    } else if (provider === 'openai-compatible') {
      recognizedData = await recognizeWithOpenAICompatible(processedFile, locale)
    } else {
      recognizedData = await recognizeWithClaude(processedFile, locale)
    }

    aiLogger.info('AI 响应解析成功', {
      businessName: recognizedData.businessName,
      itemsCount: recognizedData.items?.length || 0,
    })

    // 3. 清理和验证
    recognizedData = cleanAndValidate(recognizedData, file.name, file.size)

    const result: AIProcessingResult = {
      success: true,
      data: recognizedData,
    }

    return NextResponse.json(result)

  } catch (error) {
    const errorDetails = {
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      locale,
      timestamp: new Date().toISOString(),
      provider
    }

    aiLogger.error(`AI 识别失败 (${provider})`, errorDetails)

    let errorType = 'recognitionFailed'
    if (error instanceof Error) {
      errorType = getErrorType(error.message)
    }

    return NextResponse.json(
      { success: false, error: errorType },
      { status: 500 }
    )
  }
}
