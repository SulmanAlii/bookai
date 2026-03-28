'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  progress?: Array<{
    label: string
    status: 'pending' | 'loading' | 'complete'
  }>
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Processing your request...',
  progress,
}) => {
  if (!isVisible) return null

  return (
    <div className="loading-wrapper">
      <div className="loading-shadow-wrapper">
        <div className="loading-shadow bg-[var(--bg-card)]">
          <Loader2 className="loading-animation w-12 h-12 text-[var(--accent-warm)]" />
          <div className="loading-title">{message}</div>
          
          {progress && progress.length > 0 && (
            <div className="loading-progress">
              {progress.map((item, index) => (
                <div key={index} className="loading-progress-item">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {item.label}
                  </span>
                  {item.status === 'complete' && (
                    <span className="text-green-600">✓</span>
                  )}
                  {item.status === 'loading' && (
                    <span className="loading-progress-status animate-spin">●</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay
