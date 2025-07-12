'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '../../../store'
import StepIndicator from '../../../components/StepIndicator'
import SetupStep from '../../../components/SetupStep'
import InputStep from '../../../components/InputStep'
import AssignStep from '../../../components/AssignStep'
import SummaryStep from '../../../components/SummaryStep'
import ErrorAlert from '../../../components/ErrorAlert'
import CollapsibleHeader from '../../../components/CollapsibleHeader'

interface SessionPageProps {}

export default function SessionPage({}: SessionPageProps) {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  
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
        const success = await loadSession(uuid)
        
        if (!success) {
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

  // 步骤逻辑保持与原页面一致
  useEffect(() => {
    if (isLoading || sessionError) return

    // 如果人员少于2人，强制留在设置步骤
    if (currentStep !== 'setup' && people.length < 2) {
      setCurrentStep('setup')
      return
    }

    // 如果没有收据，也停留在输入步骤
    if (currentStep !== 'setup' && receipts.length === 0) {
      setCurrentStep('input')
      return
    }
    
    const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0)

    // 如果进入分配步骤，但没有条目，则退回输入步骤
    if (currentStep === 'assign' && totalItems === 0) {
      setCurrentStep('input')
      return
    }

    // 如果进入汇总步骤，但有条目未分配，则退回分配步骤
    const isAllAssigned = receipts.flatMap(r => r.items).every(item => item.assignedTo.length > 0)
    if (currentStep === 'summary' && totalItems > 0 && !isAllAssigned) {
      setCurrentStep('assign')
      return
    }
  }, [currentStep, people.length, receipts, setCurrentStep, isLoading, sessionError])

  const renderStep = () => {
    switch (currentStep) {
      case 'setup':
        return <SetupStep />
      case 'input':
        return <InputStep />
      case 'assign':
        return <AssignStep />
      case 'summary':
        return <SummaryStep />
      default:
        return <SetupStep />
    }
  }

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载会话数据...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 显示会话错误
  if (sessionError) {
    return (
      <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">会话访问失败</h2>
            <p className="text-gray-600 mb-6">{sessionError}</p>
            <button
              onClick={() => router.push(`/${locale}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建新会话
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 可折叠头部 */}
      <CollapsibleHeader
        uuid={uuid}
        isCollapsed={isHeaderCollapsed}
        onToggle={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
        autoCollapse={true}
        currentStep={currentStep}
      />

      {/* Sticky 步骤指示器 - 内容区域顶部固定 */}
      <div className={`sticky z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200/60 transition-all duration-300 ${
        isHeaderCollapsed ? 'top-12' : 'top-[84px]'
      }`}>
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4">
          {/* 移动端紧凑版本 */}
          <div className="block sm:hidden">
            <StepIndicator currentStep={currentStep} variant="compact" />
          </div>
          {/* 桌面端完整版本 */}
          <div className="hidden sm:block">
            <StepIndicator currentStep={currentStep} variant="sticky" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {error && (
          <div className="py-4">
            <ErrorAlert message={error} />
          </div>
        )}
        
        <main className="animation-fade-in py-6">
          {renderStep()}
        </main>
      </div>
    </div>
  )
}