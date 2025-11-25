/**
 * Hook useDataManager - React hook para gestionar datos offline
 */

import { useState, useEffect, useCallback } from 'react'
import { dataManager, type DataManagerSettings, type StorageInfo, type CleanupOptions } from '../utils/dataManager'

export interface UseDataManagerReturn {
  /** Tamaño usado en bytes */
  storageUsed: number
  /** Tamaño disponible en bytes */
  storageAvailable: number
  /** Porcentaje usado */
  storagePercentUsed: number
  /** Si la compresión está habilitada */
  compressionEnabled: boolean
  /** Información completa de storage */
  storageInfo: StorageInfo | null
  /** Si está cargando */
  isLoading: boolean
  /** Error si existe */
  error: Error | null
  /** Limpiar datos antiguos */
  cleanupOldData: (options?: CleanupOptions) => Promise<{
    deleted: {
      responses: number
      photos: number
      cache: number
      drafts: number
    }
    freedSpace: number
  }>
  /** Obtener información de storage */
  getStorageInfo: () => Promise<StorageInfo>
  /** Obtener sugerencias de limpieza */
  getCleanupSuggestions: () => Promise<{
    canFree: number
    suggestions: Array<{
      type: string
      description: string
      canFree: number
      action: () => Promise<void>
    }>
  }>
  /** Actualizar settings */
  updateSettings: (settings: Partial<DataManagerSettings>) => void
  /** Obtener settings actuales */
  getSettings: () => DataManagerSettings
  /** Limpiar todo el cache */
  clearAllCache: () => Promise<void>
  /** Eliminar todos los drafts */
  deleteAllDrafts: () => Promise<void>
  /** Verificar si se debe alertar por quota */
  shouldAlertQuota: () => Promise<boolean>
}

/**
 * Hook para gestionar datos offline
 */
export const useDataManager = (): UseDataManagerReturn => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [settings, setSettings] = useState<DataManagerSettings>(dataManager.getSettings())

  /**
   * Cargar información de storage
   */
  const loadStorageInfo = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const info = await dataManager.getStorageInfo()
      setStorageInfo(info)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar información de storage'))
      console.error('Error al cargar storage info:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Cargar información inicial
   */
  useEffect(() => {
    loadStorageInfo()

    // Actualizar periódicamente (cada 30 segundos)
    const interval = setInterval(loadStorageInfo, 30000)

    return () => clearInterval(interval)
  }, [loadStorageInfo])

  /**
   * Limpiar datos antiguos
   */
  const cleanupOldData = useCallback(async (options?: CleanupOptions) => {
    try {
      setError(null)
      const result = await dataManager.cleanupOldData(options)
      // Recargar información de storage después de limpiar
      await loadStorageInfo()
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al limpiar datos')
      setError(error)
      throw error
    }
  }, [loadStorageInfo])

  /**
   * Obtener información de storage
   */
  const getStorageInfo = useCallback(async () => {
    try {
      setError(null)
      const info = await dataManager.getStorageInfo()
      setStorageInfo(info)
      return info
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al obtener información de storage')
      setError(error)
      throw error
    }
  }, [])

  /**
   * Obtener sugerencias de limpieza
   */
  const getCleanupSuggestions = useCallback(async () => {
    try {
      setError(null)
      return await dataManager.getCleanupSuggestions()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al obtener sugerencias')
      setError(error)
      throw error
    }
  }, [])

  /**
   * Actualizar settings
   */
  const updateSettings = useCallback((newSettings: Partial<DataManagerSettings>) => {
    dataManager.saveSettings(newSettings)
    setSettings(dataManager.getSettings())
  }, [])

  /**
   * Obtener settings actuales
   */
  const getSettings = useCallback(() => {
    return dataManager.getSettings()
  }, [])

  /**
   * Limpiar todo el cache
   */
  const clearAllCache = useCallback(async () => {
    try {
      setError(null)
      await dataManager.clearAllCache()
      await loadStorageInfo()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al limpiar cache')
      setError(error)
      throw error
    }
  }, [loadStorageInfo])

  /**
   * Eliminar todos los drafts
   */
  const deleteAllDrafts = useCallback(async () => {
    try {
      setError(null)
      await dataManager.deleteAllDrafts()
      await loadStorageInfo()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al eliminar drafts')
      setError(error)
      throw error
    }
  }, [loadStorageInfo])

  /**
   * Verificar si se debe alertar por quota
   */
  const shouldAlertQuota = useCallback(async () => {
    try {
      return await dataManager.shouldAlertQuota()
    } catch (err) {
      console.error('Error al verificar quota:', err)
      return false
    }
  }, [])

  return {
    storageUsed: storageInfo?.used || 0,
    storageAvailable: storageInfo?.available || 0,
    storagePercentUsed: storageInfo?.percentUsed || 0,
    compressionEnabled: settings.compressionEnabled,
    storageInfo,
    isLoading,
    error,
    cleanupOldData,
    getStorageInfo,
    getCleanupSuggestions,
    updateSettings,
    getSettings,
    clearAllCache,
    deleteAllDrafts,
    shouldAlertQuota,
  }
}

