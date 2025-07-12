'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '../../store'
import StepIndicator from '../../components/StepIndicator'
import SetupStep from '../../components/SetupStep'
import InputStep from '../../components/InputStep'
import AssignStep from '../../components/AssignStep'
import SummaryStep from '../../components/SummaryStep'
import ErrorAlert from '../../components/ErrorAlert'
import LanguageSwitcher from '../../components/LanguageSwitcher'

export default function Home() {
  const params = useParams()
  const router = useRouter()
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  
  const locale = params.locale as string
  const t = useTranslations()
  const { 
    currentStep, 
    error, 
    people,
    receipts,
    setCurrentStep,
    setSessionId,
  } = useAppStore()

  // 创建新会话并重定向到UUID URL
  const createNewSession = useCallback(async () => {
    console.log('createNewSession called, isCreatingSession:', isCreatingSession)
    if (isCreatingSession) return
    
    setIsCreatingSession(true)
    console.log('Starting session creation...')
    
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
      console.log('Session creation result:', result)
      
      if (result.success && result.uuid) {
        // 设置sessionId以启用自动保存
        setSessionId(result.uuid)
        // 重定向到新的UUID URL
        console.log('Redirecting to:', `/${locale}/${result.uuid}`)
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

  // 使用useEffect处理步骤逻辑，避免无限循环
  useEffect(() => {
    // 如果正在创建会话，跳过步骤逻辑
    if (isCreatingSession) return
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
  }, [currentStep, people.length, receipts, setCurrentStep, isCreatingSession])

  // 如果正在创建会话，显示加载状态
  if (isCreatingSession) {
    return (
      <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在创建新会话...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* 主页header - 简化版，不使用CollapsibleHeader */}
        <header className="relative text-center mb-6 sm:mb-8 p-6 bg-white">
          <div className="absolute top-4 right-4 z-10">
            <LanguageSwitcher />
          </div>
          <div className="mb-4 sm:mb-6 pt-8 sm:pt-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
            <div className="mt-2 sm:mt-3 mx-auto w-12 sm:w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            {t('app.description')}
          </p>
        </header>

        {error && <ErrorAlert message={error} />}
        
        {/* Sticky 步骤指示器 - 内容区域顶部固定 */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200/60 mb-6 sm:mb-8">
          <div className="py-3 sm:py-4">
            {/* 移动端紧凑版本 */}
            <div className="block sm:hidden px-4">
              <StepIndicator currentStep={currentStep} variant="compact" />
            </div>
            {/* 桌面端完整版本 */}
            <div className="hidden sm:block px-4">
              <StepIndicator currentStep={currentStep} variant="sticky" />
            </div>
          </div>
        </div>

        <main className="animation-fade-in px-4">
          {renderStep()}
        </main>
      </div>
    </div>
  )
} 