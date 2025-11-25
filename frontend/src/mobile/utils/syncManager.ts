/**
 * SyncManager - Sistema de sincronización automática
 */

import { offlineStorage, type Assignment, type FormResponse, type Photo, type SyncQueueItem } from './offlineStorage'
import { dataManager } from './dataManager'
import api from '@/shared/lib/api'

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export type ConflictStrategy = 'server-wins' | 'local-wins' | 'merge' | 'manual'
export type SyncPriority = 'critical' | 'high' | 'medium' | 'low'
export type SyncStatus = 'idle' | 'syncing' | 'paused' | 'error' | 'completed'

export interface SyncProgress {
  total: number
  current: number
  success: number
  errors: number
  percentage: number
  estimatedTimeRemaining?: number // en segundos
  currentItem?: string
}

export interface SyncError {
  itemId: string
  itemType: 'assignment' | 'response' | 'photo' | 'queue'
  error: Error
  retryCount: number
  timestamp: Date
}

export interface Conflict {
  id: string
  type: 'assignment' | 'response'
  localVersion: number
  serverVersion: number
  localData: any
  serverData: any
  strategy?: ConflictStrategy
  resolved: boolean
}

export interface SyncOptions {
  /** Si sincronizar en background (sin notificaciones) */
  background?: boolean
  /** Estrategia de conflictos por defecto */
  conflictStrategy?: ConflictStrategy
  /** Si cancelar sync actual antes de iniciar */
  force?: boolean
  /** Items específicos a sincronizar */
  items?: {
    assignments?: string[]
    responses?: string[]
    photos?: string[]
  }
}

type SyncEventListener = (event: SyncEvent) => void

export interface SyncEvent {
  type: 'sync-start' | 'sync-progress' | 'sync-complete' | 'sync-error' | 'conflict-detected' | 'sync-cancelled'
  data?: any
  progress?: SyncProgress
  error?: SyncError
  conflict?: Conflict
}

// ============================================================================
// CLASE SYNC MANAGER
// ============================================================================

class SyncManager {
  private status: SyncStatus = 'idle'
  private progress: SyncProgress = {
    total: 0,
    current: 0,
    success: 0,
    errors: 0,
    percentage: 0,
  }
  private errors: SyncError[] = []
  private conflicts: Conflict[] = []
  private listeners: Set<SyncEventListener> = new Set()
  private syncAbortController: AbortController | null = null
  private lastSyncDate: Date | null = null
  private syncInterval: number | null = null
  private isOnline: boolean = navigator.onLine
  private isCheckingConnection: boolean = false

