/**
 * DataUsageIndicator - Indicador de uso de almacenamiento
 */

import { useState, useEffect } from 'react'
import { HardDrive, AlertTriangle, Trash2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Progress } from '@/shared/components/ui/progress'
import { Button } from '@/shared/components/ui/button'
import { useOfflineStorage } from '../../hooks/useOfflineStorage'

export interface DataUsageIndicatorProps {
  /** Si mostrar alerta cuando está casi lleno */
  showAlert?: boolean
  /** Porcentaje de umbral para alerta (default: 80) */
  alertThreshold?: number
  /** Callback cuando se limpia cache */
  onClearCache?: () => void
}

const DataUsageIndicator = ({
  showAlert = true,
  alertThreshold = 80,
  onClearCache,
}: DataUsageIndicatorProps) => {
  const { size, clear, isReady } = useOfflineStorage()
  const [quota, setQuota] = useState<number | null>(null)
  const [usagePercent, setUsagePercent] = useState(0)

  // Obtener quota disponible
  useEffect(() => {
    const getQuota = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate()
          setQuota(estimate.quota || null)
        } catch (error) {
          console.warn('No se pudo obtener quota:', error)
        }
      }
    }

    getQuota()
  }, [])

  // Calcular porcentaje de uso
  useEffect(() => {
    if (quota && size) {
      const percent = (size / quota) * 100
      setUsagePercent(Math.min(percent, 100))
    }
  }, [size, quota])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const getColor = () => {
    if (usagePercent >= alertThreshold) return 'bg-red-600'
    if (usagePercent >= alertThreshold * 0.7) return 'bg-amber-600'
    return 'bg-green-600'
  }

  const handleClearCache = async () => {
    if (confirm('¿Estás seguro de que quieres limpiar toda la caché? Esto eliminará todos los datos offline.')) {
      await clear()
      onClearCache?.()
    }
  }

  if (!isReady || !quota) {
    return (
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <HardDrive className="h-4 w-4" />
          <span className="text-sm">Cargando información de almacenamiento...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Alerta si está casi lleno */}
      {showAlert && usagePercent >= alertThreshold && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Almacenamiento casi lleno</p>
              <p className="text-sm text-red-700 mt-1">
                Has usado el {usagePercent.toFixed(1)}% de tu almacenamiento disponible.
                Considera limpiar la caché para liberar espacio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de uso */}
      <div className="p-4 border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Almacenamiento</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatBytes(size)} / {formatBytes(quota)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <Progress value={usagePercent} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{usagePercent.toFixed(1)}% usado</span>
            <span>{formatBytes(quota - size)} disponible</span>
          </div>
        </div>

        {/* Botón limpiar */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCache}
          className="w-full"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Limpiar caché
        </Button>
      </div>
    </div>
  )
}

export default DataUsageIndicator

