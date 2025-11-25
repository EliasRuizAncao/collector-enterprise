/**
 * Sistema de Notificaciones Push para Mobile
 * Implementa push notifications usando Firebase Cloud Messaging (FCM)
 * y Web Push API para iOS y Android
 */

import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging'
import app from '@/shared/lib/firebase'
import api from '@/shared/lib/api'
import { isIOS, isAndroid } from './deviceDetector'

/**
 * Tipos de notificaciones disponibles
 */
export type NotificationType = 'new_assignment' | 'reminder' | 'overdue' | 'update'

/**
 * Configuración de notificaciones del usuario
 */
export interface NotificationSettings {
  /** Si las push notifications están habilitadas */
  enabled: boolean
  /** Tipos de notificaciones habilitadas */
  types: NotificationType[]
  /** Horario de Do Not Disturb (inicio) - formato HH:mm */
  dndStart?: string
  /** Horario de Do Not Disturb (fin) - formato HH:mm */
  dndEnd?: string
}

/**
 * Datos de una notificación recibida
 */
export interface NotificationData {
  type: NotificationType
  assignmentId?: string
  formId?: string
  formName?: string
  message?: string
  taskCount?: number
  url?: string
}

/**
 * Estado de permisos de notificaciones
 */
export type NotificationPermission = 'default' | 'granted' | 'denied'

/**
 * VAPID Key pública (debe estar en variables de entorno o venir del backend)
 */
const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  PERMISSION: 'push_notification_permission',
  TOKEN: 'push_notification_token',
  SETTINGS: 'push_notification_settings',
  BADGE_COUNT: 'push_notification_badge_count',
} as const

/**
 * Configuración por defecto de notificaciones
 */
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  types: ['new_assignment', 'reminder', 'overdue', 'update'],
  dndStart: '22:00',
  dndEnd: '08:00',
}

/**
 * Verifica si el navegador soporta notificaciones push
 * @returns true si el navegador soporta notificaciones
 */
export const isNotificationSupported = (): boolean => {
  if (typeof window === 'undefined') return false

  // Verificar soporte de Service Worker
  if (!('serviceWorker' in navigator)) {
    return false
  }

  // Verificar soporte de Push Manager
  if (!('PushManager' in window)) {
    return false
  }

  // Verificar soporte de Notification API
  if (!('Notification' in window)) {
    return false
  }

  return true
}

/**
 * Obtiene el estado actual del permiso de notificaciones
 * @returns Estado del permiso
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  // Intentar recuperar permiso guardado en localStorage
  const stored = localStorage.getItem(STORAGE_KEYS.PERMISSION)
  if (stored) {
    return stored as NotificationPermission
  }

  return Notification.permission as NotificationPermission
}

/**
 * Solicita permiso al usuario para mostrar notificaciones
 * @returns Promise con el resultado del permiso
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    throw new Error('Las notificaciones push no están soportadas en este navegador')
  }

  try {
    // Verificar si ya se concedió el permiso
    const currentPermission = Notification.permission
    if (currentPermission === 'granted') {
      localStorage.setItem(STORAGE_KEYS.PERMISSION, 'granted')
      return 'granted'
    }

    // Si fue denegado previamente, no mostrar prompt
    if (currentPermission === 'denied') {
      localStorage.setItem(STORAGE_KEYS.PERMISSION, 'denied')
      throw new Error(
        'El permiso de notificaciones fue denegado. Por favor, habilítalo manualmente en la configuración del navegador.',
      )
    }

    // Solicitar permiso al usuario
    const permission = await Notification.requestPermission()

    // Guardar resultado en localStorage
    localStorage.setItem(STORAGE_KEYS.PERMISSION, permission)
    return permission as NotificationPermission
  } catch (error) {
    console.error('Error al solicitar permiso de notificaciones:', error)
    throw error
  }
}

/**
 * Obtiene el service worker registration para notificaciones
 * @returns Promise con el registration del service worker
 */
