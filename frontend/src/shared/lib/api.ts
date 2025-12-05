import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { auth } from '@/shared/lib/firebase'
import { useAuthStore } from '@/shared/store/authStore'

// Detectar si estamos accediendo desde una IP local (no localhost)
// Si es así, usar esa IP para el backend también
const getBaseURL = () => {
  // Si hay una variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Si estamos en el navegador
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const port = window.location.port || '5173'
    
    // Si no es localhost y es una IP de red local, usar esa IP para el backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Es una IP local, usar el mismo hostname con puerto 3000 para el backend
      return `http://${hostname}:3000/api`
    }
  }

  // Por defecto, usar el proxy de Vite
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // Aumentado a 30 segundos para operaciones que pueden tardar más
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag para evitar loops infinitos de renovación
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (error?: unknown) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

// Interceptor para añadir token y renovarlo si es necesario
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = useAuthStore.getState().token

    // Si hay un usuario autenticado en Firebase, obtener el token actualizado
    if (auth.currentUser) {
      try {
        // Obtener el token actualizado (Firebase lo renueva automáticamente si es necesario)
        token = await auth.currentUser.getIdToken()
        // Actualizar el token en el store preservando los permisos existentes
        const currentState = useAuthStore.getState()
        if (currentState.user && token) {
          // Preservar los permisos existentes al actualizar el token
          useAuthStore.getState().setAuth(currentState.user, token, currentState.permissions || undefined)
        }
      } catch (error) {
        console.error('Error al obtener token de Firebase:', error)
        // Si falla, usar el token del store
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Interceptor para manejar errores y renovar token si expira
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Si el error es 401 y no hemos intentado renovar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya estamos renovando, esperar en la cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Intentar obtener un nuevo token de Firebase
        if (auth.currentUser) {
          const newToken = await auth.currentUser.getIdToken(true) // Force refresh
          const currentState = useAuthStore.getState()

          if (currentState.user && newToken) {
            // Preservar los permisos existentes al renovar el token
            useAuthStore.getState().setAuth(currentState.user, newToken, currentState.permissions || undefined)
            processQueue(null, newToken)

            // Reintentar la petición original con el nuevo token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
            }
            return api(originalRequest)
          }
        }

        // Si no hay usuario en Firebase, hacer logout
        throw new Error('No hay usuario autenticado')
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api