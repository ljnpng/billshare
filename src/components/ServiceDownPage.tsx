'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'

interface ServiceDownPageProps {
  message?: string
}

export default function ServiceDownPage({ message }: ServiceDownPageProps) {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const defaultMessage = "服务暂时不可用，我们正在努力修复中。请稍后再试。"

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Service Down Icon */}
        <div className="mx-auto w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
          <svg 
            className="w-12 h-12 text-amber-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            服务维护中
          </h2>
          <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full"></div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <p className="text-lg text-gray-600">
            {message || defaultMessage}
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg 
                className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
              <div className="text-sm text-amber-800">
                <p className="font-medium">数据库连接暂时中断</p>
                <p className="mt-1">
                  我们正在紧急修复此问题，预计很快恢复正常。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span>检查服务状态中...</span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            返回首页
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            刷新页面
          </button>
        </div>

        {/* Footer Info */}
        <div className="pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-400 space-y-1">
            <p>如果问题持续存在，请联系技术支持</p>
            <p>状态页面: <span className="text-blue-500">status.aapay.app</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}