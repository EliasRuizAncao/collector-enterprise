/**
 * Push Notification Manager - Gestión de notificaciones push
 */

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  actions?: NotificationAction[]
}

class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null

  /**
   * Inicializar con Service Worker registration
   */
  async initialize(registration: ServiceWorkerRegistration): Promise<void> {
    this.registration = registration

    // Escuchar clicks en notificaciones
    if ('Notification' in window) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          this.handleNotificationClick(event.data.payload)
        }
      })
    }
  }

  /**
   * Solicitar permiso para notificaciones
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Las notificaciones no están soportadas en este navegador')
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      throw new Error('El permiso de notificaciones fue denegado')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  /**
   * Verificar si tiene permiso
   */
  hasPermission(): boolean {
    return 'Notification' in window && Notification.permission === 'granted'
  }

  /**
   * Mostrar notificación local
   */
  async showNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker no está registrado')
    }

    if (!this.hasPermission()) {
      throw new Error('No hay permiso para mostrar notificaciones')
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-192x192.png',
      image: payload.image,
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction || false,
      actions: payload.actions,
      vibrate: [200, 100, 200],
    }

    await this.registration.showNotification(payload.title, options)
  }

  /**
   * Manejar click en notificación
   */
  private handleNotificationClick(payload: any): void {
    // Abrir ventana o enfocar la app
    if (payload.url) {
      window.open(payload.url, '_blank')
    } else {
      window.focus()
    }
  }

  /**
   * Suscribirse a push notifications
   */
  async subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service Worker no está registrado')
    }

    if (!('PushManager' in window)) {
      throw new Error('Push notifications no están soportadas')
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      })

      return subscription
    } catch (error) {
      console.error('Error al suscribirse a push:', error)
      return null
    }
  }

  /**
   * Desuscribirse de push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        return true
      }
      return false
    } catch (error) {
      console.error('Error al desuscribirse de push:', error)
      return false
    }
  }

  /**
   * Obtener suscripción actual
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null
    }

    try {
      return await this.registration.pushManager.getSubscription()
    } catch (error) {
      console.error('Error al obtener suscripción:', error)
      return null
    }
  }

  /**
   * Convertir VAPID key de base64 a Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

// Instancia singleton
export const pushNotificationManager = new PushNotificationManager()

