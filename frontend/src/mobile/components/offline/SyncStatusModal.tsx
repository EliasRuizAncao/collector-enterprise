/**
 * SyncStatusModal - Modal con detalles de sincronización
 */

import { CheckCircle2, XCircle, RefreshCw, X, Trash2, Clock } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useSyncManager } from '../../hooks/useSyncManager'
import NetworkSpeedIndicator from './NetworkSpeedIndicator'

export interface SyncStatusModalProps {
  /** Si está abierto */
  open: boolean
  /** Callback cuando cambia el estado */
  onOpenChange: (open: boolean) => void
}

const SyncStatusModal = ({ open, onOpenChange }: SyncStatusModalProps) => {
  const {
    status,
    progress,
    pendingCount,
    errors,
    conflicts,
    syncNow,
    cancelSync,
  } = useSyncManager()

  const handleRetryFailed = async () => {
    // Reintentar items con error
    const failedItems = errors.map((e) => e.itemId)
    await syncNow({ items: { responses: failedItems } })
  }

  const handleClearCompleted = () => {
    // Limpiar errores resueltos (esto se manejaría en el manager)
    // Por ahora solo cerramos el modal
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Estado de sincronización</DialogTitle>
          <DialogDescription>
            Progreso y detalles de la sincronización
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Network Speed Indicator */}
          <NetworkSpeedIndicator alwaysVisible={true} showSuggestion={true} />

          {/* Progress general */}
          {status === 'syncing' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Sincronizando...</span>
                <span className="font-medium">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              {progress.currentItem && (
                <p className="text-xs text-muted-foreground">
                  {progress.currentItem}
                </p>
              )}
              {progress.estimatedTimeRemaining && (
                <p className="text-xs text-muted-foreground">
                  Tiempo estimado: ~{progress.estimatedTimeRemaining}s
                </p>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{progress.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{progress.success}</p>
              <p className="text-xs text-muted-foreground">Éxito</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{progress.errors}</p>
              <p className="text-xs text-muted-foreground">Errores</p>
            </div>
          </div>

          {/* Items pendientes */}
          {pendingCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">
                  {pendingCount} item{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Errores */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-600">
                Errores ({errors.length})
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="p-2 bg-red-50 border border-red-200 rounded text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {error.itemType}: {error.itemId}
                        </p>
                        <p className="text-muted-foreground">{error.error.message}</p>
                        <p className="text-muted-foreground mt-1">
                          {error.timestamp.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflictos */}
          {conflicts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-600">
                Conflictos ({conflicts.length})
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="p-2 bg-amber-50 border border-amber-200 rounded text-xs"
                  >
                    <p className="font-medium">
                      {conflict.type}: {conflict.id}
                    </p>
                    <p className="text-muted-foreground">
                      Versión local: {conflict.localVersion} | Servidor: {conflict.serverVersion}
                    </p>
                    {conflict.strategy && (
                      <p className="text-muted-foreground">
                        Estrategia: {conflict.strategy}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {status === 'syncing' && (
            <Button variant="outline" onClick={cancelSync} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
          {errors.length > 0 && (
            <Button
              variant="outline"
              onClick={handleRetryFailed}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar errores
            </Button>
          )}
          {progress.success > 0 && (
            <Button
              variant="ghost"
              onClick={handleClearCompleted}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar completados
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SyncStatusModal

