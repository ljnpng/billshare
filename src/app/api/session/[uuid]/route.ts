import { NextRequest, NextResponse } from 'next/server';
import { sessionService, isRedisHealthy, DatabaseErrorType } from '../../../../lib/database';
import { AppState } from '../../../../types';

interface RouteParams {
  params: Promise<{ uuid: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { uuid } = await params;
    
    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return NextResponse.json(
        { error: '无效的会话ID格式' },
        { status: 400 }
      );
    }
    
    const sessionResult = await sessionService.getSession(uuid);
    
    if (!sessionResult.success) {
      // Handle different error types
      if (sessionResult.error?.type === DatabaseErrorType.CONNECTION_ERROR) {
        return NextResponse.json(
          { 
            error: '数据库服务不可用',
            errorType: 'SERVICE_UNAVAILABLE',
            message: '服务暂时不可用，请稍后再试'
          },
          { status: 503 }
        );
      }
      
      if (sessionResult.error?.type === DatabaseErrorType.SESSION_NOT_FOUND) {
        return NextResponse.json(
          { error: '会话不存在' },
          { status: 404 }
        );
      }
      
      // Other errors
      return NextResponse.json(
        { error: sessionResult.error?.message || '服务器内部错误' },
        { status: 500 }
      );
    }
    
    const sessionData = sessionResult.data!;
    return NextResponse.json({
      uuid: sessionData.uuid,
      data: sessionData.data,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
      success: true
    });
    
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { uuid } = await params;
    
    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return NextResponse.json(
        { error: '无效的会话ID格式' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // 验证数据格式
    if (!body.data || typeof body.data !== 'object') {
      return NextResponse.json(
        { error: '无效的数据格式' },
        { status: 400 }
      );
    }
    
    // 提取需要持久化的数据（排除临时UI状态）
    const { data } = body;
    const persistData: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'> = {
      people: data.people || [],
      receipts: data.receipts || [],
      currentStep: data.currentStep || 'setup'
    };
    
    // 保存到数据库
    const saveResult = await sessionService.saveSession(uuid, persistData);
    
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
        { error: saveResult.error?.message || '保存会话失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      uuid,
      data: persistData,
      success: true
    });
    
  } catch (error) {
    console.error('Save session error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { uuid } = await params;
    
    const deleteResult = await sessionService.deleteSession(uuid);
    
    if (!deleteResult.success) {
      // Handle different error types
      if (deleteResult.error?.type === DatabaseErrorType.CONNECTION_ERROR) {
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
        { error: deleteResult.error?.message || '删除会话失败' },
        { status: 500 }
      );
    }
    
    // Check if session was actually deleted
    if (!deleteResult.data) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      uuid,
      success: true
    });
    
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}