/**
 * DataManager - Gestión eficiente de datos grandes offline
 * Estrategias para compresión, paginación, cleanup y quota management
 */

import LZString from 'lz-string'
import { offlineStorage } from './offlineStorage'
import { compressImage, type CompressionOptions } from './imageCompression'

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface DataManagerSettings {
  /** Habilitar compresión automática */
  compressionEnabled: boolean
  /** Habilitar cleanup automático */
  autoCleanupEnabled: boolean
  /** Frecuencia de cleanup (días) */
  cleanupFrequency: number
  /** Solo subir fotos en WiFi */
  wifiOnlyUploads: boolean
  /** Tamaño máximo de cache (MB) */
  maxCacheSize: number
  /** Calidad de compresión de fotos (0-1) */
  photoQuality: number
  /** Días para mantener responses synced */
  keepSyncedResponsesDays: number
  /** Días para mantener fotos subidas */
  keepUploadedPhotosDays: number
}

export interface StorageInfo {
  /** Tamaño usado en bytes */
  used: number
  /** Tamaño disponible en bytes */
  available: number
  /** Porcentaje usado */
  percentUsed: number
  /** Quota total en bytes */
  quota: number
  /** Breakdown por tipo de dato */
  breakdown: {
    assignments: number
    responses: number
    photos: number
    cache: number
    other: number
  }
}

export interface CleanupOptions {
  /** Eliminar responses synced más antiguos que X días */
  deleteSyncedResponsesOlderThan?: number
  /** Eliminar fotos subidas más antiguas que X días */
  deleteUploadedPhotosOlderThan?: number
  /** Eliminar cache expirado */
  deleteExpiredCache?: boolean
  /** Eliminar drafts antiguos */
  deleteOldDrafts?: boolean
  /** Días para considerar "antiguo" */
  oldDraftDays?: number
}

export interface CompressionStats {
  /** Tamaño original */
  originalSize: number
  /** Tamaño comprimido */
  compressedSize: number
  /** Porcentaje de reducción */
  reductionPercent: number
  /** Si fue comprimido */
  wasCompressed: boolean
}

// ============================================================================
// CONFIGURACIÓN POR DEFECTO
// ============================================================================

const DEFAULT_SETTINGS: DataManagerSettings = {
  compressionEnabled: true,
  autoCleanupEnabled: true,
  cleanupFrequency: 7, // días
  wifiOnlyUploads: true,
  maxCacheSize: 100, // MB
  photoQuality: 0.8,
  keepSyncedResponsesDays: 30,
  keepUploadedPhotosDays: 7,
}

// Umbrales para compresión
const COMPRESSION_THRESHOLD = 1024 * 10 // 10KB - solo comprimir objetos >10KB
const QUOTA_ALERT_THRESHOLD = 0.8 // Alertar al 80%

// ============================================================================
// CLASE DATAMANAGER
// ============================================================================

class DataManager {
  private settings: DataManagerSettings
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null
  private compressionCache: Map<string, CompressionStats> = new Map()

  constructor() {
    // Cargar settings desde localStorage o usar defaults
    this.settings = this.loadSettings()
    
    // Iniciar cleanup automático si está habilitado
    if (this.settings.autoCleanupEnabled) {
      this.startAutoCleanup()
    }
  }

  // ==========================================================================
  // SETTINGS MANAGEMENT
  // ==========================================================================

  /**
   * Cargar settings desde localStorage
   */
  private loadSettings(): DataManagerSettings {
    try {
      const stored = localStorage.getItem('dataManagerSettings')
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Error al cargar settings de DataManager:', error)
    }
    return { ...DEFAULT_SETTINGS }
  }

  /**
   * Guardar settings en localStorage
   */
  saveSettings(settings: Partial<DataManagerSettings>): void {
    this.settings = { ...this.settings, ...settings }
    try {
      localStorage.setItem('dataManagerSettings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Error al guardar settings de DataManager:', error)
    }
  }

  /**
   * Obtener settings actuales
   */
  getSettings(): DataManagerSettings {
    return { ...this.settings }
  }

  // ==========================================================================
  // COMPRESIÓN DE DATOS
  // ==========================================================================

