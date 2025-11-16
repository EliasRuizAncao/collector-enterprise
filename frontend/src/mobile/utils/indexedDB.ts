/**
 * Utilidades para IndexedDB
 * Abstracción simple para manejar almacenamiento local robusto
 */

/**
 * Nombre de la base de datos
 */
const DB_NAME = 'collector-enterprise'
const DB_VERSION = 2 // Incrementado para agregar nuevos stores

/**
 * Stores disponibles
 */
export const STORES = {
  ASSIGNMENTS: 'assignments',
  SYNC_QUEUE: 'sync_queue',
  FORMS: 'forms',
  FORM_DRAFTS: 'form_drafts',
  FORM_SUBMISSIONS: 'form_submissions',
} as const

/**
 * Tipo para una asignación con metadatos de sync
 */
export interface AssignmentWithSync extends Record<string, any> {
  id: string
  _syncStatus?: 'synced' | 'pending' | 'syncing' | 'error'
  _lastModified?: number
  _localVersion?: number
  _serverVersion?: number
}

/**
 * Tipo para una acción en la cola de sincronización
 */
export interface SyncAction {
  id: string
  type: 'startAssignment' | 'completeAssignment' | 'updateProgress' | 'updateAssignment'
  assignmentId: string
  data: Record<string, any>
  timestamp: number
  retryCount: number
  lastError?: string
}

/**
 * Clase para manejar IndexedDB
 */
class IndexedDBManager {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null

  /**
   * Inicializar la base de datos
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('Error al abrir IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store de asignaciones
        if (!db.objectStoreNames.contains(STORES.ASSIGNMENTS)) {
          const assignmentsStore = db.createObjectStore(STORES.ASSIGNMENTS, {
            keyPath: 'id',
          })
          assignmentsStore.createIndex('syncStatus', '_syncStatus', { unique: false })
          assignmentsStore.createIndex('lastModified', '_lastModified', { unique: false })
        }

        // Store de cola de sincronización
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
          })
          syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false })
          syncQueueStore.createIndex('assignmentId', 'assignmentId', { unique: false })
        }

        // Store de formularios (para cache)
        if (!db.objectStoreNames.contains(STORES.FORMS)) {
          db.createObjectStore(STORES.FORMS, { keyPath: 'id' })
        }

        // Store de borradores de formularios
        if (!db.objectStoreNames.contains(STORES.FORM_DRAFTS)) {
          const draftsStore = db.createObjectStore(STORES.FORM_DRAFTS, {
            keyPath: 'assignmentId',
          })
          draftsStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Store de envíos pendientes de formularios (offline)
        if (!db.objectStoreNames.contains(STORES.FORM_SUBMISSIONS)) {
          const submissionsStore = db.createObjectStore(STORES.FORM_SUBMISSIONS, {
            keyPath: 'assignmentId',
          })
          submissionsStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  /**
   * Obtener la base de datos (inicializa si es necesario)
   */
  async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      return this.init()
    }
    return this.db
  }

  /**
   * Guardar una asignación
   */
  async saveAssignment(assignment: AssignmentWithSync): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(STORES.ASSIGNMENTS, 'readwrite')
    const store = tx.objectStore(STORES.ASSIGNMENTS)

    const assignmentWithMeta: AssignmentWithSync = {
      ...assignment,
      _lastModified: Date.now(),
      _syncStatus: assignment._syncStatus || 'pending',
    }

    return new Promise((resolve, reject) => {
      const request = store.put(assignmentWithMeta)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Error al guardar asignación'))
    })
  }

  /**
   * Obtener todas las asignaciones
   */
  async getAllAssignments(): Promise<AssignmentWithSync[]> {
    const db = await this.getDB()
    const tx = db.transaction(STORES.ASSIGNMENTS, 'readonly')
    const store = tx.objectStore(STORES.ASSIGNMENTS)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(new Error('Error al obtener asignaciones'))
    })
  }

  /**
   * Obtener una asignación por ID
   */
  async getAssignment(id: string): Promise<AssignmentWithSync | undefined> {
    const db = await this.getDB()
    const tx = db.transaction(STORES.ASSIGNMENTS, 'readonly')
    const store = tx.objectStore(STORES.ASSIGNMENTS)

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Error al obtener asignación'))
    })
  }

  /**
   * Eliminar una asignación
   */
  async deleteAssignment(id: string): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(STORES.ASSIGNMENTS, 'readwrite')
    const store = tx.objectStore(STORES.ASSIGNMENTS)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Error al eliminar asignación'))
    })
  }

  /**
   * Agregar acción a la cola de sincronización
   */
  async addToSyncQueue(action: Omit<SyncAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const db = await this.getDB()
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
    const store = tx.objectStore(STORES.SYNC_QUEUE)

    const syncAction: SyncAction = {
      ...action,
      id: `${action.type}-${action.assignmentId}-${Date.now()}`,
      timestamp: Date.now(),
      retryCount: 0,
    }

    return new Promise((resolve, reject) => {
      const request = store.add(syncAction)
      request.onsuccess = () => resolve(syncAction.id)
      request.onerror = () => reject(new Error('Error al agregar a la cola de sync'))
    })
  }

  /**
   * Obtener todas las acciones pendientes de la cola
   */
  async getSyncQueue(): Promise<SyncAction[]> {
    const db = await this.getDB()
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readonly')
    const store = tx.objectStore(STORES.SYNC_QUEUE)
    const index = store.index('timestamp')

    return new Promise((resolve, reject) => {
      const request = index.getAll()
      request.onsuccess = () => {
        const actions = request.result || []
        // Ordenar por timestamp (FIFO)
        resolve(actions.sort((a, b) => a.timestamp - b.timestamp))
      }
      request.onerror = () => reject(new Error('Error al obtener cola de sync'))
    })
  }

  /**
   * Eliminar acción de la cola de sincronización
   */
  async removeFromSyncQueue(actionId: string): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
    const store = tx.objectStore(STORES.SYNC_QUEUE)

    return new Promise((resolve, reject) => {
      const request = store.delete(actionId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Error al eliminar de la cola de sync'))
    })
  }

  /**
   * Actualizar contador de reintentos de una acción
   */
  async updateSyncAction(actionId: string, updates: Partial<SyncAction>): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
    const store = tx.objectStore(STORES.SYNC_QUEUE)

    return new Promise((resolve, reject) => {
      const getRequest = store.get(actionId)
      getRequest.onsuccess = () => {
        const action = getRequest.result
        if (action) {
          const updatedAction = { ...action, ...updates }
          const putRequest = store.put(updatedAction)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(new Error('Error al actualizar acción de sync'))
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(new Error('Error al obtener acción de sync'))
    })
  }

  /**
   * Limpiar todas las asignaciones
   */
  async clearAssignments(): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(STORES.ASSIGNMENTS, 'readwrite')
    const store = tx.objectStore(STORES.ASSIGNMENTS)

    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Error al limpiar asignaciones'))
    })
  }

  /**
   * Limpiar cola de sincronización
   */
  async clearSyncQueue(): Promise<void> {
    const db = await this.getDB()
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
    const store = tx.objectStore(STORES.SYNC_QUEUE)

    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Error al limpiar cola de sync'))
    })
  }
}

// Singleton instance
export const dbManager = new IndexedDBManager()

/**
 * Inicializar IndexedDB
 */
export const initIndexedDB = async (): Promise<void> => {
  try {
    await dbManager.init()
  } catch (error) {
    console.error('Error al inicializar IndexedDB:', error)
    throw error
  }
}