const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Service Worker no está soportado')
  }

  try {
    // Intentar obtener registration existente
    let registration = await navigator.serviceWorker.getRegistration()

    // Si no existe, intentar registrarlo (VitePWA debería manejarlo automáticamente)
    if (!registration) {
      // En desarrollo, VitePWA usa dev-sw.js, en producción usa sw.js
      const swPath = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js'
      
      try {
        registration = await navigator.serviceWorker.register(swPath, {
          scope: '/',
        })
        // Esperar a que el service worker esté activo
        await navigator.serviceWorker.ready
      } catch (error) {
        // Si falla, intentar con sw.js como fallback
        if (swPath !== '/sw.js') {
          try {
            registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
            })
            await navigator.serviceWorker.ready
          } catch (fallbackError) {
            console.warn('No se pudo registrar Service Worker para notificaciones. VitePWA debería manejarlo.')
            throw new Error('No se pudo registrar el service worker para notificaciones')
          }
        } else {
          throw new Error('No se pudo registrar el service worker para notificaciones')
        }
      }
    }

    return registration
  } catch (error) {
    console.error('Error al obtener service worker registration:', error)
    throw new Error('No se pudo registrar el service worker para notificaciones')
  }
}

/**
 * Obtiene el token de FCM (Firebase Cloud Messaging)
 * @returns Promise con el token FCM o null si no se puede obtener
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Verificar permisos
    const permission = await getNotificationPermission()
    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones no concedido')
      return null
    }

    // Obtener registration del service worker
    const registration = await getServiceWorkerRegistration()

    // Obtener instancia de Firebase Messaging
    const messaging = getMessaging(app)

    // Obtener token de FCM
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (!token) {
      console.warn('No se pudo obtener el token FCM')
      return null
    }

    // Guardar token en localStorage
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)

    return token
  } catch (error) {
    console.error('Error al obtener token FCM:', error)
    return null
  }
}

/**
 * Envía el token FCM al backend para asociarlo con el usuario
 * @param token Token FCM a enviar
 */
export const sendTokenToBackend = async (token: string): Promise<void> => {
  try {
    await api.post('/push/subscribe', {
      token,
      platform: isIOS() ? 'ios' : isAndroid() ? 'android' : 'web',
      userAgent: navigator.userAgent,
    })
  } catch (error: any) {
    // Solo loggear errores que no sean 404 (endpoint no implementado aún)
    if (error?.response?.status !== 404) {
      console.error('Error al enviar token al backend:', error)
    }
    // No lanzar el error si es 404, es esperado en desarrollo
    if (error?.response?.status !== 404) {
      throw error
    }
  }
}

/**
 * Suscribe al usuario a notificaciones push
 * @returns Promise que se resuelve cuando la suscripción es exitosa
 */
export const subscribeToNotifications = async (): Promise<void> => {
  try {
    // Verificar soporte
    if (!isNotificationSupported()) {
      throw new Error('Las notificaciones push no están soportadas')
    }

    // Solicitar permiso si no está concedido
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      throw new Error('Permiso de notificaciones denegado')
    }

    // Obtener token FCM
    const token = await getFCMToken()
    if (!token) {
      throw new Error('No se pudo obtener el token de notificaciones')
    }

    // Enviar token al backend
    await sendTokenToBackend(token)

    // Configurar listeners para notificaciones
    setupNotificationListeners()
  } catch (error: any) {
    // Solo loggear errores que no sean 404 (endpoint no implementado aún)
    if (error?.response?.status !== 404) {
      console.error('Error al suscribirse a notificaciones:', error)
    }
    // No lanzar el error si es 404, es esperado en desarrollo
    if (error?.response?.status !== 404) {
      throw error
    }
  }
}

/**
 * Desuscribe al usuario de notificaciones push
 */
export const unsubscribeFromNotifications = async (): Promise<void> => {
  try {
    // Obtener token guardado
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)

    if (token) {
      // Notificar al backend
      await api.post('/push/unsubscribe', { token })

      // Limpiar token local
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
    }

    // Limpiar badge
    await clearBadge()
  } catch (error) {
    console.error('Error al desuscribirse de notificaciones:', error)
    throw error
  }
}

/**
 * Callback para mostrar notificaciones en foreground
 * Se puede configurar desde el componente React
 */
let foregroundNotificationCallback: ((payload: MessagePayload) => void) | null = null

/**
 * Configura el callback para mostrar notificaciones en foreground
 * @param callback Función que se ejecutará cuando llegue una notificación en foreground
 */
export const setForegroundNotificationCallback = (
  callback: (payload: MessagePayload) => void,
): void => {
  foregroundNotificationCallback = callback
}

/**
 * Configura los listeners para notificaciones en foreground y background
 */
