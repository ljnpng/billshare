'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '../../../store';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function SharedDraftPage() {
  const params = useParams();
  const router = useRouter();
  const loadSharedSession = useAppStore(state => state.loadSharedSession);
  const [error, setError] = useState<string | null>(null);
  const uuid = params.uuid as string;

  useEffect(() => {
    if (!uuid || !UUID_PATTERN.test(uuid)) {
      setError('无效的分享链接格式');
      return;
    }

    let cancelled = false;

    const importSnapshot = async () => {
      const loaded = await loadSharedSession(uuid);
      if (cancelled) return;

      if (loaded) {
        router.replace('/');
      } else {
        setError('分享的账单不存在、已过期或暂时无法加载');
      }
    };

    importSnapshot();
    return () => {
      cancelled = true;
    };
  }, [loadSharedSession, router, uuid]);

  return (
    <div className="min-h-screen bg-luxury-rich flex items-center justify-center p-4">
      <div className="p-8 text-center max-w-md">
        {error ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">无法导入分享账单</h2>
            <p className="text-gray-600 mb-6 text-sm">{error}</p>
            <button
              onClick={() => router.replace('/')}
              className="px-5 py-2.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              返回当前草稿
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">正在用分享账单覆盖浏览器草稿...</p>
          </>
        )}
      </div>
    </div>
  );
}