  /**
   * Comprimir JSON usando LZ-String
   */
  compressJSON(data: any): { compressed: string; stats: CompressionStats } {
    const jsonString = JSON.stringify(data)
    const originalSize = new Blob([jsonString]).size

    // Solo comprimir si es mayor al threshold
    if (originalSize < COMPRESSION_THRESHOLD) {
      return {
        compressed: jsonString,
        stats: {
          originalSize,
          compressedSize: originalSize,
          reductionPercent: 0,
          wasCompressed: false,
        },
      }
    }

    const compressed = LZString.compress(jsonString)
    if (!compressed) {
      // Si falla la compresión, retornar original
      return {
        compressed: jsonString,
        stats: {
          originalSize,
          compressedSize: originalSize,
          reductionPercent: 0,
          wasCompressed: false,
        },
      }
    }

    const compressedSize = compressed.length
    const reductionPercent = ((originalSize - compressedSize) / originalSize) * 100

    const stats: CompressionStats = {
      originalSize,
      compressedSize,
      reductionPercent: Math.round(reductionPercent * 100) / 100,
      wasCompressed: true,
    }

    return { compressed, stats }
  }

  /**
   * Descomprimir JSON
   */
  decompressJSON(compressed: string): any {
    // Intentar descomprimir primero
    const decompressed = LZString.decompress(compressed)
    if (decompressed) {
      return JSON.parse(decompressed)
    }

    // Si falla, asumir que no está comprimido
    try {
      return JSON.parse(compressed)
    } catch (error) {
      throw new Error('Error al descomprimir JSON: formato inválido')
    }
  }

  /**
   * Comprimir imagen antes de guardar
   */
  async compressImageForStorage(
    file: File,
    options?: Partial<CompressionOptions>,
  ): Promise<File> {
    const opts: CompressionOptions = {
      quality: this.settings.photoQuality,
      maxDimension: 1920,
      convertToWebP: true,
      ...options,
    }

    const result = await compressImage(file, opts)
    return result.file
  }

  // ==========================================================================
  // PAGINACIÓN Y QUERIES OPTIMIZADAS
  // ==========================================================================

  /**
   * Obtener DB instance (acceso directo para queries)
   */
  getDB() {
    return (offlineStorage as any).db
  }

  /**
   * Obtener assignments paginados
   */
  async getAssignmentsPaginated(
    page: number = 0,
    pageSize: number = 20,
    filters?: {
      status?: string
      syncStatus?: string
    },
  ): Promise<{ items: any[]; total: number; hasMore: boolean }> {
    const db = this.getDB()
    let query = db.assignments.orderBy('updatedAt').reverse()

    // Aplicar filtros
    if (filters?.status) {
      query = query.filter((a) => a.status === filters.status)
    }
    if (filters?.syncStatus) {
      query = query.filter((a) => a._syncStatus === filters.syncStatus)
    }

    // Contar total
    const total = await query.count()

    // Obtener página
    const offset = page * pageSize
    const items = await query.offset(offset).limit(pageSize).toArray()

    // Descomprimir datos si es necesario
    const decompressedItems = items.map((item) => {
      if (typeof item.data === 'string' && item.data.startsWith('LZ:')) {
        try {
          item.data = this.decompressJSON(item.data.substring(3))
        } catch (error) {
          console.warn('Error al descomprimir assignment:', error)
        }
      }
      return item
    })

    return {
      items: decompressedItems,
      total,
      hasMore: offset + pageSize < total,
    }
  }

