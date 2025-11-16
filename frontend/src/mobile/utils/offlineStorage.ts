/**
 * OfflineStorageManager - Manager robusto de IndexedDB usando Dexie.js
 */

import Dexie, { Table } from 'dexie'

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export type SyncStatus = 'synced' | 'pending' | 'conflict'
export type QueueAction = 'submit-form' | 'upload-photo' | 'sync-location' | 'update-assignment'

export interface Assignment {
  id: string
  formId: string
  userId: string
  data: Record<string, any>
  status: string
  createdAt: Date
  updatedAt: Date
  _syncStatus: SyncStatus
  _version: number
}

export interface FormResponse {
  id: string
  assignmentId: string
  data: Record<string, any>
  photos?: string[] // IDs de fotos
  signature?: string // Base64
  location?: {
    latitude: number
    longitude: number
    accuracy?: number
    address?: string
  }
  _isDraft: boolean
  _syncStatus: SyncStatus
  _lastSaved: Date
  _version: number
}

export interface Photo {
  id: string
  responseId: string
  blob: Blob
  metadata: {
    filename: string
    size: number
    type: string
    width?: number
    height?: number
    timestamp: Date
  }
  _uploaded: boolean
}

export interface SyncQueueItem {
  id: string
  action: QueueAction
  payload: Record<string, any>
  retries: number
  createdAt: Date
  lastError?: string
}

export interface CacheItem {
  key: string
  value: any
  expiresAt: Date
}

// ============================================================================
// SCHEMA DE BASE DE DATOS
// ============================================================================

class CollectorDatabase extends Dexie {
  assignments!: Table<Assignment, string>
  form_responses!: Table<FormResponse, string>
  photos!: Table<Photo, string>
  sync_queue!: Table<SyncQueueItem, string>
  cache!: Table<CacheItem, string>

  constructor() {
    super('CollectorEnterpriseDB')

    // Definir schema
    this.version(1).stores({
      assignments: 'id, formId, userId, status, _syncStatus, createdAt, updatedAt',
      form_responses: 'id, assignmentId, _isDraft, _syncStatus, _lastSaved',
      photos: 'id, responseId, _uploaded',
      sync_queue: 'id, action, createdAt, retries',
      cache: 'key, expiresAt',
    })

    // Migración a versión 2: agregar índices adicionales
    this.version(2).stores({
      assignments: 'id, formId, userId, status, _syncStatus, createdAt, updatedAt, _version',
      form_responses: 'id, assignmentId, _isDraft, _syncStatus, _lastSaved, _version',
      photos: 'id, responseId, _uploaded, [responseId+_uploaded]',
      sync_queue: 'id, action, createdAt, retries, [action+retries]',
      cache: 'key, expiresAt',
    }).upgrade((tx) => {
      // Migración de datos si es necesario
      return tx.table('assignments').toCollection().modify((assignment) => {
        if (!assignment._version) {
          assignment._version = 1
        }
      })
    })
  }
}

// ============================================================================
// CLASE OFFLINE STORAGE MANAGER
// ============================================================================

class OfflineStorageManager {
  private db: CollectorDatabase
  private initPromise: Promise<void> | null = null

  constructor() {
    this.db = new CollectorDatabase()
  }

