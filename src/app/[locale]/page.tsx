'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '../../store'

export default function Home() {
  const params = useParams()
  const router = useRouter()
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  const locale = params.locale as string
  const { setSessionId } = useAppStore()

  // 创建新会话并重定向到UUID URL
  const createNewSession = useCallback(async () => {
    if (isCreatingSession) return

    setIsCreatingSession(true)

    try {
      const response = await fetch('/api/session/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('创建会话失败')
      }

      const result = await response.json()

      if (result.success && result.uuid) {
        // 设置sessionId以启用自动保存
        setSessionId(result.uuid)
        // 重定向到新的UUID URL
        router.replace(`/${locale}/${result.uuid}`)
      } else {
        throw new Error('创建会话失败')
      }
    } catch (error) {
      console.error('创建会话错误:', error)
      setIsCreatingSession(false)
    }
  }, [isCreatingSession, router, locale, setSessionId])

  // 页面加载时自动创建新会话
  useEffect(() => {
    // 避免在服务端渲染时执行
    if (typeof window !== 'undefined') {
      createNewSession()
    }
  }, [createNewSession])

  // 显示加载状态
  return (
    <div className="min-h-screen bg-luxury-rich font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto mb-4"></div>
            <p className="text-luxury-darkGold">正在创建新会话...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