  /**
   * Obtener responses paginados
   */
  async getResponsesPaginated(
    page: number = 0,
    pageSize: number = 20,
    filters?: {
      assignmentId?: string
      isDraft?: boolean
      syncStatus?: string
    },
  ): Promise<{ items: any[]; total: number; hasMore: boolean }> {
    const db = this.getDB()
    let query = db.form_responses.orderBy('_lastSaved').reverse()

    // Aplicar filtros
    if (filters?.assignmentId) {
      query = query.filter((r) => r.assignmentId === filters.assignmentId)
    }
    if (filters?.isDraft !== undefined) {
      query = query.filter((r) => r._isDraft === filters.isDraft)
    }
    if (filters?.syncStatus) {
      query = query.filter((r) => r._syncStatus === filters.syncStatus)
    }

    const total = await query.count()
    const offset = page * pageSize
    const items = await query.offset(offset).limit(pageSize).toArray()

    // Descomprimir datos
    const decompressedItems = items.map((item) => {
      if (typeof item.data === 'string' && item.data.startsWith('LZ:')) {
        try {
          item.data = this.decompressJSON(item.data.substring(3))
        } catch (error) {
          console.warn('Error al descomprimir response:', error)
        }
      }
      return item
    })

    return {
      items: decompressedItems,
      total,
      hasMore: offset + pageSize < total,
    }
  }

  // ==========================================================================
  // SELECTIVE SYNC
  // ==========================================================================

  /**
   * Verificar si se debe sincronizar (considerando WiFi-only)
   */
  shouldSync(priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'): boolean {
    // Critical siempre se sincroniza
    if (priority === 'critical') {
      return true
    }

    // Si está habilitado WiFi-only, verificar conexión
    if (this.settings.wifiOnlyUploads) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (connection) {
        const effectiveType = connection.effectiveType
        // Solo permitir en WiFi o conexiones rápidas
        if (effectiveType === '4g' || effectiveType === '3g') {
          return false
        }
      }
    }

