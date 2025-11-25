/**
 * Service Worker Manager - Gestión completa del Service Worker
 */

export interface ServiceWorkerState {
  /** Si está registrado */
  isRegistered: boolean
  /** Si hay una actualización disponible */
  needsUpdate: boolean
  /** Si se está instalando */
  isInstalling: boolean
  /** Si está activo */
  isActive: boolean
  /** Si está en espera */
  isWaiting: boolean
  /** Estado de conexión */
  isOnline: boolean
}

export interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'CACHE_UPDATED' | 'SYNC_SUCCESS' | 'SYNC_ERROR' | 'PUSH_RECEIVED'
  payload?: any
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private updateCheckInterval: number | null = null
  private stateListeners: Set<(state: ServiceWorkerState) => void> = new Set()
  private messageListeners: Set<(message: ServiceWorkerMessage) => void> = new Set()
  private broadcastChannel: BroadcastChannel | null = null
  private connectionCheckInterval: number | null = null
  private lastConnectionCheck: boolean = true
  private isCheckingConnection: boolean = false

  constructor() {
    // Crear BroadcastChannel para comunicación
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('sw-messages')
      this.broadcastChannel.onmessage = (event) => {
        this.messageListeners.forEach((listener) => listener(event.data))
      }
    }

    // Escuchar cambios de conexión del navegador
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        // Cuando el navegador dice que está online, verificar realmente
        this.checkRealConnection()
      })
      window.addEventListener('offline', () => {
        // Cuando el navegador dice que está offline, actualizar inmediatamente
        this.lastConnectionCheck = false
        this.notifyStateChange()
      })
    }

    // Verificar conexión real periódicamente (cada 30 segundos)
    this.startConnectionCheck()
  }

  /**
   * Verificar conexión real haciendo ping al backend
   */
  private async checkRealConnection(): Promise<boolean> {
    if (this.isCheckingConnection) {
      return this.lastConnectionCheck
    }

    this.isCheckingConnection = true

    try {
      // Si navigator.onLine es false, asumir offline sin verificar
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.lastConnectionCheck = false
        this.isCheckingConnection = false
        this.notifyStateChange()
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
          this.lastConnectionCheck = true
          this.isCheckingConnection = false
          this.notifyStateChange()
          return true
        } else {
          this.lastConnectionCheck = false
          this.isCheckingConnection = false
          this.notifyStateChange()
          return false
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        // Si falla el fetch, probablemente no hay conexión
        this.lastConnectionCheck = false
        this.isCheckingConnection = false
        this.notifyStateChange()
        return false
      }
    } catch (error) {
      this.lastConnectionCheck = false
      this.isCheckingConnection = false
      this.notifyStateChange()
      return false
    }
  }

  /**
   * Iniciar verificación periódica de conexión
   */
  private startConnectionCheck(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval)
    }

    // Verificar inmediatamente
    this.checkRealConnection()

    // Verificar cada 30 segundos
    this.connectionCheckInterval = window.setInterval(() => {
      this.checkRealConnection()
    }, 30000)
  }

  /**
   * Detener verificación periódica de conexión
   */
  private stopConnectionCheck(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval)
      this.connectionCheckInterval = null
    }
  }

  /**
   * Registrar Service Worker
   * Nota: VitePWA ya registra el SW automáticamente, así que primero intentamos obtener el existente
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Workers no están soportados')
      return null
    }

    try {
      // Primero intentar obtener el SW ya registrado (por VitePWA)
      let registration = await navigator.serviceWorker.getRegistration()
      
      // Si no existe, intentar registrarlo manualmente
      if (!registration) {
        // En desarrollo, VitePWA usa dev-sw.js, en producción usa sw.js
        const swPath = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js'
        
        try {
          registration = await navigator.serviceWorker.register(swPath, {
            scope: '/',
          })
        } catch (registerError) {
          // Si falla, intentar con sw.js como fallback
          if (swPath !== '/sw.js') {
            try {
              registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
              })
            } catch (fallbackError) {
              console.warn('No se pudo registrar Service Worker. VitePWA debería manejarlo automáticamente.')
              return null
            }
          } else {
            console.warn('No se pudo registrar Service Worker. VitePWA debería manejarlo automáticamente.')
            return null
          }
        }
      }

      this.registration = registration

      // Escuchar mensajes del SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.messageListeners.forEach((listener) => listener(event.data))
      })

      // Escuchar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible
              this.notifyStateChange()
            }
          })
        }
      })

      // Escuchar cambios de estado
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.notifyStateChange()
        // Recargar página cuando se activa nuevo SW
        window.location.reload()
      })

      this.notifyStateChange()

      if (registration) {
        console.log('Service Worker obtenido/registrado exitosamente')
      }
      return registration
    } catch (error) {
      // No mostrar error si VitePWA ya está manejando el SW
      console.warn('Service Worker: VitePWA debería manejarlo automáticamente', error)
      return null
    }
  }

  /**
   * Obtener el registration actual del Service Worker
   */
  async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.registration) {
      // Si no hay registration, intentar obtenerlo o registrarlo
      return await this.registerServiceWorker()
    }
    return this.registration
  }

  /**
   * Verificar actualizaciones manualmente
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      await this.registerServiceWorker()
    }

    if (!this.registration) return false

    try {
      await this.registration.update()
      this.notifyStateChange()
      return this.registration.waiting !== null
    } catch (error) {
      console.error('Error al verificar actualizaciones:', error)
      return false
    }
  }

  /**
   * Actualizar aplicación (skip waiting)
   */
  async updateApp(): Promise<void> {
    if (!this.registration?.waiting) {
      console.warn('No hay Service Worker en espera')
      return
    }

    // Enviar mensaje al SW para que haga skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })

    // También usar BroadcastChannel si está disponible
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  /**
   * Enviar mensaje al Service Worker
   */
  async postMessage(message: ServiceWorkerMessage): Promise<void> {
    if (!navigator.serviceWorker.controller) {
      console.warn('No hay Service Worker activo')
      return
    }

    navigator.serviceWorker.controller.postMessage(message)
  }

  /**
   * Registrar acción para background sync
   */
  async registerBackgroundSync(tag: string, data?: any): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('sync' in (self as any).registration)) {
      console.warn('Background Sync no está soportado')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      await (registration as any).sync.register(tag)

      // Guardar datos en IndexedDB si se proporcionan
      if (data) {
        // Aquí se podría guardar en IndexedDB para que el SW los procese
        await this.postMessage({
          type: 'SYNC_SUCCESS',
          payload: { tag, data },
        })
      }

      return true
    } catch (error) {
      console.error('Error al registrar background sync:', error)
      return false
    }
  }

  /**
   * Obtener estado actual
   */
  getState(): ServiceWorkerState {
    // Usar la verificación real de conexión en lugar de solo navigator.onLine
    const isOnline = this.lastConnectionCheck
    const controller = navigator.serviceWorker?.controller
    const waiting = this.registration?.waiting
    const installing = this.registration?.installing

    return {
      isRegistered: this.registration !== null,
      needsUpdate: waiting !== null,
      isInstalling: installing !== null,
      isActive: controller !== null,
      isWaiting: waiting !== null,
      isOnline,
    }
  }

  /**
   * Suscribirse a cambios de estado
   */
  onStateChange(listener: (state: ServiceWorkerState) => void): () => void {
    this.stateListeners.add(listener)
    // Notificar estado inicial
    listener(this.getState())

    // Retornar función para desuscribirse
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  /**
   * Suscribirse a mensajes del SW
   */
  onMessage(listener: (message: ServiceWorkerMessage) => void): () => void {
    this.messageListeners.add(listener)
    return () => {
      this.messageListeners.delete(listener)
    }
  }

  /**
   * Iniciar verificación periódica de actualizaciones
   */
  startUpdateCheck(intervalMinutes: number = 60): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval)
    }

    this.updateCheckInterval = window.setInterval(() => {
      this.checkForUpdates()
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * Detener verificación periódica
   */
  stopUpdateCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval)
      this.updateCheckInterval = null
    }
  }

  /**
   * Notificar cambios de estado a todos los listeners
   */
  private notifyStateChange(): void {
    const state = this.getState()
    this.stateListeners.forEach((listener) => listener(state))
  }

  /**
   * Limpiar recursos
   */
  cleanup(): void {
    this.stopUpdateCheck()
    this.stopConnectionCheck()
    this.stateListeners.clear()
    this.messageListeners.clear()
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }
  }
}

// Instancia singleton
export const serviceWorkerManager = new ServiceWorkerManager()

/**
 * Registrar Service Worker al cargar
 * Nota: En desarrollo, VitePWA maneja el registro automáticamente
 * Solo intentamos obtener el registration existente
 */
if (typeof window !== 'undefined') {
  // En desarrollo, VitePWA ya registra el SW, solo obtenemos el registration
  // En producción, intentamos registrarlo si no existe
  const initServiceWorker = async () => {
    // Esperar un poco para que VitePWA termine de registrar
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Intentar obtener el registration existente
    const registration = await serviceWorkerManager.registerServiceWorker()
    
    if (registration) {
      // Iniciar verificación periódica (cada hora)
      serviceWorkerManager.startUpdateCheck(60)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServiceWorker)
  } else {
    initServiceWorker()
  }
}

