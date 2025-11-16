/**
 * SyncIndicator - Indicador visual de sincronización
 */

import { useEffect, useState } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useSyncManager } from '../hooks/useSyncManager'
import { useToast } from '@/shared/components/ui/use-toast'

export interface SyncIndicatorProps {
  /** Si mostrar siempre o solo cuando está sincronizando */
  alwaysVisible?: boolean
  /** Posición del indicador */
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
}

const SyncIndicator = ({ alwaysVisible = false, position = 'top-right' }: SyncIndicatorProps) => {
  const { status, progress, pendingCount, syncNow, cancelSync, errors, conflicts } = useSyncManager()
  const { toast } = useToast()
  const [showDetails, setShowDetails] = useState(false)

  // Notificaciones toast
  useEffect(() => {
    if (status === 'syncing' && progress.current === 1) {
      toast({
        title: 'Sincronizando...',
        description: `${progress.total} items pendientes`,
      })
    }
  }, [status, progress.current, progress.total, toast])

  useEffect(() => {
    if (status === 'completed' && progress.success > 0) {
      toast({
        title: 'Sincronización completada',
        description: `${progress.success} items sincronizados exitosamente`,
        variant: 'default',
      })
    }
  }, [status, progress.success, toast])

  useEffect(() => {
    if (errors.length > 0 && status === 'error') {
      toast({
        title: 'Error en sincronización',
        description: `${errors.length} error(es) durante la sincronización`,
        variant: 'destructive',
      })
    }
  }, [errors.length, status, toast])

  if (!alwaysVisible && status === 'idle' && pendingCount === 0) {
    return null
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4',
  }

  return (
    <>
      {/* Indicador flotante */}
      <div
        className={cn(
          'fixed z-50',
          positionClasses[position],
          'transition-all duration-300',
        )}
      >
        <div
          className={cn(
            'bg-background border rounded-lg shadow-lg p-3 min-w-[200px]',
            'backdrop-blur-sm bg-background/95',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {status === 'syncing' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              ) : status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : errors.length > 0 ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {status === 'syncing' ? 'Sincronizando' : 'Sincronización'}
              </span>
            </div>
            {status === 'syncing' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={cancelSync}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Progress bar */}
          {status === 'syncing' && (
            <div className="space-y-1 mb-2">
              <Progress value={progress.percentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {progress.current} / {progress.total}
                </span>
                {progress.estimatedTimeRemaining && (
                  <span>~{progress.estimatedTimeRemaining}s</span>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs">
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
              </Badge>
            )}
            {progress.success > 0 && (
              <Badge variant="default" className="text-xs bg-green-600">
                {progress.success} éxito
              </Badge>
            )}
            {progress.errors > 0 && (
              <Badge variant="destructive" className="text-xs">
                {progress.errors} error{progress.errors > 1 ? 'es' : ''}
              </Badge>
            )}
          </div>

          {/* Botón ver detalles */}
          {(errors.length > 0 || conflicts.length > 0 || status === 'syncing') && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => setShowDetails(true)}
            >
              Ver detalles
            </Button>
          )}

          {/* Botón sincronizar manualmente */}
          {status === 'idle' && pendingCount > 0 && (
            <Button
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => syncNow()}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Sincronizar ahora
            </Button>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de sincronización</DialogTitle>
            <DialogDescription>
              Estado actual y errores de sincronización
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Progreso */}
            {status === 'syncing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progreso</span>
                  <span>{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} />
                {progress.currentItem && (
                  <p className="text-xs text-muted-foreground">
                    Procesando: {progress.currentItem}
                  </p>
                )}
              </div>
            )}

            {/* Errores */}
            {errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600">Errores ({errors.length})</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-2 bg-red-50 border border-red-200 rounded text-xs"
                    >
                      <p className="font-medium">{error.itemType}: {error.itemId}</p>
                      <p className="text-muted-foreground">{error.error.message}</p>
                      <p className="text-muted-foreground mt-1">
                        {error.timestamp.toLocaleString('es-CL')}
                      </p>
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
                      <p className="font-medium">{conflict.type}: {conflict.id}</p>
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

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-medium">{progress.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Éxito:</span>{' '}
                <span className="font-medium text-green-600">{progress.success}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Errores:</span>{' '}
                <span className="font-medium text-red-600">{progress.errors}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pendientes:</span>{' '}
                <span className="font-medium">{pendingCount}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            {status === 'syncing' && (
              <Button variant="outline" onClick={cancelSync}>
                Cancelar
              </Button>
            )}
            <Button onClick={() => setShowDetails(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SyncIndicator

