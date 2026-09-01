import { NextRequest, NextResponse } from 'next/server';
import { AIRecognizedReceipt, AIProcessingResult } from '@/types';
import { getReceiptAnalysisPrompt } from '@/lib/prompts';
import { aiLogger } from '@/lib/logger';
import { validateAndPreprocessImage, validateAIResponse, parseAIResponse } from '@/lib/imageUtils';
import { getErrorType } from '@/lib/errorMessages';

export const runtime = 'nodejs';
export const maxDuration = 60;

const fileToBase64 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  return `data:${file.type};base64,${base64}`;
};

const recognizeReceipt = async (file: File): Promise<AIRecognizedReceipt> => {
  const baseUrl = (process.env.OPENAI_COMPATIBLE_BASE_URL || '').replace(/\/$/, '');
  const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY;
  const model = process.env.OPENAI_COMPATIBLE_MODEL || 'qwen/qwen3.6-27b';

  if (!baseUrl || !apiKey) {
    throw new Error('OpenAI-compatible provider is not configured');
  }

  aiLogger.info('开始调用 OpenAI-compatible API...');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: getReceiptAnalysisPrompt() },
            { type: 'image_url', image_url: { url: await fileToBase64(file) } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible API ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('API响应为空');
  aiLogger.info('OpenAI-compatible API 调用成功');
  return parseAIResponse(content);
};

const cleanAndValidate = (data: AIRecognizedReceipt, fileName: string, fileSize: number): AIRecognizedReceipt => {
  if (!validateAIResponse(data)) {
    aiLogger.error('AI 响应验证失败', {
      recognizedData: JSON.stringify(data).substring(0, 500),
      fileName,
      fileSize,
    });
    throw new Error('formatError');
  }

  const originalItemsCount = data.items?.length || 0;

  data.items = data.items.filter((item) => item.name && typeof item.name === 'string' && item.name.trim().length > 0);

  data.items = data.items.map((item) => ({
    ...item,
    price: typeof item.price === 'number' && item.price >= 0 ? item.price : null,
  }));

  const amountFields = ['subtotal', 'tax', 'tip', 'total'] as const;
  for (const field of amountFields) {
    const value = data[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== 'number' || value < 0) {
        aiLogger.info(`清理无效金额字段 ${field}: ${value} -> undefined`);
        data[field] = undefined;
      }
    }
  }

  aiLogger.info('数据清理完成', {
    originalItemsCount,
    filteredItemsCount: data.items.length,
    businessName: data.businessName,
    fileName,
  });

  if (data.items.length === 0) {
    aiLogger.warn('清理后无有效商品项目', {
      originalItemsCount,
      businessName: data.businessName,
      fileName,
      fileSize,
    });
    throw new Error('noItemsFound');
  }

  return data;
};

export async function POST(request: NextRequest) {
  let file: File | null = null;
  try {
    const formData = await request.formData();
    file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: '未找到上传的文件' }, { status: 400 });
    }

    aiLogger.info('开始 AI 识别流程 (OpenAI-compatible)', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const processedFile = await validateAndPreprocessImage(file);

    let recognizedData = await recognizeReceipt(processedFile);

    aiLogger.info('AI 响应解析成功', {
      businessName: recognizedData.businessName,
      itemsCount: recognizedData.items?.length || 0,
    });

    recognizedData = cleanAndValidate(recognizedData, file.name, file.size);

    const result: AIProcessingResult = {
      success: true,
      data: recognizedData,
    };

    return NextResponse.json(result);
  } catch (error) {
    const errorDetails = {
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      timestamp: new Date().toISOString(),
    };

    aiLogger.error('AI 识别失败 (OpenAI-compatible)', errorDetails);

    let errorType = 'recognitionFailed';
    if (error instanceof Error) {
      errorType = getErrorType(error.message);
    }

    return NextResponse.json({ success: false, error: errorType }, { status: 500 });
  }
}
