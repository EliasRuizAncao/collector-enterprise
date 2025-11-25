/**
 * Hook useSyncManager - Hook React para usar SyncManager
 */

import { useState, useEffect, useCallback } from 'react'
import {
  syncManager,
  type SyncStatus,
  type SyncProgress,
  type SyncOptions,
  type SyncError,
  type Conflict,
} from '../utils/syncManager'

export interface UseSyncManagerReturn {
  /** Estado de sincronización */
  status: SyncStatus
  /** Progreso actual */
  progress: SyncProgress
  /** Cantidad de items pendientes */
  pendingCount: number
  /** Fecha de último sync */
  lastSyncDate: Date | null
  /** Errores de sincronización */
  errors: SyncError[]
  /** Conflictos detectados */
  conflicts: Conflict[]
  /** Sincronizar ahora */
  syncNow: (options?: SyncOptions) => Promise<void>
  /** Cancelar sincronización */
  cancelSync: () => void
  /** Sincronizar asignaciones */
  syncAssignments: (ids?: string[]) => Promise<void>
  /** Sincronizar respuestas */
  syncResponses: (ids?: string[]) => Promise<void>
  /** Sincronizar fotos */
  syncPhotos: (ids?: string[]) => Promise<void>
}

/**
 * Hook para usar SyncManager en componentes React
 */
export const useSyncManager = (): UseSyncManagerReturn => {
  const [status, setStatus] = useState<SyncStatus>(syncManager.getStatus())
  const [progress, setProgress] = useState<SyncProgress>(syncManager.getProgress())
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(syncManager.getLastSyncDate())
  const [errors, setErrors] = useState<SyncError[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  // Actualizar estado cuando cambia
  useEffect(() => {
    const updateState = () => {
      setStatus(syncManager.getStatus())
      setProgress(syncManager.getProgress())
      setLastSyncDate(syncManager.getLastSyncDate())
      setErrors(syncManager.getErrors())
      setConflicts(syncManager.getConflicts())
    }

    // Actualizar estado inicial
    updateState()
    syncManager.getPendingCount().then(setPendingCount)

    // Suscribirse a eventos
    const unsubscribeStart = syncManager.on('sync-start', () => {
      updateState()
    })

    const unsubscribeProgress = syncManager.on('sync-progress', (event) => {
      if (event.progress) {
        setProgress(event.progress)
      }
      updateState()
    })

    const unsubscribeComplete = syncManager.on('sync-complete', () => {
      updateState()
      syncManager.getPendingCount().then(setPendingCount)
    })

    const unsubscribeError = syncManager.on('sync-error', () => {
      updateState()
    })

    const unsubscribeConflict = syncManager.on('conflict-detected', () => {
      updateState()
    })

    const unsubscribeCancelled = syncManager.on('sync-cancelled', () => {
      updateState()
    })

    // Actualizar pending count periódicamente
    const interval = setInterval(() => {
      syncManager.getPendingCount().then(setPendingCount)
    }, 30000) // Cada 30 segundos

    return () => {
      unsubscribeStart()
      unsubscribeProgress()
      unsubscribeComplete()
      unsubscribeError()
      unsubscribeConflict()
      unsubscribeCancelled()
      clearInterval(interval)
    }
  }, [])

  // Sincronizar ahora
  const syncNow = useCallback(async (options?: SyncOptions) => {
    await syncManager.sync(options)
  }, [])

  // Cancelar sync
  const cancelSync = useCallback(() => {
    syncManager.cancelSync()
  }, [])

  // Sincronizar asignaciones
  const syncAssignments = useCallback(async (ids?: string[]) => {
    await syncManager.syncAssignments(ids)
  }, [])

  // Sincronizar respuestas
  const syncResponses = useCallback(async (ids?: string[]) => {
    await syncManager.syncResponses(ids)
  }, [])

  // Sincronizar fotos
  const syncPhotos = useCallback(async (ids?: string[]) => {
    await syncManager.syncPhotos(ids)
  }, [])

  return {
    status,
    progress,
    pendingCount,
    lastSyncDate,
    errors,
    conflicts,
    syncNow,
    cancelSync,
    syncAssignments,
    syncResponses,
    syncPhotos,
  }
}

