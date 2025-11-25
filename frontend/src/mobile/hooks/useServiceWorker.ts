/**
 * Hook useServiceWorker - Hook React para gestionar Service Worker
 */

import { useState, useEffect, useCallback } from 'react'
import { serviceWorkerManager, type ServiceWorkerState, type ServiceWorkerMessage } from '../utils/serviceWorkerManager'

export interface UseServiceWorkerReturn {
  /** Estado del Service Worker */
  state: ServiceWorkerState
  /** Si está online */
  isOnline: boolean
  /** Si hay actualización disponible */
  needsUpdate: boolean
  /** Si se está instalando */
  isInstalling: boolean
  /** Función para actualizar la app */
  updateApp: () => Promise<void>
  /** Función para verificar actualizaciones */
  checkForUpdates: () => Promise<boolean>
  /** Función para registrar background sync */
  registerBackgroundSync: (tag: string, data?: any) => Promise<boolean>
  /** Función para enviar mensaje al SW */
  postMessage: (message: ServiceWorkerMessage) => Promise<void>
}

/**
 * Hook para usar Service Worker en componentes React
 */
export const useServiceWorker = (): UseServiceWorkerReturn => {
  const [state, setState] = useState<ServiceWorkerState>(serviceWorkerManager.getState())

  // Suscribirse a cambios de estado
  useEffect(() => {
    const unsubscribe = serviceWorkerManager.onStateChange((newState) => {
      setState(newState)
    })

    return unsubscribe
  }, [])

  // Actualizar app
  const updateApp = useCallback(async () => {
    await serviceWorkerManager.updateApp()
  }, [])

  // Verificar actualizaciones
  const checkForUpdates = useCallback(async () => {
    return await serviceWorkerManager.checkForUpdates()
  }, [])

  // Registrar background sync
  const registerBackgroundSync = useCallback(async (tag: string, data?: any) => {
    return await serviceWorkerManager.registerBackgroundSync(tag, data)
  }, [])

  // Enviar mensaje
  const postMessage = useCallback(async (message: ServiceWorkerMessage) => {
    await serviceWorkerManager.postMessage(message)
  }, [])

  return {
    state,
    isOnline: state.isOnline,
    needsUpdate: state.needsUpdate,
    isInstalling: state.isInstalling,
    updateApp,
    checkForUpdates,
    registerBackgroundSync,
    postMessage,
  }
}