    return true
  }

  /**
   * Obtener items para sincronizar según prioridad
   */
  async getItemsToSync(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<any[]> {
    const db = this.getDB()

    switch (priority) {
      case 'critical':
        // Responses completas pendientes
        return db.form_responses
          .where('_syncStatus')
          .equals('pending')
          .filter((r) => !r._isDraft)
          .toArray()

      case 'high':
        // Photos pendientes
        return db.photos.where('_uploaded').equals(false).toArray()

      case 'medium':
        // Partial updates
        return db.form_responses
          .where('_syncStatus')
          .equals('pending')
          .filter((r) => r._isDraft)
          .toArray()

      case 'low':
        // Analytics, cache, etc.
        return []

      default:
        return []
    }
  }

  // ==========================================================================
  // DATA CLEANUP
  // ==========================================================================

  /**
   * Limpiar datos antiguos automáticamente
   */
  async cleanupOldData(options?: CleanupOptions): Promise<{
    deleted: {
      responses: number
      photos: number
      cache: number
      drafts: number
    }
    freedSpace: number
  } {
    const opts: CleanupOptions = {
      deleteSyncedResponsesOlderThan: this.settings.keepSyncedResponsesDays,
      deleteUploadedPhotosOlderThan: this.settings.keepUploadedPhotosDays,
      deleteExpiredCache: true,
      deleteOldDrafts: true,
      oldDraftDays: 7,
      ...options,
    }

    const db = this.getDB()
    const now = new Date()
    let freedSpace = 0

    const deleted = {
      responses: 0,
      photos: 0,
      cache: 0,
      drafts: 0,
    }

    // Eliminar responses synced antiguos
    if (opts.deleteSyncedResponsesOlderThan) {
      const cutoffDate = new Date(now.getTime() - opts.deleteSyncedResponsesOlderThan * 24 * 60 * 60 * 1000)
      const allResponses = await db.form_responses.toArray()
      const oldResponses = allResponses.filter(
        (r) => r._syncStatus === 'synced' && r._lastSaved < cutoffDate,
      )

      for (const response of oldResponses) {
        await db.form_responses.delete(response.id)
        deleted.responses++
        // Estimar espacio liberado (aproximado)
        freedSpace += JSON.stringify(response).length
      }
    }

    // Eliminar fotos subidas antiguas
    if (opts.deleteUploadedPhotosOlderThan) {
      const cutoffDate = new Date(now.getTime() - opts.deleteUploadedPhotosOlderThan * 24 * 60 * 60 * 1000)
      const allPhotos = await db.photos.toArray()
      const oldPhotos = allPhotos.filter(
        (p) => p._uploaded && p.metadata.timestamp < cutoffDate,
      )

      for (const photo of oldPhotos) {
        const size = photo.blob.size
        await db.photos.delete(photo.id)
        deleted.photos++
        freedSpace += size
      }
    }

    // Eliminar cache expirado
    if (opts.deleteExpiredCache) {
      const expiredCache = await db.cache
        .where('expiresAt')
        .below(now)
        .toArray()

      for (const item of expiredCache) {
        await db.cache.delete(item.key)
        deleted.cache++
        freedSpace += JSON.stringify(item.value).length
      }
    }

    // Eliminar drafts antiguos
    if (opts.deleteOldDrafts && opts.oldDraftDays) {
      const cutoffDate = new Date(now.getTime() - opts.oldDraftDays * 24 * 60 * 60 * 1000)
      const allResponses = await db.form_responses.toArray()
      const oldDrafts = allResponses.filter(
        (r) => r._isDraft && r._lastSaved < cutoffDate,
      )

      for (const draft of oldDrafts) {
        await db.form_responses.delete(draft.id)
        deleted.drafts++
        freedSpace += JSON.stringify(draft).length
      }
    }

    return { deleted, freedSpace }
  }

  /**
   * Limpiar todo el cache
   */
  async clearAllCache(): Promise<void> {
    const db = this.getDB()
    await db.cache.clear()
  }

  /**
   * Eliminar todos los drafts
   */
  async deleteAllDrafts(): Promise<void> {
    const db = this.getDB()
    const allResponses = await db.form_responses.toArray()
    const drafts = allResponses.filter((r) => r._isDraft)
    for (const draft of drafts) {
      await db.form_responses.delete(draft.id)
    }
  }

  // ==========================================================================
  // QUOTA MANAGEMENT
  // ==========================================================================

  /**
   * Obtener información de storage
   */
  async getStorageInfo(): Promise<StorageInfo> {
    // Obtener quota del navegador
    let quota = 0
    let usage = 0

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        quota = estimate.quota || 0
        usage = estimate.usage || 0
      } catch (error) {
        console.warn('Error al obtener quota:', error)
      }
    }

    // Calcular breakdown aproximado
    const db = this.getDB()
    const assignments = await db.assignments.toArray()
    const responses = await db.form_responses.toArray()
    const photos = await db.photos.toArray()
    const cache = await db.cache.toArray()

    const breakdown = {
      assignments: assignments.reduce((sum, a) => sum + JSON.stringify(a).length, 0),
      responses: responses.reduce((sum, r) => sum + JSON.stringify(r).length, 0),
      photos: photos.reduce((sum, p) => sum + p.blob.size, 0),
      cache: cache.reduce((sum, c) => sum + JSON.stringify(c.value).length, 0),
      other: 0,
    }

    const totalUsed = breakdown.assignments + breakdown.responses + breakdown.photos + breakdown.cache
    const available = quota > 0 ? quota - usage : 0
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0

    return {
      used: usage || totalUsed,
      available,
      percentUsed,
      quota,
      breakdown,
    }
  }

  /**
   * Verificar si se debe alertar por quota
   */
  async shouldAlertQuota(): Promise<boolean> {
    const info = await this.getStorageInfo()
    return info.percentUsed >= QUOTA_ALERT_THRESHOLD * 100
  }

  /**
   * Obtener sugerencias de limpieza
   */
  async getCleanupSuggestions(): Promise<{
    canFree: number
    suggestions: Array<{
      type: string
      description: string
      canFree: number
      action: () => Promise<void>
    }>
  }> {
    const db = this.getDB()
    const now = new Date()
    const suggestions: Array<{
      type: string
      description: string
      canFree: number
      action: () => Promise<void>
    }> = []

    let totalCanFree = 0

    // Cache expirado
    const expiredCache = await db.cache.where('expiresAt').below(now).toArray()
    if (expiredCache.length > 0) {
      const size = expiredCache.reduce((sum, c) => sum + JSON.stringify(c.value).length, 0)
      suggestions.push({
        type: 'cache',
        description: `${expiredCache.length} items de cache expirados`,
        canFree: size,
        action: async () => {
          for (const item of expiredCache) {
            await db.cache.delete(item.key)
          }
        },
      })
      totalCanFree += size
    }

    // Drafts antiguos (>7 días)
    const allResponses = await db.form_responses.toArray()
    const oldDrafts = allResponses.filter((r) => {
      if (!r._isDraft) return false
      const daysOld = (now.getTime() - r._lastSaved.getTime()) / (1000 * 60 * 60 * 24)
      return daysOld > 7
    })

    if (oldDrafts.length > 0) {
      const size = oldDrafts.reduce((sum, r) => sum + JSON.stringify(r).length, 0)
      suggestions.push({
        type: 'drafts',
        description: `${oldDrafts.length} borradores antiguos (>7 días)`,
        canFree: size,
        action: async () => {
          for (const draft of oldDrafts) {
            await db.form_responses.delete(draft.id)
          }
        },
      })
      totalCanFree += size
    }

    // Fotos subidas antiguas (>7 días)
    const allPhotos = await db.photos.toArray()
    const oldPhotos = allPhotos.filter((p) => {
      if (!p._uploaded) return false
      const daysOld = (now.getTime() - p.metadata.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      return daysOld > 7
    })

    if (oldPhotos.length > 0) {
      const size = oldPhotos.reduce((sum, p) => sum + p.blob.size, 0)
      suggestions.push({
        type: 'photos',
        description: `${oldPhotos.length} fotos subidas antiguas (>7 días)`,
        canFree: size,
        action: async () => {
          for (const photo of oldPhotos) {
            await db.photos.delete(photo.id)
          }
        },
      })
      totalCanFree += size
    }

    return {
      canFree: totalCanFree,
      suggestions,
    }
  }

  // ==========================================================================
  // BACKGROUND TASKS
  // ==========================================================================

  /**
   * Iniciar cleanup automático
   */
  startAutoCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId)
    }

    // Ejecutar cleanup cada X días
    const intervalMs = this.settings.cleanupFrequency * 24 * 60 * 60 * 1000

    this.cleanupIntervalId = setInterval(async () => {
      try {
        await this.cleanupOldData()
        console.log('Cleanup automático completado')
      } catch (error) {
        console.error('Error en cleanup automático:', error)
      }
    }, intervalMs)
  }

  /**
   * Detener cleanup automático
   */
  stopAutoCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId)
      this.cleanupIntervalId = null
    }
  }

  /**
   * Ejecutar compresión en idle
   */
  async compressInIdle(): Promise<void> {
    // Usar requestIdleCallback si está disponible
    if ('requestIdleCallback' in window) {
      return new Promise((resolve) => {
        requestIdleCallback(async () => {
          // Comprimir datos grandes no comprimidos
          // TODO: Implementar lógica de compresión en idle
          resolve()
        })
      })
    } else {
      // Fallback: ejecutar después de un delay
      setTimeout(async () => {
        // TODO: Implementar lógica de compresión
      }, 1000)
    }
  }

  // ==========================================================================
  // GUARDAR DATOS CON COMPRESIÓN
  // ==========================================================================

  /**
   * Guardar assignment con compresión si es necesario
   */
  async saveAssignment(assignment: any): Promise<void> {
    let dataToSave = { ...assignment }

    // Comprimir data si está habilitado y es grande
    if (this.settings.compressionEnabled && assignment.data) {
      const { compressed, stats } = this.compressJSON(assignment.data)
      if (stats.wasCompressed) {
        dataToSave.data = `LZ:${compressed}` // Prefijo para identificar comprimido
        this.compressionCache.set(assignment.id, stats)
      }
    }

    await offlineStorage.saveAssignment(dataToSave)
  }

  /**
   * Guardar response con compresión si es necesario
   */
  async saveResponse(response: any): Promise<void> {
    let dataToSave = { ...response }

    // Comprimir data si está habilitado
    if (this.settings.compressionEnabled && response.data) {
      const { compressed, stats } = this.compressJSON(response.data)
      if (stats.wasCompressed) {
        dataToSave.data = `LZ:${compressed}`
        this.compressionCache.set(response.id, stats)
      }
    }

    await offlineStorage.saveResponse(dataToSave)
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const dataManager = new DataManager()

