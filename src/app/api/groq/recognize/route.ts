import { NextRequest, NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'
import { AIRecognizedReceipt, AIProcessingResult } from '@/types'
import { AI_CONFIG } from '@/lib/config'
import { getReceiptAnalysisPrompt } from '@/lib/prompts'
import { aiLogger } from '@/lib/logger'
import { validateAndPreprocessImage, validateAIResponse, parseAIResponse } from '@/lib/imageUtils'
import { getErrorType } from '@/lib/errorMessages'

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
  let file: File | null = null;
  let locale: string = 'zh';
  
  try {
    // 获取上传的文件和语言参数
    const formData = await request.formData()
    file = formData.get('file') as File
    locale = formData.get('locale') as string || 'zh'

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
              text: getReceiptAnalysisPrompt(locale),
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
    let recognizedData: AIRecognizedReceipt;
    try {
      recognizedData = parseAIResponse(content);
      aiLogger.info('Groq AI 响应解析成功', {
        businessName: recognizedData.businessName,
        itemsCount: recognizedData.items?.length || 0,
        hasSubtotal: recognizedData.subtotal !== undefined,
        hasTax: recognizedData.tax !== undefined,
        hasTip: recognizedData.tip !== undefined,
        hasTotal: recognizedData.total !== undefined
      });
    } catch (parseError) {
      aiLogger.error('Groq AI 响应解析失败', {
        parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
        responseContent: content.substring(0, 1000),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      throw new Error('formatError');
    }

    // 6. 验证响应格式
    if (!validateAIResponse(recognizedData)) {
      aiLogger.error('Groq AI 响应验证失败', {
        recognizedData: JSON.stringify(recognizedData).substring(0, 500),
        fileName: file.name,
        fileSize: file.size
      });
      throw new Error('formatError');
    }

    // 7. 清理数据
    const originalItemsCount = recognizedData.items?.length || 0;
    recognizedData.items = recognizedData.items.filter(item => 
      item.name && typeof item.name === 'string' && item.name.trim().length > 0
    );

    // 标准化价格字段
    recognizedData.items = recognizedData.items.map(item => ({
      ...item,
      price: (typeof item.price === 'number' && item.price >= 0) ? item.price : null
    }));

    const filteredItemsCount = recognizedData.items.length;
    
    aiLogger.info('Groq 数据清理完成', {
      originalItemsCount,
      filteredItemsCount,
      businessName: recognizedData.businessName,
      fileName: file.name
    });

    if (recognizedData.items.length === 0) {
      aiLogger.warn('Groq 清理后无有效商品项目', {
        originalItemsCount,
        businessName: recognizedData.businessName,
        fileName: file.name,
        fileSize: file.size,
        originalItems: JSON.stringify(recognizedData.items).substring(0, 500)
      });
      throw new Error('noItemsFound');
    }

    const result: AIProcessingResult = {
      success: true,
      data: recognizedData,
    }

    return NextResponse.json(result)

  } catch (error) {
    // 构建详细的错误信息用于开发者调试
    const errorDetails = {
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      locale,
      timestamp: new Date().toISOString(),
      provider: 'groq'
    };
    
    aiLogger.error('Groq AI 识别失败', errorDetails);
    
    // 返回错误类型，由前端进行国际化处理
    let errorType = 'recognitionFailed';
    if (error instanceof Error) {
      errorType = getErrorType(error.message);
    }
    
    return NextResponse.json(
      { success: false, error: errorType },
      { status: 500 }
    )
  }
} 