import { useState, useEffect, useCallback, useRef } from 'react'

import api from '@/shared/lib/api'
import { offlineStorage, type SyncQueueItem } from '../utils/offlineStorage'
import { dataManager } from '../utils/dataManager'
import type { Assignment } from '../components/AssignmentCard'

/**
 * Estado de sincronización
 */
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error'

/**
 * Tipo de acción de sincronización (compatible con el sistema anterior)
 */
type SyncActionType = 'startAssignment' | 'completeAssignment' | 'updateProgress' | 'updateAssignment'

/**
 * Acción de sincronización (interfaz interna)
 */
interface SyncAction {
  id: string
  type: SyncActionType
  assignmentId: string
  data: Record<string, any>
  retryCount: number
  lastError?: string
}

/**
 * Retorno del hook useOfflineAssignments
 */
export interface UseOfflineAssignmentsReturn {
  /**
   * Lista combinada de asignaciones (server + local)
   */
  assignments: Assignment[]
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
  pendingChanges: number
  /**
   * Sincronizar ahora manualmente
   */
  syncNow: () => Promise<void>
  /**
   * Agregar asignación localmente
   */
  addLocalAssignment: (assignment: Assignment) => Promise<void>
  /**
   * Actualizar asignación localmente
   */
  updateLocalAssignment: (assignmentId: string, updates: Partial<Assignment>) => Promise<void>
  /**
   * Marcar asignación como iniciada (offline-first)
   */
  startAssignment: (assignmentId: string) => Promise<void>
  /**
   * Marcar asignación como completada (offline-first)
   */
  completeAssignment: (assignmentId: string) => Promise<void>
  /**
   * Actualizar progreso (offline-first)
   */
  updateProgress: (assignmentId: string, progress: number) => Promise<void>
}

/**
 * Hook para manejar asignaciones offline-first
 * Funcionalidad:
 * - Fetch assignments cuando hay conexión
 * - Guardar en IndexedDB usando dataManager (con compresión)
 * - Cuando offline: servir desde IndexedDB, permitir cambios locales
 * - Cuando vuelve conexión: auto-sync cambios pendientes
 */
