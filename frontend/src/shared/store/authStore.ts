import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Representa al usuario autenticado dentro de la plataforma Collector
export interface User {
  id: string
  email: string
  name: string
  role: string
  firebaseUid: string
}

// Define el estado y las acciones disponibles en el store de autenticación
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  setLoading: (value: boolean) => void
}

// Store global de autenticación con persistencia en localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      setLoading: (value) =>
        set({
          isLoading: value,
        }),
    }),
    {
      name: 'auth-storage',
    },
  ),
)