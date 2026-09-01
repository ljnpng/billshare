import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { sessionService, isStorageHealthy, DatabaseErrorType } from '../../../../lib/database';
import { AppState } from '../../../../types';

export async function POST(request: NextRequest) {
  try {
    const healthCheck = await isStorageHealthy();
    if (!healthCheck.success) {
      return NextResponse.json(
        {
          error: '数据库服务不可用',
          errorType: 'SERVICE_UNAVAILABLE',
          message: '服务暂时不可用，请稍后再试',
        },
        { status: 503 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '请求体必须是合法 JSON' }, { status: 400 });
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: '请求体必须是 JSON 对象' }, { status: 400 });
    }

    const uuid = uuidv4();
    const sourceData =
      'data' in body && body.data && typeof body.data === 'object' && !Array.isArray(body.data)
        ? (body.data as Record<string, unknown>)
        : {};
    const snapshotData: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'> = {
      people: (sourceData.people as AppState['people'] | undefined) || [],
      receipts: (sourceData.receipts as AppState['receipts'] | undefined) || [],
      currentStep: (sourceData.currentStep as AppState['currentStep'] | undefined) || 'input',
    };

    const saveResult = await sessionService.saveSession(uuid, snapshotData);

    if (!saveResult.success) {
      if (saveResult.error?.type === DatabaseErrorType.CONNECTION_ERROR) {
        return NextResponse.json(
          {
            error: '数据库服务不可用',
            errorType: 'SERVICE_UNAVAILABLE',
            message: '服务暂时不可用，请稍后再试',
          },
          { status: 503 },
        );
      }

      return NextResponse.json({ error: saveResult.error?.message || '创建会话失败' }, { status: 500 });
    }

    return NextResponse.json({
      uuid,
      data: snapshotData,
      success: true,
    });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
