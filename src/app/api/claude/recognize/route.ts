import { NextRequest, NextResponse } from 'next/server'
import Anthropic, { toFile } from '@anthropic-ai/sdk'
import { AIRecognizedReceipt, AIProcessingResult } from '@/types'
import { AI_CONFIG } from '@/lib/config'
import { getReceiptAnalysisPrompt } from '@/lib/prompts'
import { aiLogger } from '@/lib/logger'
import { validateAndPreprocessImage, validateAIResponse, parseAIResponse } from '@/lib/imageUtils'
import { getErrorType } from '@/lib/errorMessages'

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
    let recognizedData: AIRecognizedReceipt;
    try {
      recognizedData = parseAIResponse(responseText);
      aiLogger.info('AI 响应解析成功', {
        businessName: recognizedData.businessName,
        itemsCount: recognizedData.items?.length || 0,
        hasSubtotal: recognizedData.subtotal !== undefined,
        hasTax: recognizedData.tax !== undefined,
        hasTip: recognizedData.tip !== undefined,
        hasTotal: recognizedData.total !== undefined
      });
    } catch (parseError) {
      aiLogger.error('AI 响应解析失败', {
        parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
        responseText: responseText.substring(0, 1000),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      throw new Error('formatError');
    }
    
    // 6. 验证响应格式
    if (!validateAIResponse(recognizedData)) {
      aiLogger.error('AI 响应验证失败', {
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
    
    aiLogger.info('数据清理完成', {
      originalItemsCount,
      filteredItemsCount,
      businessName: recognizedData.businessName,
      fileName: file.name
    });

    if (recognizedData.items.length === 0) {
      aiLogger.warn('清理后无有效商品项目', {
        originalItemsCount,
        businessName: recognizedData.businessName,
        fileName: file.name,
        fileSize: file.size,
        originalItems: JSON.stringify(recognizedData.items).substring(0, 500)
      });
      throw new Error('noItemsFound');
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
    // 构建详细的错误信息用于开发者调试
    const errorDetails = {
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      locale,
      timestamp: new Date().toISOString(),
      provider: 'claude'
    };
    
    aiLogger.error('Claude AI 识别失败', errorDetails);
    
    // 返回错误类型，由前端进行国际化处理
    let errorType = 'recognitionFailed';
    if (error instanceof Error) {
      errorType = getErrorType(error.message);
    }
    
    const result: AIProcessingResult = {
      success: false,
      error: errorType,
    };

    return NextResponse.json(result, { status: 500 })
  }
} 