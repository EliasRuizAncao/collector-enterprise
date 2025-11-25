/**
 * OfflineBanner - Banner superior que aparece cuando no hay conexión
 */

import { useState, useEffect } from 'react'
import { WifiOff, X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { useServiceWorker } from '../../hooks/useServiceWorker'

export interface OfflineBannerProps {
  /** Si mostrar el banner */
  show?: boolean
  /** Callback cuando se cierra */
  onDismiss?: () => void
  /** Duración antes de auto-ocultar (ms, 0 = no auto-hide) */
  autoHideDelay?: number
}

const OfflineBanner = ({
  show,
  onDismiss,
  autoHideDelay = 0,
}: OfflineBannerProps) => {
  const { isOnline } = useServiceWorker()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Mostrar cuando está offline
  useEffect(() => {
    if (show !== undefined) {
      setIsVisible(show && !isDismissed)
    } else {
      setIsVisible(!isOnline && !isDismissed)
    }
  }, [isOnline, show, isDismissed])

  // Auto-ocultar después de delay
  useEffect(() => {
    if (isVisible && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsDismissed(true)
        onDismiss?.()
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHideDelay, onDismiss])

  // Reset cuando vuelve conexión
  useEffect(() => {
    if (isOnline) {
      setIsDismissed(false)
    }
  }, [isOnline])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white',
        'flex items-center justify-between px-4 py-3 safe-area-top',
        'shadow-lg transition-all duration-300 ease-in-out',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <WifiOff className="h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Sin conexión a Internet</p>
          <p className="text-xs opacity-90">
            Algunas funcionalidades pueden estar limitadas
          </p>
        </div>
      </div>

      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-8 w-8 text-white hover:bg-white/20 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default OfflineBanner