  /**
   * Inicializar la base de datos
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = (async () => {
      try {
        await this.db.open()
        console.log('IndexedDB inicializado correctamente')
      } catch (error) {
        console.error('Error al inicializar IndexedDB:', error)
        throw this.handleError(error)
      }
    })()

    return this.initPromise
  }

  // ============================================================================
  // MÉTODOS PARA ASSIGNMENTS
  // ============================================================================

  /**
   * Obtener asignaciones con filtros opcionales
   */
  async getAssignments(filter?: {
    userId?: string
    status?: string
    syncStatus?: SyncStatus
  }): Promise<Assignment[]> {
    await this.init()

    try {
      let collection = this.db.assignments.toCollection()

      if (filter?.userId) {
        collection = collection.filter((a) => a.userId === filter.userId)
      }
      if (filter?.status) {
        collection = collection.filter((a) => a.status === filter.status)
      }
      if (filter?.syncStatus) {
        collection = collection.filter((a) => a._syncStatus === filter.syncStatus)
      }

      return await collection.sortBy('updatedAt')
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener una asignación por ID
   */
  async getAssignment(id: string): Promise<Assignment | undefined> {
    await this.init()

    try {
      return await this.db.assignments.get(id)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Guardar una asignación
   */
  async saveAssignment(data: Partial<Assignment> & { id: string }): Promise<string> {
    await this.init()

    try {
      const existing = await this.db.assignments.get(data.id)
      const now = new Date()

      const assignment: Assignment = {
        id: data.id,
        formId: data.formId || existing?.formId || '',
        userId: data.userId || existing?.userId || '',
        data: data.data || existing?.data || {},
        status: data.status || existing?.status || 'pending',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        _syncStatus: data._syncStatus || existing?._syncStatus || 'pending',
        _version: (existing?._version || 0) + 1,
      }

      await this.db.assignments.put(assignment)
      return assignment.id
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Eliminar una asignación
   */
  async deleteAssignment(id: string): Promise<void> {
    await this.init()

    try {
      await this.db.assignments.delete(id)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Marcar asignación como sincronizada
   */
  async markAsSync(id: string): Promise<void> {
    await this.init()

    try {
      await this.db.assignments.update(id, {
        _syncStatus: 'synced',
        updatedAt: new Date(),
      })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // ============================================================================
  // MÉTODOS PARA FORM RESPONSES
  // ============================================================================

  /**
   * Obtener una respuesta por ID
   */
  async getResponse(id: string): Promise<FormResponse | undefined> {
    await this.init()

    try {
      return await this.db.form_responses.get(id)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Guardar una respuesta (final)
   */
  async saveResponse(data: Partial<FormResponse> & { id: string; assignmentId: string }): Promise<string> {
    await this.init()

    try {
      const existing = await this.db.form_responses.get(data.id)
      const now = new Date()

      const response: FormResponse = {
        id: data.id,
        assignmentId: data.assignmentId,
        data: data.data || existing?.data || {},
        photos: data.photos || existing?.photos,
        signature: data.signature || existing?.signature,
        location: data.location || existing?.location,
        _isDraft: false,
        _syncStatus: data._syncStatus || existing?._syncStatus || 'pending',
        _lastSaved: now,
        _version: (existing?._version || 0) + 1,
      }

      await this.db.form_responses.put(response)
      return response.id
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Guardar un borrador
   */
  async saveDraft(data: Partial<FormResponse> & { assignmentId: string }): Promise<string> {
    await this.init()

    try {
      const id = data.id || `draft-${data.assignmentId}`
      const existing = await this.db.form_responses.get(id)
      const now = new Date()

      const draft: FormResponse = {
        id,
        assignmentId: data.assignmentId,
        data: data.data || existing?.data || {},
        photos: data.photos || existing?.photos,
        signature: data.signature || existing?.signature,
        location: data.location || existing?.location,
        _isDraft: true,
        _syncStatus: 'pending',
        _lastSaved: now,
        _version: (existing?._version || 0) + 1,
      }

      await this.db.form_responses.put(draft)
      return draft.id
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener todos los borradores
   */
  async getDrafts(): Promise<FormResponse[]> {
    await this.init()

    try {
      return await this.db.form_responses
        .where('_isDraft')
        .equals(true)
        .sortBy('_lastSaved')
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Eliminar un borrador
   */
  async deleteDraft(id: string): Promise<void> {
    await this.init()

    try {
      await this.db.form_responses.delete(id)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // ============================================================================
  // MÉTODOS PARA PHOTOS
  // ============================================================================

  /**
   * Guardar una foto
   * Nota: La compresión se debe hacer ANTES de llamar a este método
   * Usar dataManager.compressImageForStorage() primero
   */
  async savePhoto(blob: Blob, metadata: Photo['metadata'], responseId: string): Promise<string> {
    await this.init()

    try {
      const id = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const photo: Photo = {
        id,
        responseId,
        blob,
        metadata: {
          ...metadata,
          timestamp: metadata.timestamp || new Date(),
        },
        _uploaded: false,
      }

      await this.db.photos.add(photo)
      return id
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener una foto por ID
   */
  async getPhoto(id: string): Promise<Photo | undefined> {
    await this.init()

    try {
      return await this.db.photos.get(id)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener todas las fotos de una respuesta
   */
  async getPhotos(responseId: string): Promise<Photo[]> {
    await this.init()

    try {
      return await this.db.photos
        .where('responseId')
        .equals(responseId)
        .toArray()
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Eliminar una foto
   */
  async deletePhoto(id: string): Promise<void> {
    await this.init()

    try {
      await this.db.photos.delete(id)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Marcar foto como subida
   */
  async markAsUploaded(id: string): Promise<void> {
    await this.init()

    try {
      await this.db.photos.update(id, { _uploaded: true })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // ============================================================================
  // MÉTODOS PARA SYNC QUEUE
  // ============================================================================

  /**
   * Agregar acción a la cola de sincronización
   */
  async addToQueue(action: QueueAction, payload: Record<string, any>): Promise<string> {
    await this.init()

    try {
      const id = `sync-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const queueItem: SyncQueueItem = {
        id,
        action,
        payload,
        retries: 0,
        createdAt: new Date(),
      }

      await this.db.sync_queue.add(queueItem)
      return id
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener cola de sincronización
   */
  async getQueue(): Promise<SyncQueueItem[]> {
    await this.init()

    try {
      return await this.db.sync_queue
        .orderBy('createdAt')
        .toArray()
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Actualizar item de la cola (para retries)
   */
  async updateQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    await this.init()

    try {
      await this.db.sync_queue.update(id, updates)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Eliminar de la cola
   */
  async removeFromQueue(id: string): Promise<void> {
    await this.init()

    try {
      await this.db.sync_queue.delete(id)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Limpiar cola
   */
  async clearQueue(): Promise<void> {
    await this.init()

    try {
      await this.db.sync_queue.clear()
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Incrementar retries de un item
   */
  async incrementRetries(id: string, error?: string): Promise<void> {
    await this.init()

    try {
      const item = await this.db.sync_queue.get(id)
      if (item) {
        await this.db.sync_queue.update(id, {
          retries: item.retries + 1,
          lastError: error,
        })
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // ============================================================================
  // MÉTODOS DE UTILITY
  // ============================================================================

  /**
   * Limpiar toda la base de datos
   */
  async clear(): Promise<void> {
    await this.init()

    try {
      await this.db.transaction('rw', this.db.tables, async () => {
        await Promise.all(this.db.tables.map((table) => table.clear()))
      })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener tamaño usado (aproximado)
   */
  async getSize(): Promise<number> {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
      return 0
    }

    try {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    } catch (error) {
      console.warn('No se pudo obtener tamaño de storage:', error)
      return 0
    }
  }

  /**
   * Exportar datos
   */
  async export(): Promise<{
    assignments: Assignment[]
    form_responses: FormResponse[]
    photos: number // Solo contamos, no exportamos blobs
    sync_queue: SyncQueueItem[]
    cache: CacheItem[]
    exportedAt: Date
  }> {
    await this.init()

    try {
      const [assignments, form_responses, photos, sync_queue, cache] = await Promise.all([
        this.db.assignments.toArray(),
        this.db.form_responses.toArray(),
        this.db.photos.toArray(),
        this.db.sync_queue.toArray(),
        this.db.cache.toArray(),
      ])

      return {
        assignments,
        form_responses,
        photos: photos.length,
        sync_queue,
        cache,
        exportedAt: new Date(),
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Importar datos
   */
  async import(data: {
    assignments?: Assignment[]
    form_responses?: FormResponse[]
    sync_queue?: SyncQueueItem[]
    cache?: CacheItem[]
  }): Promise<void> {
    await this.init()

    try {
      await this.db.transaction('rw', this.db.tables, async () => {
        if (data.assignments) {
          await this.db.assignments.bulkPut(data.assignments)
        }
        if (data.form_responses) {
          await this.db.form_responses.bulkPut(data.form_responses)
        }
        if (data.sync_queue) {
          await this.db.sync_queue.bulkPut(data.sync_queue)
        }
        if (data.cache) {
          await this.db.cache.bulkPut(data.cache)
        }
      })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Limpiar cache expirado
   */
  async cleanExpiredCache(): Promise<number> {
    await this.init()

    try {
      const now = new Date()
      const expired = await this.db.cache
        .where('expiresAt')
        .below(now)
        .toArray()

      if (expired.length > 0) {
        await this.db.cache.bulkDelete(expired.map((item) => item.key))
      }

      return expired.length
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Guardar en cache
   */
  async setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    await this.init()

    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
      await this.db.cache.put({
        key,
        value,
        expiresAt,
      })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Obtener de cache
   */
  async getCache(key: string): Promise<any | null> {
    await this.init()

    try {
      const item = await this.db.cache.get(key)
      if (!item) return null

      // Verificar si expiró
      if (item.expiresAt < new Date()) {
        await this.db.cache.delete(key)
        return null
      }

      return item.value
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // ============================================================================
  // MANEJO DE ERRORES
  // ============================================================================

  /**
   * Manejar errores de IndexedDB
   */
  private handleError(error: any): Error {
    if (error instanceof Dexie.QuotaExceededError) {
      const customError = new Error('Espacio de almacenamiento insuficiente. Por favor, libera espacio.')
      ;(customError as any).code = 'QUOTA_EXCEEDED'
      return customError
    }

    if (error instanceof Dexie.DatabaseClosedError) {
      const customError = new Error('Base de datos cerrada. Reintentando...')
      ;(customError as any).code = 'DATABASE_CLOSED'
      return customError
    }

    if (error instanceof Dexie.ConstraintError) {
      const customError = new Error('Error de restricción en la base de datos')
      ;(customError as any).code = 'CONSTRAINT_ERROR'
      return customError
    }

    // Error genérico
    console.error('Error en IndexedDB:', error)
    return error instanceof Error ? error : new Error(String(error))
  }

  /**
   * Intentar recovery en caso de corrupción
   */
  async attemptRecovery(): Promise<boolean> {
    try {
      // Cerrar base de datos
      this.db.close()

      // Eliminar base de datos corrupta
      await Dexie.delete('CollectorEnterpriseDB')

      // Recrear
      this.db = new CollectorDatabase()
      await this.init()

      return true
    } catch (error) {
      console.error('Error en recovery:', error)
      return false
    }
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

export const offlineStorage = new OfflineStorageManager()

// Inicializar automáticamente
if (typeof window !== 'undefined') {
  offlineStorage.init().catch((error) => {
    console.error('Error al inicializar offline storage:', error)
  })
}

