/**
 * Hook useOfflineStorage - Hook React para usar OfflineStorageManager
 */

import { useState, useEffect, useCallback } from 'react'
import {
  offlineStorage,
  type Assignment,
  type FormResponse,
  type Photo,
  type SyncQueueItem,
  type SyncStatus,
  type QueueAction,
} from '../utils/offlineStorage'

export interface UseOfflineStorageReturn {
  /** Si está inicializado */
  isReady: boolean
  /** Tamaño usado en bytes */
  size: number
  /** Obtener asignaciones */
  getAssignments: (filter?: {
    userId?: string
    status?: string
    syncStatus?: SyncStatus
  }) => Promise<Assignment[]>
  /** Obtener una asignación */
  getAssignment: (id: string) => Promise<Assignment | undefined>
  /** Guardar asignación */
  saveAssignment: (data: Partial<Assignment> & { id: string }) => Promise<string>
  /** Eliminar asignación */
  deleteAssignment: (id: string) => Promise<void>
  /** Marcar como sincronizado */
  markAsSync: (id: string) => Promise<void>
  /** Obtener respuesta */
  getResponse: (id: string) => Promise<FormResponse | undefined>
  /** Guardar respuesta */
  saveResponse: (data: Partial<FormResponse> & { id: string; assignmentId: string }) => Promise<string>
  /** Guardar borrador */
  saveDraft: (data: Partial<FormResponse> & { assignmentId: string }) => Promise<string>
  /** Obtener borradores */
  getDrafts: () => Promise<FormResponse[]>
  /** Eliminar borrador */
  deleteDraft: (id: string) => Promise<void>
  /** Guardar foto */
  savePhoto: (blob: Blob, metadata: Photo['metadata'], responseId: string) => Promise<string>
  /** Obtener foto */
  getPhoto: (id: string) => Promise<Photo | undefined>
  /** Obtener fotos de respuesta */
  getPhotos: (responseId: string) => Promise<Photo[]>
  /** Eliminar foto */
  deletePhoto: (id: string) => Promise<void>
  /** Marcar foto como subida */
  markAsUploaded: (id: string) => Promise<void>
  /** Agregar a cola de sync */
  addToQueue: (action: QueueAction, payload: Record<string, any>) => Promise<string>
  /** Obtener cola */
  getQueue: () => Promise<SyncQueueItem[]>
  /** Eliminar de cola */
  removeFromQueue: (id: string) => Promise<void>
  /** Limpiar cola */
  clearQueue: () => Promise<void>
  /** Limpiar todo */
  clear: () => Promise<void>
  /** Exportar datos */
  export: () => Promise<any>
  /** Importar datos */
  import: (data: any) => Promise<void>
}

/**
 * Hook para usar OfflineStorageManager en componentes React
 */
export const useOfflineStorage = (): UseOfflineStorageReturn => {
  const [isReady, setIsReady] = useState(false)
  const [size, setSize] = useState(0)

  // Inicializar
  useEffect(() => {
    const init = async () => {
      try {
        await offlineStorage.init()
        setIsReady(true)

        // Obtener tamaño inicial
        const initialSize = await offlineStorage.getSize()
        setSize(initialSize)
      } catch (error) {
        console.error('Error al inicializar offline storage:', error)
      }
    }

    init()
  }, [])

  // Actualizar tamaño periódicamente
  useEffect(() => {
    if (!isReady) return

    const updateSize = async () => {
      try {
        const currentSize = await offlineStorage.getSize()
        setSize(currentSize)
      } catch (error) {
        console.warn('Error al obtener tamaño:', error)
      }
    }

    updateSize()
    const interval = setInterval(updateSize, 60000) // Cada minuto

    return () => clearInterval(interval)
  }, [isReady])

  // Wrappers de métodos
  const getAssignments = useCallback(
    async (filter?: { userId?: string; status?: string; syncStatus?: SyncStatus }) => {
      return await offlineStorage.getAssignments(filter)
    },
    [],
  )

  const getAssignment = useCallback(async (id: string) => {
    return await offlineStorage.getAssignment(id)
  }, [])

  const saveAssignment = useCallback(async (data: Partial<Assignment> & { id: string }) => {
    return await offlineStorage.saveAssignment(data)
  }, [])

  const deleteAssignment = useCallback(async (id: string) => {
    await offlineStorage.deleteAssignment(id)
  }, [])

  const markAsSync = useCallback(async (id: string) => {
    await offlineStorage.markAsSync(id)
  }, [])

  const getResponse = useCallback(async (id: string) => {
    return await offlineStorage.getResponse(id)
  }, [])

  const saveResponse = useCallback(
    async (data: Partial<FormResponse> & { id: string; assignmentId: string }) => {
      return await offlineStorage.saveResponse(data)
    },
    [],
  )

  const saveDraft = useCallback(async (data: Partial<FormResponse> & { assignmentId: string }) => {
    return await offlineStorage.saveDraft(data)
  }, [])

  const getDrafts = useCallback(async () => {
    return await offlineStorage.getDrafts()
  }, [])

  const deleteDraft = useCallback(async (id: string) => {
    await offlineStorage.deleteDraft(id)
  }, [])

  const savePhoto = useCallback(
    async (blob: Blob, metadata: Photo['metadata'], responseId: string) => {
      return await offlineStorage.savePhoto(blob, metadata, responseId)
    },
    [],
  )

  const getPhoto = useCallback(async (id: string) => {
    return await offlineStorage.getPhoto(id)
  }, [])

  const getPhotos = useCallback(async (responseId: string) => {
    return await offlineStorage.getPhotos(responseId)
  }, [])

  const deletePhoto = useCallback(async (id: string) => {
    await offlineStorage.deletePhoto(id)
  }, [])

  const markAsUploaded = useCallback(async (id: string) => {
    await offlineStorage.markAsUploaded(id)
  }, [])

  const addToQueue = useCallback(async (action: QueueAction, payload: Record<string, any>) => {
    return await offlineStorage.addToQueue(action, payload)
  }, [])

  const getQueue = useCallback(async () => {
    return await offlineStorage.getQueue()
  }, [])

  const removeFromQueue = useCallback(async (id: string) => {
    await offlineStorage.removeFromQueue(id)
  }, [])

  const clearQueue = useCallback(async () => {
    await offlineStorage.clearQueue()
  }, [])

  const clear = useCallback(async () => {
    await offlineStorage.clear()
  }, [])

  const exportData = useCallback(async () => {
    return await offlineStorage.export()
  }, [])

  const importData = useCallback(async (data: any) => {
    await offlineStorage.import(data)
  }, [])

  return {
    isReady,
    size,
    getAssignments,
    getAssignment,
    saveAssignment,
    deleteAssignment,
    markAsSync,
    getResponse,
    saveResponse,
    saveDraft,
    getDrafts,
    deleteDraft,
    savePhoto,
    getPhoto,
    getPhotos,
    deletePhoto,
    markAsUploaded,
    addToQueue,
    getQueue,
    removeFromQueue,
    clearQueue,
    clear,
    export: exportData,
    import: importData,
  }
}

