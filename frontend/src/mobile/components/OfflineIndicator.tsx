import { CloudOff, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import type { SyncStatus } from '../hooks/useOfflineAssignments'

/**
 * Props del componente OfflineIndicator
 */
interface OfflineIndicatorProps {
  /**
   * Si está online
   */
  isOnline: boolean
  /**
   * Estado de sincronización
   */
  syncStatus: SyncStatus
  /**
   * Número de cambios pendientes
   */
  pendingChanges?: number
  /**
   * Clase CSS adicional
   */
  className?: string
}

/**
 * Componente para mostrar indicador de estado offline/online y sincronización
 */
const OfflineIndicator = ({
  isOnline,
  syncStatus,
  pendingChanges = 0,
  className,
}: OfflineIndicatorProps) => {
  if (isOnline && syncStatus === 'synced' && pendingChanges === 0) {
    // Todo sincronizado, no mostrar nada o mostrar check sutil
    return null
  }

  const getBadgeContent = () => {
    if (!isOnline) {
      return (
        <>
          <CloudOff className="h-3 w-3" />
          <span className="text-xs font-medium">Offline</span>
        </>
      )
    }

    switch (syncStatus) {
      case 'syncing':
        return (
          <>
            <Clock className="h-3 w-3 animate-spin" />
            <span className="text-xs font-medium">Sincronizando...</span>
          </>
        )
      case 'pending':
        return (
          <>
            <Clock className="h-3 w-3" />
            <span className="text-xs font-medium">
              {pendingChanges > 0 ? `${pendingChanges} pendiente${pendingChanges > 1 ? 's' : ''}` : 'Pendiente'}
            </span>
          </>
        )
      case 'error':
        return (
          <>
            <AlertTriangle className="h-3 w-3" />
            <span className="text-xs font-medium">Error de sync</span>
          </>
        )
      default:
        return (
          <>
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-xs font-medium">Sincronizado</span>
          </>
        )
    }
  }

  const getBadgeVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!isOnline) return 'secondary'
    switch (syncStatus) {
      case 'syncing':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Badge variant={getBadgeVariant()} className={cn('flex items-center gap-1.5', className)}>
      {getBadgeContent()}
    </Badge>
  )
}

export default OfflineIndicator