  constructor() {
    // Escuchar cambios de conexión
    if (typeof window !== 'undefined') {
      window.addEventListener('online', async () => {
        // Verificar conexión real antes de marcar como online
        await this.checkRealConnection()
        if (this.isOnline) {
          this.autoSync()
        }
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }

    // Verificar conexión real al inicializar
    this.checkRealConnection()
  }

  /**
   * Verificar conexión real haciendo ping al backend
   */
  private async checkRealConnection(): Promise<boolean> {
    if (this.isCheckingConnection) {
      return this.isOnline
    }

    this.isCheckingConnection = true

    try {
      // Si navigator.onLine es false, asumir offline sin verificar
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.isOnline = false
        this.isCheckingConnection = false
        return false
      }

      // Intentar hacer ping al endpoint /health del backend
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      let healthUrl: string
      
      if (apiUrl.startsWith('http')) {
        // URL absoluta: http://localhost:3000/api -> http://localhost:3000/health
        healthUrl = apiUrl.replace('/api', '/health')
      } else {
        // URL relativa: /api -> /health
        healthUrl = '/health'
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout

      try {
        const response = await fetch(healthUrl, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache',
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          this.isOnline = true
          this.isCheckingConnection = false
          return true
        } else {
          this.isOnline = false
          this.isCheckingConnection = false
          return false
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        // Si falla el fetch, probablemente no hay conexión
        this.isOnline = false
        this.isCheckingConnection = false
        return false
      }
    } catch (error) {
      this.isOnline = false
      this.isCheckingConnection = false
      return false
    }
  }

  // ============================================================================
  // MÉTODOS PRINCIPALES
  // ============================================================================

  /**
   * Sincronizar todo
   */
  async sync(options: SyncOptions = {}): Promise<void> {
    if (this.status === 'syncing' && !options.force) {
      console.warn('Sync ya está en progreso')
      return
    }

    // Verificar conexión real antes de sincronizar
    await this.checkRealConnection()

    if (!this.isOnline) {
      throw new Error('No hay conexión a Internet')
    }

    // Cancelar sync anterior si se fuerza
    if (options.force && this.syncAbortController) {
      this.cancelSync()
    }

    this.syncAbortController = new AbortController()
    this.status = 'syncing'
    this.errors = []
    this.conflicts = []

    try {
      this.emit({ type: 'sync-start' })

      // Obtener items pendientes
      const pendingItems = await this.getPendingItems(options.items)
      this.progress = {
        total: pendingItems.total,
        current: 0,
        success: 0,
        errors: 0,
        percentage: 0,
      }

      if (pendingItems.total === 0) {
        this.status = 'completed'
        this.lastSyncDate = new Date()
        this.emit({ type: 'sync-complete', progress: this.progress })
        return
      }

      // Ordenar por prioridad
      const sortedItems = this.prioritizeItems(pendingItems)

      // Sincronizar en orden
      await this.syncItems(sortedItems, options)

      this.status = 'completed'
      this.lastSyncDate = new Date()
      this.emit({ type: 'sync-complete', progress: this.progress })
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.status = 'idle'
        this.emit({ type: 'sync-cancelled' })
        return
      }

      this.status = 'error'
      const syncError: SyncError = {
        itemId: 'global',
        itemType: 'queue',
        error: error instanceof Error ? error : new Error(String(error)),
        retryCount: 0,
        timestamp: new Date(),
      }
      this.errors.push(syncError)
      this.emit({ type: 'sync-error', error: syncError })
      throw error
    }
  }

  /**
   * Sincronizar solo asignaciones
   */
  async syncAssignments(assignmentIds?: string[]): Promise<void> {
    await this.sync({
      items: { assignments: assignmentIds },
    })
  }

  /**
   * Sincronizar solo respuestas
   */
  async syncResponses(responseIds?: string[]): Promise<void> {
    await this.sync({
      items: { responses: responseIds },
    })
  }

  /**
   * Sincronizar solo fotos
   */
  async syncPhotos(photoIds?: string[]): Promise<void> {
    await this.sync({
      items: { photos: photoIds },
    })
  }

  /**
   * Procesar cola de acciones
   */
  async syncQueue(): Promise<void> {
    const queue = await offlineStorage.getQueue()

    for (const item of queue) {
      if (this.syncAbortController?.signal.aborted) break

      try {
        await this.processQueueItem(item)
        await offlineStorage.removeFromQueue(item.id)
      } catch (error: any) {
        const retryCount = item.retries + 1
        if (retryCount < 3) {
          await offlineStorage.incrementRetries(item.id, error.message)
        } else {
          // Máximo de retries alcanzado, remover de cola
          await offlineStorage.removeFromQueue(item.id)
          this.errors.push({
            itemId: item.id,
            itemType: 'queue',
            error: error instanceof Error ? error : new Error(String(error)),
            retryCount,
            timestamp: new Date(),
          })
        }
      }
    }
  }

  // ============================================================================
  // LÓGICA DE SINCRONIZACIÓN
  // ============================================================================

  /**
   * Obtener items pendientes de sincronización
   */
  private async getPendingItems(
    specificItems?: SyncOptions['items'],
  ): Promise<{
    assignments: Assignment[]
    responses: FormResponse[]
    photos: Photo[]
    queue: SyncQueueItem[]
    total: number
  }> {
    const [assignments, responses, photos, queue] = await Promise.all([
      specificItems?.assignments
        ? Promise.all(specificItems.assignments.map((id) => offlineStorage.getAssignment(id)))
        : offlineStorage.getAssignments({ syncStatus: 'pending' }),
      specificItems?.responses
        ? Promise.all(specificItems.responses.map((id) => offlineStorage.getResponse(id)))
        : (async () => {
            // Obtener todas las respuestas (drafts y finales) que están pendientes
            const allResponses = await offlineStorage.getDrafts()
            // También necesitamos obtener respuestas finales pendientes
            // Por ahora, solo obtenemos las que no son drafts y están pendientes
            return allResponses.filter((r) => !r._isDraft && r._syncStatus === 'pending')
          })(),
      specificItems?.photos
        ? Promise.all(specificItems.photos.map((id) => offlineStorage.getPhoto(id)))
        : (async () => {
            // Obtener todas las fotos no subidas
            // Necesitamos obtener todas las respuestas y luego sus fotos
            const allResponses = await offlineStorage.getDrafts()
            const allPhotoIds = new Set<string>()
            allResponses.forEach((r) => {
              if (r.photos) {
                r.photos.forEach((pid) => allPhotoIds.add(pid))
              }
            })
            const photos = await Promise.all(
              Array.from(allPhotoIds).map((id) => offlineStorage.getPhoto(id)),
            )
            return photos.filter((p): p is Photo => p !== undefined && !p._uploaded)
          })(),
      offlineStorage.getQueue(),
    ])

    const assignmentsList = Array.isArray(assignments)
      ? assignments
      : assignments.filter((a): a is Assignment => a !== undefined)

    const responsesList = Array.isArray(responses)
      ? responses
      : responses.filter((r): r is FormResponse => r !== undefined)

    const photosList = Array.isArray(photos)
      ? photos
      : photos.filter((p): p is Photo => p !== undefined)

    return {
      assignments: assignmentsList,
      responses: responsesList,
      photos: photosList,
      queue,
      total: assignmentsList.length + responsesList.length + photosList.length + queue.length,
    }
  }

  /**
   * Priorizar items para sincronización
   */
  private prioritizeItems(items: {
    assignments: Assignment[]
    responses: FormResponse[]
    photos: Photo[]
    queue: SyncQueueItem[]
  }): Array<{ type: 'assignment' | 'response' | 'photo' | 'queue'; item: any; priority: SyncPriority }> {
    const prioritized: Array<{ type: 'assignment' | 'response' | 'photo' | 'queue'; item: any; priority: SyncPriority }> = []

    // Critical: Responses completas
    items.responses.forEach((response) => {
      prioritized.push({ type: 'response', item: response, priority: 'critical' })
    })

    // High: Photos
    items.photos.forEach((photo) => {
      prioritized.push({ type: 'photo', item: photo, priority: 'high' })
    })

    // Medium: Queue items
    items.queue.forEach((queueItem) => {
      prioritized.push({ type: 'queue', item: queueItem, priority: 'medium' })
    })

    // Low: Assignments (generalmente son updates)
    items.assignments.forEach((assignment) => {
      prioritized.push({ type: 'assignment', item: assignment, priority: 'low' })
    })

    return prioritized
  }

  /**
   * Sincronizar items en orden
   */
  private async syncItems(
    items: Array<{ type: 'assignment' | 'response' | 'photo' | 'queue'; item: any; priority: SyncPriority }>,
    options: SyncOptions,
  ): Promise<void> {
    const startTime = Date.now()

    for (let i = 0; i < items.length; i++) {
      if (this.syncAbortController?.signal.aborted) {
        throw new Error('Sync cancelled')
      }

      const { type, item } = items[i]
      this.progress.current = i + 1
      this.progress.percentage = Math.round((this.progress.current / this.progress.total) * 100)

      // Calcular tiempo estimado
      if (i > 0) {
        const elapsed = (Date.now() - startTime) / 1000
        const avgTimePerItem = elapsed / i
        const remaining = this.progress.total - this.progress.current
        this.progress.estimatedTimeRemaining = Math.round(avgTimePerItem * remaining)
      }

      this.progress.currentItem = `${type}:${item.id}`
      this.emit({ type: 'sync-progress', progress: { ...this.progress } })

      try {
        switch (type) {
          case 'assignment':
            await this.syncAssignment(item, options)
            break
          case 'response':
            await this.syncResponse(item, options)
            break
          case 'photo':
            await this.syncPhoto(item)
            break
          case 'queue':
            await this.processQueueItem(item)
            await offlineStorage.removeFromQueue(item.id)
            break
        }

        this.progress.success++
      } catch (error: any) {
        this.progress.errors++

        // Determinar si hacer retry
        const shouldRetry = this.shouldRetry(error, 0)
        if (shouldRetry) {
          // Retry con exponential backoff
          await this.retryWithBackoff(() => {
            switch (type) {
              case 'assignment':
                return this.syncAssignment(item, options)
              case 'response':
                return this.syncResponse(item, options)
              case 'photo':
                return this.syncPhoto(item)
              default:
                return Promise.resolve()
            }
          }, 0)
        } else {
          const syncError: SyncError = {
            itemId: item.id,
            itemType: type,
            error: error instanceof Error ? error : new Error(String(error)),
            retryCount: 0,
            timestamp: new Date(),
          }
          this.errors.push(syncError)
          this.emit({ type: 'sync-error', error: syncError })
        }
      }
    }
  }

  /**
   * Sincronizar una asignación
   */
  private async syncAssignment(assignment: Assignment, options: SyncOptions): Promise<void> {
    try {
      // Verificar versión en servidor
      const serverAssignment = await api.get(`/assignments/${assignment.id}`).then((res) => res.data)

      // Detectar conflicto
      if (serverAssignment._version && serverAssignment._version > assignment._version) {
        const conflict = await this.handleConflict(
          {
            id: assignment.id,
            type: 'assignment',
            localVersion: assignment._version,
            serverVersion: serverAssignment._version,
            localData: assignment,
            serverData: serverAssignment,
            resolved: false,
          },
          options.conflictStrategy || 'server-wins',
        )

        if (!conflict.resolved) {
          throw new Error('Conflicto no resuelto')
        }
      }

      // Actualizar asignación local
      await dataManager.saveAssignment({
        ...assignment,
        _syncStatus: 'synced',
      })
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Asignación no existe en servidor, crear
        await api.post('/assignments', assignment)
        await offlineStorage.markAsSync(assignment.id)
      } else {
        throw error
      }
    }
  }

  /**
   * Sincronizar una respuesta
   */
  private async syncResponse(response: FormResponse, options: SyncOptions): Promise<void> {
    try {
      // Subir respuesta al servidor
      const formData = new FormData()
      formData.append('data', JSON.stringify(response.data))
      formData.append('assignmentId', response.assignmentId)

      if (response.signature) {
        formData.append('signature', response.signature)
      }

      if (response.location) {
        formData.append('location', JSON.stringify(response.location))
      }

      // Subir fotos asociadas
      if (response.photos && response.photos.length > 0) {
        const photos = await Promise.all(
          response.photos.map((photoId) => offlineStorage.getPhoto(photoId)),
        )

        for (const photo of photos) {
          if (photo && !photo._uploaded) {
            formData.append('photos', photo.blob, photo.metadata.filename)
          }
        }
      }

      await api.post(`/form-responses`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Marcar como sincronizado
      await dataManager.saveResponse({
        ...response,
        _syncStatus: 'synced',
      })

      // Marcar fotos como subidas
      if (response.photos) {
        for (const photoId of response.photos) {
          await offlineStorage.markAsUploaded(photoId)
        }
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Conflicto de versión
        const serverResponse = error.response.data
        const conflict = await this.handleConflict(
          {
            id: response.id,
            type: 'response',
            localVersion: response._version,
            serverVersion: serverResponse._version || 0,
            localData: response,
            serverData: serverResponse,
            resolved: false,
          },
          options.conflictStrategy || 'server-wins',
        )

        if (!conflict.resolved) {
          throw new Error('Conflicto no resuelto')
        }
      } else {
        throw error
      }
    }
  }

  /**
   * Sincronizar una foto
   */
  private async syncPhoto(photo: Photo): Promise<void> {
    try {
      const formData = new FormData()
      formData.append('photo', photo.blob, photo.metadata.filename)
      formData.append('responseId', photo.responseId)
      formData.append('metadata', JSON.stringify(photo.metadata))

      await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await offlineStorage.markAsUploaded(photo.id)
    } catch (error) {
      throw error
    }
  }

  /**
   * Procesar item de la cola
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    switch (item.action) {
      case 'submit-form':
        // Ya se maneja en syncResponse
        break
      case 'upload-photo':
        const photo = await offlineStorage.getPhoto(item.payload.photoId)
        if (photo) {
          await this.syncPhoto(photo)
        }
        break
      case 'sync-location':
        // Actualizar ubicación en servidor
        await api.put(`/form-responses/${item.payload.responseId}/location`, item.payload.location)
        break
      case 'update-assignment':
        await api.put(`/assignments/${item.payload.assignmentId}`, item.payload.data)
        break
    }
  }

  // ============================================================================
  // MANEJO DE CONFLICTOS
  // ============================================================================

  /**
   * Manejar conflicto de versión
   */
  private async handleConflict(conflict: Conflict, strategy: ConflictStrategy): Promise<Conflict> {
    this.conflicts.push(conflict)
    this.emit({ type: 'conflict-detected', conflict })

    switch (strategy) {
      case 'server-wins':
        // Usar datos del servidor
        await dataManager.saveAssignment({
          ...conflict.serverData,
          _syncStatus: 'synced',
        })
        conflict.resolved = true
        conflict.strategy = 'server-wins'
        break

      case 'local-wins':
        // Forzar datos locales
        if (conflict.type === 'assignment') {
          await api.put(`/assignments/${conflict.id}`, conflict.localData)
        } else {
          await api.put(`/form-responses/${conflict.id}`, conflict.localData)
        }
        conflict.resolved = true
        conflict.strategy = 'local-wins'
        break

      case 'merge':
        // Intentar merge automático (simple)
        const merged = this.mergeData(conflict.localData, conflict.serverData)
        if (conflict.type === 'assignment') {
          await api.put(`/assignments/${conflict.id}`, merged)
          await dataManager.saveAssignment({
            ...merged,
            _syncStatus: 'synced',
          })
        } else {
          await api.put(`/form-responses/${conflict.id}`, merged)
          await dataManager.saveResponse({
            ...merged,
            _syncStatus: 'synced',
          })
        }
        conflict.resolved = true
        conflict.strategy = 'merge'
        break

      case 'manual':
        // Dejar para resolución manual
        conflict.resolved = false
        conflict.strategy = 'manual'
        break
    }

    return conflict
  }

  /**
   * Merge simple de datos (prioriza local)
   */
  private mergeData(local: any, server: any): any {
    return {
      ...server,
      ...local,
      _version: Math.max(local._version || 0, server._version || 0) + 1,
    }
  }

  // ============================================================================
  // RETRY LOGIC
  // ============================================================================

  /**
   * Determinar si se debe hacer retry
   */
  private shouldRetry(error: any, retryCount: number): boolean {
    if (retryCount >= 3) return false

    // Auth errors: no retry
    if (error.response?.status === 401 || error.response?.status === 403) {
      return false
    }

    // Network errors: retry
    if (!error.response || error.code === 'NETWORK_ERROR') {
      return true
    }

    // Server errors (5xx): retry
    if (error.response.status >= 500) {
      return true
    }

    // Client errors (4xx): no retry (excepto 429 - rate limit)
    if (error.response.status >= 400 && error.response.status < 500) {
      return error.response.status === 429
    }

    return false
  }

  /**
   * Retry con exponential backoff
   */
  private async retryWithBackoff(fn: () => Promise<void>, retryCount: number): Promise<void> {
    const maxRetries = 3
    if (retryCount >= maxRetries) {
      throw new Error('Máximo de reintentos alcanzado')
    }

    try {
      await fn()
    } catch (error: any) {
      if (!this.shouldRetry(error, retryCount)) {
        throw error
      }

      // Calcular delay: exponential backoff
      const baseDelay = 1000 // 1 segundo
      const delay = baseDelay * Math.pow(2, retryCount)
      const jitter = Math.random() * 1000 // Jitter aleatorio

      await new Promise((resolve) => setTimeout(resolve, delay + jitter))

      return this.retryWithBackoff(fn, retryCount + 1)
    }
  }

  // ============================================================================
  // BACKGROUND SYNC
  // ============================================================================

  /**
   * Iniciar sincronización automática
   */
  startAutoSync(intervalMinutes: number = 5): void {
    this.stopAutoSync()

    // Sincronizar inmediatamente si hay items pendientes
    this.autoSync()

    // Sincronizar periódicamente
    this.syncInterval = window.setInterval(() => {
      this.autoSync()
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * Detener sincronización automática
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Sincronización automática (solo si hay items pendientes)
   */
  private async autoSync(): Promise<void> {
    if (!this.isOnline || this.status === 'syncing') {
      return
    }

    try {
      const pending = await this.getPendingItems()
      if (pending.total > 0) {
        await this.sync({ background: true })
      }
    } catch (error) {
      console.warn('Error en auto-sync:', error)
    }
  }

  // ============================================================================
  // CONTROL
  // ============================================================================

  /**
   * Cancelar sincronización actual
   */
  cancelSync(): void {
    if (this.syncAbortController) {
      this.syncAbortController.abort()
      this.syncAbortController = null
    }
    this.status = 'idle'
    this.emit({ type: 'sync-cancelled' })
  }

  // ============================================================================
  // EVENT EMITTER
  // ============================================================================

  /**
   * Suscribirse a eventos
   */
  on(event: SyncEvent['type'], listener: SyncEventListener): () => void {
    const wrappedListener = (e: SyncEvent) => {
      if (e.type === event) {
        listener(e)
      }
    }
    this.listeners.add(wrappedListener)
    return () => this.listeners.delete(wrappedListener)
  }

  /**
   * Emitir evento
   */
  private emit(event: SyncEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error en listener de sync:', error)
      }
    })
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Obtener estado actual
   */
  getStatus(): SyncStatus {
    return this.status
  }

  /**
   * Obtener progreso actual
   */
  getProgress(): SyncProgress {
    return { ...this.progress }
  }

  /**
   * Obtener errores
   */
  getErrors(): SyncError[] {
    return [...this.errors]
  }

  /**
   * Obtener conflictos
   */
  getConflicts(): Conflict[] {
    return [...this.conflicts]
  }

  /**
   * Obtener fecha de último sync
   */
  getLastSyncDate(): Date | null {
    return this.lastSyncDate
  }

  /**
   * Obtener cantidad de items pendientes
   */
  async getPendingCount(): Promise<number> {
    const pending = await this.getPendingItems()
    return pending.total
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

export const syncManager = new SyncManager()

// Iniciar auto-sync si hay conexión
if (typeof window !== 'undefined' && navigator.onLine) {
  syncManager.startAutoSync(5) // Cada 5 minutos
}

