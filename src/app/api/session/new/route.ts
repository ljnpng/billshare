import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { sessionService, isRedisHealthy, DatabaseErrorType } from '../../../../lib/database';
import { AppState } from '../../../../types';

export async function POST(request: NextRequest) {
  try {
    // 检查Redis健康状态
    const healthCheck = await isRedisHealthy();
    if (!healthCheck.success) {
      return NextResponse.json(
        { 
          error: '数据库服务不可用',
          errorType: 'SERVICE_UNAVAILABLE',
          message: '服务暂时不可用，请稍后再试'
        },
        { status: 503 }
      );
    }
    
    // 创建新的会话UUID
    const uuid = uuidv4();
    
    // 初始化空的会话数据
    const initialData: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'> = {
      people: [],
      receipts: [],
      currentStep: 'setup'
    };
    
    // 保存到数据库
    const saveResult = await sessionService.saveSession(uuid, initialData);
    
    if (!saveResult.success) {
      // Handle different error types
      if (saveResult.error?.type === DatabaseErrorType.CONNECTION_ERROR) {
        return NextResponse.json(
          { 
            error: '数据库服务不可用',
            errorType: 'SERVICE_UNAVAILABLE',
            message: '服务暂时不可用，请稍后再试'
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: saveResult.error?.message || '创建会话失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      uuid,
      data: initialData,
      success: true
    });
    
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}