'use client'

import React, { useEffect } from 'react'
import { useAppStore } from '../store'
import StepIndicator from '../components/StepIndicator'
import SetupStep from '../components/SetupStep'
import InputStep from '../components/InputStep'
import AssignStep from '../components/AssignStep'
import SummaryStep from '../components/SummaryStep'
import ErrorAlert from '../components/ErrorAlert'

export default function Home() {
  const { 
    currentStep, 
    error, 
    people,
    receipts,
    setCurrentStep,
  } = useAppStore()

  // 使用useEffect处理步骤逻辑，避免无限循环
  useEffect(() => {
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
  }, [currentStep, people.length, receipts, setCurrentStep])

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
    <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 sm:mb-12">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              AAP费用分摊
            </h1>
            <div className="mt-3 sm:mt-4 mx-auto w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            智能分摊餐费、税费和小费，让每个人都支付合理的份额
          </p>
        </header>

        {error && <ErrorAlert message={error} />}
        
        <div className="mb-12">
          <StepIndicator currentStep={currentStep} />
        </div>

        <main className="animation-fade-in">
          {renderStep()}
        </main>
      </div>
    </div>
  )
} 