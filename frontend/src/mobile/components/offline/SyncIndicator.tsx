/**
 * SyncIndicator - Badge flotante con estado de sincronización
 */

import { useEffect, useState } from 'react'
import { CheckCircle2, RefreshCw, Clock, AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import { useSyncManager } from '../../hooks/useSyncManager'
import SyncStatusModal from './SyncStatusModal'

export interface SyncIndicatorProps {
  /** Posición del indicador */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Si mostrar siempre o solo cuando hay actividad */
  alwaysVisible?: boolean
}

const SyncIndicator = ({
  position = 'bottom-right',
  alwaysVisible = false,
}: SyncIndicatorProps) => {
  const { status, progress, pendingCount, errors } = useSyncManager()
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Mostrar éxito temporalmente
  useEffect(() => {
    if (status === 'completed' && progress.success > 0) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    } else {
      setShowSuccess(false)
    }
  }, [status, progress.success])

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  }

  // Determinar estado visual
  const getState = () => {
    if (showSuccess) return 'synced'
    if (status === 'syncing') return 'syncing'
    if (errors.length > 0) return 'error'
    if (pendingCount > 0) return 'pending'
    return 'idle'
  }

  const state = getState()

  // No mostrar si está idle y no hay pending (a menos que alwaysVisible)
  if (state === 'idle' && !alwaysVisible) {
    return null
  }

  const getIcon = () => {
    switch (state) {
      case 'synced':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600 animate-shake" />
      default:
        return null
    }
  }

  const getBadgeVariant = () => {
    switch (state) {
      case 'synced':
        return 'default'
      case 'syncing':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <>
      <div
        className={cn(
          'fixed z-50 transition-all duration-300',
          positionClasses[position],
          state === 'idle' ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
        )}
      >
        <Badge
          variant={getBadgeVariant()}
          className={cn(
            'cursor-pointer shadow-lg hover:shadow-xl transition-all',
            'flex items-center gap-2 px-3 py-2',
            state === 'syncing' && 'animate-pulse',
          )}
          onClick={() => setShowModal(true)}
        >
          {getIcon()}
          {state === 'syncing' && (
            <span className="text-xs font-medium">
              {progress.current}/{progress.total}
            </span>
          )}
          {state === 'pending' && (
            <span className="text-xs font-medium">{pendingCount}</span>
          )}
          {state === 'error' && (
            <span className="text-xs font-medium">{errors.length}</span>
          )}
        </Badge>
      </div>

      <SyncStatusModal open={showModal} onOpenChange={setShowModal} />
    </>
  )
}

export default SyncIndicator

