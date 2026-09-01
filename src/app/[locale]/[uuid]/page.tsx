'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '../../../store';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function SharedDraftPage() {
  const params = useParams();
  const router = useRouter();
  const tPreview = useTranslations('preview');
  const tCommon = useTranslations('common');
  const loadSharedSession = useAppStore(state => state.loadSharedSession);
  const [error, setError] = useState<string | null>(null);
  const uuid = params.uuid as string;

  useEffect(() => {
    if (!uuid || !UUID_PATTERN.test(uuid)) {
      setError(tPreview('invalidLink'));
      return;
    }

    let cancelled = false;

    const importSnapshot = async () => {
      const loaded = await loadSharedSession(uuid);
      if (cancelled) return;

      if (loaded) {
        router.replace('/');
      } else {
        setError(tPreview('notFound'));
      }
    };

    importSnapshot();
    return () => {
      cancelled = true;
    };
  }, [loadSharedSession, router, tPreview, uuid]);

  return (
    <div className="min-h-screen bg-luxury-rich flex items-center justify-center p-4">
      <div className="p-8 text-center max-w-md">
        {error ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{tPreview('cannotLoad')}</h2>
            <p className="text-gray-600 mb-6 text-sm">{error}</p>
            <button
              onClick={() => router.replace('/')}
              className="btn btn-primary"
            >
              {tCommon('back')}
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">{tPreview('loading')}</p>
          </>
        )}
      </div>
    </div>
  );
}