export const useOfflineAssignments = (): UseOfflineAssignmentsReturn => {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced')
  const [pendingChanges, setPendingChanges] = useState(0)
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSyncingRef = useRef(false)

  // Detectar cambios de estado online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-sync cuando vuelve la conexión
      void syncNow()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('pending')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Inicializar y cargar asignaciones
  useEffect(() => {
    const init = async () => {
      try {
        await offlineStorage.init()
        await loadAssignments()
      } catch (error) {
        console.error('Error al inicializar offline storage:', error)
      }
    }

    void init()
  }, [])

  // Polling para sincronización cuando hay cambios pendientes
  useEffect(() => {
    if (isOnline && pendingChanges > 0 && !isSyncingRef.current) {
      // Polling cada 30s cuando hay cambios pendientes
      syncIntervalRef.current = setInterval(() => {
        void syncNow()
      }, 30000)
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [isOnline, pendingChanges])

  /**
   * Convertir SyncQueueItem a SyncAction (para compatibilidad)
   */
  const queueItemToSyncAction = (item: SyncQueueItem): SyncAction | null => {
    // Solo procesar items de tipo 'update-assignment'
    if (item.action !== 'update-assignment') {
      return null
    }

    // Extraer tipo de acción del payload
    const payload = item.payload
    let actionType: SyncActionType = 'updateAssignment'

    if (payload.status === 'in_progress') {
      actionType = 'startAssignment'
    } else if (payload.status === 'completed') {
      actionType = 'completeAssignment'
    } else if (payload.progress !== undefined) {
      actionType = 'updateProgress'
    }

    return {
      id: item.id,
      type: actionType,
      assignmentId: payload.assignmentId || '',
      data: payload,
      retryCount: item.retries,
      lastError: item.lastError,
    }
  }

  /**
   * Convertir SyncAction a payload para SyncQueueItem
   */
  const syncActionToPayload = (action: Omit<SyncAction, 'id' | 'retryCount' | 'lastError'>): Record<string, any> => {
    return {
      assignmentId: action.assignmentId,
      ...action.data,
    }
  }

  /**
   * Transformar datos del API al formato Assignment del frontend
   */
  const transformApiAssignment = (apiData: any): Assignment => {
    return {
      id: apiData.id,
      formId: apiData.formId,
      formName: apiData.formTitle || apiData.formName || 'Sin nombre',
      description: apiData.description || apiData.formDescription,
      dueDate: apiData.endDate || apiData.dueDate,
      priority: apiData.priority || 'medium',
      status: apiData.isCompleted ? 'completed' : apiData.status || 'pending',
      progress: apiData.progress,
      completedAt: apiData.completedAt,
      assignedAt: apiData.createdAt || apiData.assignedAt,
      location: apiData.location,
      completedFields: apiData.completedFields,
      totalFields: apiData.totalFields,
    }
  }

  /**
   * Transformar datos de IndexedDB al formato Assignment del frontend
   */
  const transformLocalAssignment = (localData: any): Assignment => {
    // Si data contiene el form completo, extraer formName
    const formName = localData.data?.form?.title || localData.data?.formName || 'Sin nombre'
    const description = localData.data?.form?.description || localData.data?.description

    return {
      id: localData.id,
      formId: localData.formId,
      formName,
      description,
      dueDate: localData.data?.endDate || localData.data?.dueDate,
      priority: localData.data?.priority || 'medium',
      status: localData.status === 'completed' ? 'completed' : localData.status === 'in_progress' ? 'in_progress' : 'pending',
      progress: localData.data?.progress,
      completedAt: localData.data?.completedAt,
      assignedAt: localData.createdAt instanceof Date ? localData.createdAt.toISOString() : localData.createdAt,
      location: localData.data?.location,
      completedFields: localData.data?.completedFields,
      totalFields: localData.data?.totalFields,
    }
  }

  // Cargar asignaciones (online desde API, offline desde IndexedDB)
  const loadAssignments = useCallback(async () => {
    try {
      let serverAssignments: Assignment[] = []

      // Intentar cargar desde API si hay conexión
      if (navigator.onLine) {
        try {
          const response = await api.get('/assignments')
          // El API devuelve { data: [...], pagination: {...} }
          const apiAssignments = response.data.data || response.data.assignments || []
          serverAssignments = apiAssignments.map(transformApiAssignment)
          setSyncStatus('synced')

          // Guardar en IndexedDB usando dataManager (con compresión automática)
          for (const apiAssignment of apiAssignments) {
            await dataManager.saveAssignment({
              id: apiAssignment.id,
              formId: apiAssignment.formId || '',
              userId: apiAssignment.userId || '',
              data: {
                formName: apiAssignment.formTitle || apiAssignment.formName,
                description: apiAssignment.description,
                endDate: apiAssignment.endDate,
                dueDate: apiAssignment.endDate,
                priority: apiAssignment.priority,
                progress: apiAssignment.progress,
                completedAt: apiAssignment.completedAt,
                location: apiAssignment.location,
                completedFields: apiAssignment.completedFields,
                totalFields: apiAssignment.totalFields,
                // Guardar también el form completo si viene en la respuesta
                form: apiAssignment.form,
              },
              status: apiAssignment.isCompleted ? 'completed' : apiAssignment.status || 'pending',
              createdAt: apiAssignment.createdAt ? new Date(apiAssignment.createdAt) : new Date(),
              updatedAt: new Date(),
              _syncStatus: 'synced',
              _version: 1,
            })
          }
        } catch (error) {
          console.error('Error al cargar asignaciones desde API:', error)
          // Continuar con datos locales si falla la API
        }
      }

      // Cargar desde IndexedDB
      const localAssignments = await offlineStorage.getAssignments()

      // Combinar: priorizar datos del servidor, completar con locales
      const combined = new Map<string, Assignment>()

      // Primero agregar datos del servidor
      for (const assignment of serverAssignments) {
        combined.set(assignment.id, assignment)
      }

      // Luego agregar locales que no están en el servidor o tienen cambios pendientes
      for (const localAssignment of localAssignments) {
        const serverAssignment = combined.get(localAssignment.id)
        if (!serverAssignment || localAssignment._syncStatus === 'pending') {
          // Convertir Assignment de offlineStorage a Assignment de UI
          const transformed = transformLocalAssignment(localAssignment)
          combined.set(localAssignment.id, transformed)
        }
      }

      setAssignments(Array.from(combined.values()))

      // Actualizar contador de cambios pendientes
      const queue = await offlineStorage.getQueue()
      setPendingChanges(queue.length)
    } catch (error) {
      console.error('Error al cargar asignaciones:', error)
      setSyncStatus('error')
    }
  }, [])

  // Sincronizar cambios pendientes
  const syncNow = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) {
      return
    }

    isSyncingRef.current = true
    setSyncStatus('syncing')

    try {
      const queue = await offlineStorage.getQueue()
      const errors: string[] = []

      // Procesar acciones en orden FIFO (solo 'update-assignment')
      for (const queueItem of queue) {
        if (queueItem.action !== 'update-assignment') {
          continue // Saltar otros tipos de acciones
        }

        const action = queueItemToSyncAction(queueItem)
        if (!action) {
          continue
        }

        try {
          await executeSyncAction(action)
          await offlineStorage.removeFromQueue(action.id)
        } catch (error: any) {
          const errorMessage = error.message || 'Error desconocido'
          const newRetryCount = action.retryCount + 1

          if (newRetryCount < 3) {
            // Reintentar hasta 3 veces
            await offlineStorage.updateQueueItem(action.id, {
              retries: newRetryCount,
              lastError: errorMessage,
            })
            errors.push(`Error en ${action.type} (reintento ${newRetryCount}/3)`)
          } else {
            // Máximo de reintentos alcanzado, marcar como error
            await offlineStorage.updateQueueItem(action.id, {
              retries: newRetryCount,
              lastError: errorMessage,
            })

            // Actualizar asignación con estado de error
            const assignment = await offlineStorage.getAssignment(action.assignmentId)
            if (assignment) {
              await dataManager.saveAssignment({
                ...assignment,
                _syncStatus: 'error',
              })
            }

            errors.push(`Error persistente en ${action.type}`)
          }
        }
      }

      // Recargar asignaciones después de sync
      await loadAssignments()

      if (errors.length > 0) {
        setSyncStatus('error')
      } else {
        setSyncStatus('synced')
      }
    } catch (error) {
      console.error('Error durante sincronización:', error)
      setSyncStatus('error')
    } finally {
      isSyncingRef.current = false
    }
  }, [loadAssignments])

  // Ejecutar una acción de sincronización
  const executeSyncAction = async (action: SyncAction): Promise<void> => {
    switch (action.type) {
      case 'startAssignment':
        await api.post(`/assignments/${action.assignmentId}/start`, action.data)
        break
      case 'completeAssignment':
        await api.post(`/assignments/${action.assignmentId}/complete`, action.data)
        break
      case 'updateProgress':
        await api.put(`/assignments/${action.assignmentId}/progress`, { progress: action.data.progress })
        break
      case 'updateAssignment':
        await api.put(`/assignments/${action.assignmentId}`, action.data)
        break
      default:
        throw new Error(`Tipo de acción desconocida: ${(action as any).type}`)
    }
  }

  // Agregar asignación localmente
  const addLocalAssignment = useCallback(
    async (assignment: Assignment) => {
      await dataManager.saveAssignment({
        id: assignment.id,
        formId: assignment.formId || '',
        userId: assignment.userId || '',
        data: assignment.data || {},
        status: assignment.status || 'pending',
        createdAt: assignment.createdAt ? new Date(assignment.createdAt) : new Date(),
        updatedAt: new Date(),
        _syncStatus: 'pending',
        _version: 1,
      })
      await loadAssignments()
    },
    [loadAssignments],
  )

  // Actualizar asignación localmente
  const updateLocalAssignment = useCallback(
    async (assignmentId: string, updates: Partial<Assignment>) => {
      const assignment = await offlineStorage.getAssignment(assignmentId)
      if (assignment) {
        await dataManager.saveAssignment({
          ...assignment,
          ...updates,
          _syncStatus: 'pending',
          updatedAt: new Date(),
        })
        await loadAssignments()

        // Si está online, intentar sync inmediato
        if (navigator.onLine) {
          await offlineStorage.addToQueue('update-assignment', {
            assignmentId,
            ...updates,
          })
          void syncNow()
        }
      }
    },
    [loadAssignments, syncNow],
  )

  // Marcar asignación como iniciada (offline-first)
  const startAssignment = useCallback(
    async (assignmentId: string) => {
      const assignment = await offlineStorage.getAssignment(assignmentId)
      if (!assignment) {
        throw new Error('Asignación no encontrada')
      }

      // Actualizar localmente usando dataManager (con compresión)
      await dataManager.saveAssignment({
        ...assignment,
        status: 'in_progress',
        _syncStatus: 'pending',
        updatedAt: new Date(),
      })

      // Agregar a cola de sync
      await offlineStorage.addToQueue('update-assignment', {
        assignmentId,
        status: 'in_progress',
      })

      // Recargar y sincronizar si está online
      await loadAssignments()
      if (navigator.onLine) {
        void syncNow()
      }
    },
    [loadAssignments, syncNow],
  )

  // Marcar asignación como completada (offline-first)
  const completeAssignment = useCallback(
    async (assignmentId: string) => {
      const assignment = await offlineStorage.getAssignment(assignmentId)
      if (!assignment) {
        throw new Error('Asignación no encontrada')
      }

      // Actualizar localmente usando dataManager (con compresión)
      await dataManager.saveAssignment({
        ...assignment,
        status: 'completed',
        progress: 100,
        updatedAt: new Date(),
        _syncStatus: 'pending',
      })

      // Agregar a cola de sync
      await offlineStorage.addToQueue('update-assignment', {
        assignmentId,
        status: 'completed',
        progress: 100,
      })

      // Recargar y sincronizar si está online
      await loadAssignments()
      if (navigator.onLine) {
        void syncNow()
      }
    },
    [loadAssignments, syncNow],
  )

  // Actualizar progreso (offline-first)
  const updateProgress = useCallback(
    async (assignmentId: string, progress: number) => {
      const assignment = await offlineStorage.getAssignment(assignmentId)
      if (!assignment) {
        throw new Error('Asignación no encontrada')
      }

      // Actualizar localmente usando dataManager (con compresión)
      await dataManager.saveAssignment({
        ...assignment,
        progress,
        _syncStatus: 'pending',
        updatedAt: new Date(),
      })

      // Agregar a cola de sync
      await offlineStorage.addToQueue('update-assignment', {
        assignmentId,
        progress,
      })

      // Recargar y sincronizar si está online
      await loadAssignments()
      if (navigator.onLine) {
        void syncNow()
      }
    },
    [loadAssignments, syncNow],
  )

  return {
    assignments,
    isOnline,
    syncStatus,
    pendingChanges,
    syncNow,
    addLocalAssignment,
    updateLocalAssignment,
    startAssignment,
    completeAssignment,
    updateProgress,
  }
}
