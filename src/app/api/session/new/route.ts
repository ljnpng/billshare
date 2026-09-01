import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { sessionService, isStorageHealthy, DatabaseErrorType } from '../../../../lib/database';
import { AppState } from '../../../../types';

export async function POST(request: NextRequest) {
  try {
    // 检查当前存储后端健康状态
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

    const body = await request.json().catch(() => ({}));

    // A session is a share snapshot. It is created only when the user shares.
    const uuid = uuidv4();
    const sourceData = body.data && typeof body.data === 'object' ? body.data : {};
    const snapshotData: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'> = {
      people: sourceData.people || [],
      receipts: sourceData.receipts || [],
      currentStep: sourceData.currentStep || 'input',
    };

    // 保存到数据库
    const saveResult = await sessionService.saveSession(uuid, snapshotData);

    if (!saveResult.success) {
      // Handle different error types
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