export const setupNotificationListeners = (): void => {
  try {
    const messaging = getMessaging(app)

    // Listener para notificaciones cuando la app está en foreground
    onMessage(messaging, (payload: MessagePayload) => {
      console.log('Notificación recibida en foreground:', payload)

      // Ejecutar callback si está configurado (mostrar toast desde componente React)
      if (foregroundNotificationCallback) {
        foregroundNotificationCallback(payload)
      } else {
        // Fallback: mostrar notificación nativa si no hay callback
        showForegroundNotification(payload)
      }

      // Actualizar badge
      const data = payload.data as unknown as NotificationData
      if (data?.type === 'new_assignment' || data?.type === 'reminder') {
        incrementBadge()
      }

      // Reproducir sonido sutil (opcional)
      playNotificationSound()
    })

    // Listener para clics en notificaciones (manejado en service worker)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          handleNotificationClick(event.data.notification)
        }
      })
    }
  } catch (error) {
    console.error('Error al configurar listeners de notificaciones:', error)
  }
}

/**
 * Muestra una notificación cuando la app está en foreground
 * Fallback si no hay callback configurado (usa Notification API nativa)
 * @param payload Payload de la notificación FCM
 */
const showForegroundNotification = async (payload: MessagePayload): Promise<void> => {
  const notification = payload.notification
  const data = payload.data as unknown as NotificationData

  if (!notification) return

  try {
    // Mostrar notificación nativa como fallback
    const permission = getNotificationPermission()
    if (permission === 'granted') {
      const registration = await getServiceWorkerRegistration()
      await registration.showNotification(notification.title || 'Nueva notificación', {
        body: notification.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: {
          ...data,
          url: data?.url || (data?.assignmentId ? `/mobile/form/${data.assignmentId}` : undefined),
        },
        tag: `notification-${data?.type || 'default'}`,
        requireInteraction: false,
      })
    }
  } catch (error) {
    console.error('Error al mostrar notificación en foreground:', error)
  }
}

/**
 * Maneja el click en una notificación
 * @param notificationData Datos de la notificación clickeada
 */
export const handleNotificationClick = (notificationData: NotificationData): void => {
  // Navegar a la página relevante según el tipo de notificación
  if (notificationData.type === 'new_assignment' && notificationData.assignmentId) {
    window.location.href = `/mobile/form/${notificationData.assignmentId}`
    return
  }

  if (notificationData.type === 'reminder') {
    window.location.href = '/mobile/assignments'
    return
  }

  if (notificationData.type === 'overdue' && notificationData.assignmentId) {
    window.location.href = `/mobile/form/${notificationData.assignmentId}`
    return
  }

  if (notificationData.type === 'update' && notificationData.url) {
    window.location.href = notificationData.url
    return
  }

  // Por defecto, ir a assignments
  window.location.href = '/mobile/assignments'
}

/**
 * Incrementa el contador del badge
 */
export const incrementBadge = (): void => {
  const currentCount = getBadgeCount()
  const newCount = currentCount + 1
  setBadgeCount(newCount)
  updateBadge(newCount)
}

/**
 * Decrementa el contador del badge
 */
export const decrementBadge = (): void => {
  const currentCount = getBadgeCount()
  if (currentCount > 0) {
    const newCount = currentCount - 1
    setBadgeCount(newCount)
    updateBadge(newCount)
  }
}

/**
 * Limpia el badge (lo pone en 0)
 */
export const clearBadge = async (): Promise<void> => {
  setBadgeCount(0)
  await updateBadge(0)
}

/**
 * Obtiene el conteo actual del badge
 * @returns Número de notificaciones no leídas
 */
export const getBadgeCount = (): number => {
  if (typeof window === 'undefined') return 0

  const count = localStorage.getItem(STORAGE_KEYS.BADGE_COUNT)
  return count ? parseInt(count, 10) : 0
}

/**
 * Establece el conteo del badge
 * @param count Nuevo conteo del badge
 */
const setBadgeCount = (count: number): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.BADGE_COUNT, count.toString())
}

/**
 * Actualiza el badge en el icono de la app
 * @param count Conteo a mostrar en el badge
 */
const updateBadge = async (count: number): Promise<void> => {
  try {
    // Badge API (estándar web)
    if ('setAppBadge' in navigator && typeof navigator.setAppBadge === 'function') {
      if (count > 0) {
        await navigator.setAppBadge(count)
      } else {
        await navigator.clearAppBadge()
      }
      return
    }

    // Fallback: actualizar badge mediante service worker
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      registration.update()
    }
  } catch (error) {
    console.error('Error al actualizar badge:', error)
  }
}

