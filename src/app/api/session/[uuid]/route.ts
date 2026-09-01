import { NextRequest, NextResponse } from 'next/server';
import { sessionService, DatabaseErrorType } from '../../../../lib/database';

interface RouteParams {
  params: Promise<{ uuid: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { uuid } = await params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return NextResponse.json({ error: '无效的会话ID格式' }, { status: 400 });
    }

    const sessionResult = await sessionService.getSession(uuid);

    if (!sessionResult.success) {
      if (sessionResult.error?.type === DatabaseErrorType.CONNECTION_ERROR) {
        return NextResponse.json(
          {
            error: '数据库服务不可用',
            errorType: 'SERVICE_UNAVAILABLE',
            message: '服务暂时不可用，请稍后再试',
          },
          { status: 503 },
        );
      }

      if (sessionResult.error?.type === DatabaseErrorType.SESSION_NOT_FOUND) {
        return NextResponse.json({ error: '会话不存在' }, { status: 404 });
      }

      return NextResponse.json({ error: sessionResult.error?.message || '服务器内部错误' }, { status: 500 });
    }

    const sessionData = sessionResult.data!;
    return NextResponse.json({
      uuid: sessionData.uuid,
      data: sessionData.data,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
      success: true,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { uuid } = await params;

    const deleteResult = await sessionService.deleteSession(uuid);

    if (!deleteResult.success) {
      if (deleteResult.error?.type === DatabaseErrorType.CONNECTION_ERROR) {
        return NextResponse.json(
          {
            error: '数据库服务不可用',
            errorType: 'SERVICE_UNAVAILABLE',
            message: '服务暂时不可用，请稍后再试',
          },
          { status: 503 },
        );
      }

      return NextResponse.json({ error: deleteResult.error?.message || '删除会话失败' }, { status: 500 });
    }

    if (!deleteResult.data) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    return NextResponse.json({
      uuid,
      success: true,
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
