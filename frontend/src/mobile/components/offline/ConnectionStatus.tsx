/**
 * ConnectionStatus - Indicador de estado de conexión en header
 */

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import { useServiceWorker } from '../../hooks/useServiceWorker'
import { useSyncManager } from '../../hooks/useSyncManager'

export interface ConnectionStatusProps {
  /** Tamaño del indicador */
  size?: 'sm' | 'md' | 'lg'
  /** Si mostrar tooltip */
  showTooltip?: boolean
}

const ConnectionStatus = ({ size = 'md', showTooltip = true }: ConnectionStatusProps) => {
  const { isOnline } = useServiceWorker()
  const { status, lastSyncDate, pendingCount } = useSyncManager()
  const [connectionSpeed, setConnectionSpeed] = useState<'fast' | 'slow' | 'offline'>('fast')

  // Detectar velocidad de conexión
  useEffect(() => {
    if (!isOnline) {
      setConnectionSpeed('offline')
      return
    }

    // Detectar velocidad usando navigator.connection si está disponible
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      if (conn) {
        const updateSpeed = () => {
          const effectiveType = conn.effectiveType || '4g'
          if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            setConnectionSpeed('slow')
          } else {
            setConnectionSpeed('fast')
          }
        }

        updateSpeed()
        conn.addEventListener('change', updateSpeed)
        return () => conn.removeEventListener('change', updateSpeed)
      }
    }

    setConnectionSpeed('fast')
  }, [isOnline])

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  }

  const getStatus = () => {
    if (!isOnline) return 'offline'
    if (connectionSpeed === 'slow') return 'slow'
    return 'online'
  }

  const statusValue = getStatus()

  const getColor = () => {
    switch (statusValue) {
      case 'online':
        return 'bg-green-500'
      case 'slow':
        return 'bg-amber-500'
      case 'offline':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getIcon = () => {
    switch (statusValue) {
      case 'online':
        return <Wifi className={cn('text-green-600', sizeClasses[size])} />
      case 'slow':
        return <AlertCircle className={cn('text-amber-600', sizeClasses[size])} />
      case 'offline':
        return <WifiOff className={cn('text-red-600', sizeClasses[size])} />
      default:
        return null
    }
  }

  const getTooltipContent = () => {
    const parts: string[] = []

    if (statusValue === 'online') {
      parts.push('Conectado')
    } else if (statusValue === 'slow') {
      parts.push('Conexión lenta')
    } else {
      parts.push('Sin conexión')
    }

    if (lastSyncDate) {
      parts.push(`Última sync: ${lastSyncDate.toLocaleString('es-CL')}`)
    }

    if (pendingCount > 0) {
      parts.push(`${pendingCount} item${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''}`)
    }

    if (status === 'syncing') {
      parts.push('Sincronizando...')
    }

    return parts.join('\n')
  }

  const content = (
    <div className="flex items-center gap-2">
      {getIcon()}
      <div
        className={cn(
          'rounded-full border-2 border-white',
          sizeClasses[size],
          getColor(),
          'animate-pulse',
        )}
      />
    </div>
  )

  if (!showTooltip) {
    return content
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="flex items-center gap-2 cursor-pointer">
            {content}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs whitespace-pre-line">
            {getTooltipContent()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ConnectionStatus

