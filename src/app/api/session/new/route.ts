import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { sessionService } from '../../../../lib/database';
import { AppState } from '../../../../types';

export async function POST(request: NextRequest) {
  try {
    // 创建新的会话UUID
    const uuid = uuidv4();
    
    // 初始化空的会话数据
    const initialData: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'> = {
      people: [],
      receipts: [],
      currentStep: 'setup'
    };
    
    // 保存到数据库
    const success = await sessionService.saveSession(uuid, initialData);
    
    if (!success) {
      return NextResponse.json(
        { error: '创建会话失败' },
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