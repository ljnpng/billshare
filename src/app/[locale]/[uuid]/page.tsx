'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '../../../store'
import InputStep from '../../../components/InputStep'
import AssignStep from '../../../components/AssignStep'
import SummaryStep from '../../../components/SummaryStep'
import ErrorAlert from '../../../components/ErrorAlert'
import MinimalFooter from '../../../components/MinimalFooter'
import ServiceDownPage from '../../../components/ServiceDownPage'

interface SessionPageProps {}

export default function SessionPage({}: SessionPageProps) {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isServiceDown, setIsServiceDown] = useState(false)
  const [serviceDownMessage, setServiceDownMessage] = useState<string>('')

  const {
    currentStep,
    error,
    people,
    receipts,
    setCurrentStep,
    loadSession,
    sessionId,
    isSessionLoaded,
    setSessionId
  } = useAppStore()

  const uuid = params.uuid as string
  const locale = params.locale as string

  // 验证UUID格式
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  // 创建新会话并重定向
  const createNewSession = useCallback(async () => {
    try {
      const response = await fetch('/api/session/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      // Handle service unavailable
      if (response.status === 503) {
        const result = await response.json()
        console.error('Service unavailable when creating session:', result.message)
        setIsServiceDown(true)
        setServiceDownMessage(result.message || '服务暂时不可用，请稍后再试')
        setIsLoading(false)
        return
      }
      
      if (!response.ok) {
        throw new Error('创建会话失败')
      }
      
      const result = await response.json()
      
      if (result.success && result.uuid) {
        // 重定向到新的有效UUID
        router.replace(`/${locale}/${result.uuid}`)
      } else {
        throw new Error('创建会话失败')
      }
    } catch (error) {
      console.error('创建新会话错误:', error)
      setSessionError('创建新会话失败，请刷新页面重试')
      setIsLoading(false)
    }
  }, [router, locale])

  useEffect(() => {
    if (!uuid) return

    // 验证UUID格式，如果无效则创建新会话
    if (!isValidUUID(uuid)) {
      console.log('Invalid UUID format, creating new session:', uuid)
      createNewSession()
      return
    }

    // 如果已经加载了这个会话，跳过
    if (sessionId === uuid && isSessionLoaded) {
      setIsLoading(false)
      return
    }

    // 使用store的loadSession方法加载会话数据
    const loadSessionData = async () => {
      try {
        const result = await loadSession(uuid)
        
        // Check if service is down using proper type guard
        if (typeof result === 'object' && result !== null && 'error' in result) {
          const errorResult = result as { error: string; message: string }
          if (errorResult.error === 'SERVICE_UNAVAILABLE') {
            console.error('Service unavailable when loading session:', errorResult.message)
            setIsServiceDown(true)
            setServiceDownMessage(errorResult.message || '服务暂时不可用，请稍后再试')
            setIsLoading(false)
            return
          }
        }
        
        if (!result) {
          console.log('Session not found or expired, creating new session')
          createNewSession()
          return
        } else {
          // 会话加载成功，设置sessionId以启用自动保存
          setSessionId(uuid)
        }
      } catch (error) {
        console.error('加载会话错误:', error)
        setSessionError('加载会话失败，请检查网络连接')
      } finally {
        setIsLoading(false)
      }
    }

    loadSessionData()
  }, [uuid, sessionId, isSessionLoaded, loadSession, setSessionId, createNewSession])

  // 步骤逻辑
  useEffect(() => {
    if (isLoading || sessionError) return

    const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0)

    // If on assign step but no items, go back to input
    if (currentStep === 'assign' && totalItems === 0) {
      setCurrentStep('input')
      return
    }

    // If on assign step but less than 2 people, go to summary (bill-only mode)
    if (currentStep === 'assign' && people.length < 2) {
      setCurrentStep('summary')
      return
    }

    // If on summary with 2+ people, check all items are assigned
    if (currentStep === 'summary' && people.length >= 2) {
      const isAllAssigned = receipts.flatMap(r => r.items).every(item => item.assignedTo.length > 0)
      if (totalItems > 0 && !isAllAssigned) {
        setCurrentStep('assign')
        return
      }
    }
  }, [currentStep, people.length, receipts, setCurrentStep, isLoading, sessionError])

  const renderStep = () => {
    switch (currentStep) {
      case 'input':
        return <InputStep />
      case 'assign':
        return <AssignStep />
      case 'summary':
        return <SummaryStep />
      default:
        return <InputStep />
    }
  }

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-luxury-rich flex items-center justify-center p-4">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-700 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">正在加载...</p>
        </div>
      </div>
    )
  }

  // 显示服务维护页面
  if (isServiceDown) {
    return <ServiceDownPage message={serviceDownMessage} />
  }

  // 显示会话错误
  if (sessionError) {
    return (
      <div className="min-h-screen bg-luxury-rich flex items-center justify-center p-4">
        <div className="p-8 text-center max-w-md">
          <div className="mx-auto w-12 h-12 border border-red-200 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">会话访问失败</h2>
          <p className="text-gray-600 mb-6 text-sm">{sessionError}</p>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="px-5 py-2.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            创建新会话
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxury-rich">
      {/* Main content area with padding for footer */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-20">
        {error && (
          <div className="mb-4">
            <ErrorAlert message={error} />
          </div>
        )}

        <main className="animation-fade-in">
          {renderStep()}
        </main>
      </div>

      {/* Minimal footer */}
      <MinimalFooter showAutoSave={!!uuid} />
    </div>
  )
}
