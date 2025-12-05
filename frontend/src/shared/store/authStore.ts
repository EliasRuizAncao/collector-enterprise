import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Permission } from '@/shared/types/permissions'

// Representa al usuario autenticado dentro de la plataforma Collector
export interface User {
  id: string
  email: string
  name: string
  role: string
  roleId?: string
  firebaseUid: string
}

// Define el estado y las acciones disponibles en el store de autenticación
interface AuthState {
  user: User | null
  token: string | null
  permissions: Permission[] | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoadingPermissions: boolean
  setAuth: (user: User, token: string, permissions?: Permission[]) => void
  setPermissions: (permissions: Permission[]) => void
  logout: () => void
  setLoading: (value: boolean) => void
  setLoadingPermissions: (value: boolean) => void
}

// Store global de autenticación con persistencia en localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      permissions: null,
      isAuthenticated: false,
      isLoading: false,
      isLoadingPermissions: false,
      setAuth: (user, token, permissions) => {
        console.log('[authStore] setAuth called', {
          hasUser: !!user,
          hasToken: !!token,
          permissionsCount: permissions?.length || 0,
        })
        set({
          user,
          token,
          permissions: permissions || null,
          isAuthenticated: true,
          isLoading: false,
          isLoadingPermissions: false,
        })
        // Forzar persistencia inmediata de permisos
        if (permissions && permissions.length > 0) {
          console.log('[authStore] Permisos guardados en store:', permissions.length)
        }
      },
      setPermissions: (permissions) => {
        const currentState = get()
        console.log('[authStore] setPermissions called', {
          permissionsCount: permissions?.length || 0,
          currentPermissions: currentState.permissions?.length || 0,
          hasCurrentPermissions: !!(currentState.permissions && currentState.permissions.length > 0),
        })
        
        // Solo actualizar si tenemos permisos válidos
        if (permissions && Array.isArray(permissions) && permissions.length > 0) {
          // Si ya hay permisos y los nuevos son diferentes, actualizar
          // Si no hay permisos, guardar los nuevos
          set({
            permissions,
            isLoadingPermissions: false,
          })
          console.log('[authStore] Permisos actualizados:', permissions.length)
        } else if (!permissions || permissions.length === 0) {
          // NO sobrescribir permisos existentes con un array vacío o null
          // Solo marcar que ya no se están cargando
          if (currentState.permissions && currentState.permissions.length > 0) {
            console.warn('[authStore] setPermissions intentó sobrescribir permisos válidos con array vacío - ignorando')
            set({
              isLoadingPermissions: false,
            })
          } else {
            console.warn('[authStore] setPermissions llamado con permisos inválidos y no hay permisos previos:', permissions)
            set({
              permissions: null,
              isLoadingPermissions: false,
            })
          }
        }
      },
      logout: () =>
        set({
          user: null,
          token: null,
          permissions: null,
          isAuthenticated: false,
          isLoading: false,
          isLoadingPermissions: false,
        }),
      setLoading: (value) =>
        set({
          isLoading: value,
        }),
      setLoadingPermissions: (value) =>
        set({
          isLoadingPermissions: value,
        }),
    }),
    {
      name: 'auth-storage',
      // Asegurar que los permisos se persistan correctamente
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        permissions: state.permissions, // Asegurar que los permisos se persistan
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)