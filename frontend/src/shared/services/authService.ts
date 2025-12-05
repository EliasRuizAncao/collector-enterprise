import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

import api from '@/shared/lib/api'
import { auth } from '@/shared/lib/firebase'

import { Permission } from '@/shared/types/permissions'

interface BackendAuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    roleId?: string
    firebaseUid: string
  }
  permissions?: Permission[]
  token: string
}

// Servicio centralizado para autenticar con Firebase y sincronizar con el backend
export const authService = {
  // Inicia sesión autenticando contra Firebase y luego contra el backend
  login: async (email: string, password: string) => {
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await credentials.user.getIdToken()
      const { data } = await api.post<BackendAuthResponse>('/auth/login', { idToken })
      
      console.log('[authService] Login response from backend:', {
        hasUser: !!data.user,
        hasToken: !!data.token,
        permissions: data.permissions,
        permissionsCount: data.permissions?.length || 0
      })

      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  // Cierra sesión en backend y Firebase
  logout: async () => {
    try {
      await api.post('/auth/logout')
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  },

  // Registra un usuario nuevo en Firebase y en backend
  register: async (email: string, password: string, name: string) => {
    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password)
      const idToken = await credentials.user.getIdToken()
      const { data } = await api.post<BackendAuthResponse>('/auth/register', {
        idToken,
        name,
      })

      return data
    } catch (error) {
      console.error('Register error:', error)
      throw error
    }
  },

  // Obtiene el usuario actual desde el backend
  getCurrentUser: async () => {
    try {
      const { data } = await api.get<BackendAuthResponse['user'] & { permissions?: Permission[] }>('/auth/me')
      return data
    } catch (error) {
      console.error('Get current user error:', error)
      throw error
    }
  },
  
  // Obtiene los permisos del usuario actual
  refreshPermissions: async () => {
    try {
      const { data } = await api.get<{ permissions: Permission[] }>('/auth/me')
      return data.permissions
    } catch (error) {
      console.error('Refresh permissions error:', error)
      throw error
    }
  },
}