/**
 * Sincroniza el badge con el número de tareas pendientes
 * @param pendingCount Número de tareas pendientes
 */
export const syncBadgeWithPendingTasks = async (pendingCount: number): Promise<void> => {
  setBadgeCount(pendingCount)
  await updateBadge(pendingCount)
}

/**
 * Reproduce un sonido sutil para notificaciones
 */
const playNotificationSound = (): void => {
  try {
    // Crear audio element para sonido de notificación
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.3 // Volumen bajo
    audio.play().catch((error) => {
      // Silenciar error si no se puede reproducir (archivo no existe o permiso denegado)
      console.debug('No se pudo reproducir sonido de notificación:', error)
    })
  } catch (error) {
    // Silenciar error si Audio API no está disponible
    console.debug('Audio API no disponible:', error)
  }
}

/**
 * Obtiene la configuración de notificaciones del usuario
 * @returns Configuración de notificaciones
 */
export const getNotificationSettings = (): NotificationSettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS
  }

  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    } catch (error) {
      console.error('Error al parsear configuración de notificaciones:', error)
      return DEFAULT_SETTINGS
    }
  }

  return DEFAULT_SETTINGS
}

/**
 * Guarda la configuración de notificaciones del usuario
 * @param settings Configuración a guardar
 */
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  if (typeof window === 'undefined') return

  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))

  // Si se deshabilitan las notificaciones, desuscribirse
  if (!settings.enabled) {
    await unsubscribeFromNotifications()
  } else {
    // Si se habilitan, suscribirse
    const permission = getNotificationPermission()
    if (permission === 'granted') {
      await subscribeToNotifications()
    }
  }
}

/**
 * Verifica si las notificaciones están habilitadas según la configuración de DND
 * @returns true si las notificaciones están permitidas en este momento
 */
export const isNotificationAllowed = (): boolean => {
  const settings = getNotificationSettings()

  if (!settings.enabled) {
    return false
  }

  // Verificar Do Not Disturb
  if (settings.dndStart && settings.dndEnd) {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const startTime = settings.dndStart
    const endTime = settings.dndEnd

    // Si el horario de DND cruza medianoche
    if (startTime > endTime) {
      // DND es desde startTime hasta medianoche, y desde medianoche hasta endTime
      if (currentTime >= startTime || currentTime < endTime) {
        return false
      }
    } else {
      // DND es en el mismo día
      if (currentTime >= startTime && currentTime < endTime) {
        return false
      }
    }
  }

  return true
}

/**
 * Crea una notificación local programada (si está soportado)
 * @param title Título de la notificación
 * @param body Cuerpo de la notificación
 * @param scheduledTime Hora programada para mostrar la notificación
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  scheduledTime: Date,
): Promise<void> => {
  // Verificar si el navegador soporta Notification API y scheduling
  if (!('Notification' in window) || !('showNotification' in ServiceWorkerRegistration.prototype)) {
    console.warn('Las notificaciones programadas no están soportadas')
    return
  }

  try {
    const registration = await getServiceWorkerRegistration()
    const delay = scheduledTime.getTime() - Date.now()

    if (delay <= 0) {
      console.warn('La hora programada ya pasó')
      return
    }

    // Usar setTimeout para programar la notificación
    // Nota: Esto solo funciona mientras la app está abierta
    // Para notificaciones verdaderamente programadas, se necesita usar el backend
    setTimeout(() => {
      registration.showNotification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'scheduled-notification',
        requireInteraction: false,
      })
    }, delay)
  } catch (error) {
    console.error('Error al programar notificación local:', error)
  }
}

/**
 * Inicializa el sistema de notificaciones push
 * Se debe llamar cuando la app se carga
 */
export const initializePushNotifications = async (): Promise<void> => {
  try {
    // Verificar soporte
    if (!isNotificationSupported()) {
      console.warn('Las notificaciones push no están soportadas en este navegador')
      return
    }

    // Verificar si ya hay un token guardado
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const permission = getNotificationPermission()

    // Si hay permiso pero no token, obtenerlo
    if (permission === 'granted' && !storedToken) {
      const token = await getFCMToken()
      if (token) {
        await sendTokenToBackend(token)
        setupNotificationListeners()
      }
    }

    // Si ya hay token, configurar listeners
    if (storedToken) {
      setupNotificationListeners()
    }

    // Sincronizar badge al iniciar (limpiar si se abre la app)
    await clearBadge()
  } catch (error) {
    console.error('Error al inicializar notificaciones push:', error)
  }
}

