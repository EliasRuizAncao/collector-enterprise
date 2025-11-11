import { useCallback } from 'react'

import { useToast } from '@/components/ui/use-toast'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

// Hook que centraliza la lógica de autenticación para componentes
export const useAuth = () => {
  const { toast } = useToast()
  const { user, isAuthenticated, isLoading, setAuth, logout: clearAuth, setLoading } =
    useAuthStore()

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true)
        const { user: backendUser, token } = await authService.login(email, password)
        setAuth(backendUser, token)
        toast({ title: 'Sesión iniciada', description: `Bienvenido ${backendUser.name}` })
      } catch (error) {
        console.error('useAuth login error', error)
        toast({
          title: 'Error de inicio de sesión',
          description: 'No fue posible iniciar sesión. Verifica tus credenciales.',
          variant: 'destructive',
        })
        throw error
      } finally {
        setLoading(false)
      }
    },
    [setAuth, setLoading, toast],
  )

  const logout = useCallback(async () => {
    try {
      setLoading(true)
      await authService.logout()
      clearAuth()
      toast({ title: 'Sesión cerrada', description: 'Tu sesión fue finalizada correctamente.' })
    } catch (error) {
      console.error('useAuth logout error', error)
      toast({
        title: 'Error al cerrar sesión',
        description: 'Intenta nuevamente.',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [clearAuth, setLoading, toast])

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setLoading(true)
        const { user: backendUser, token } = await authService.register(email, password, name)
        setAuth(backendUser, token)
        toast({
          title: 'Registro exitoso',
          description: 'Tu cuenta ha sido creada y la sesión se inició automáticamente.',
        })
      } catch (error) {
        console.error('useAuth register error', error)
        toast({
          title: 'Error al registrar',
          description: 'No fue posible crear la cuenta. Revisa los datos ingresados.',
          variant: 'destructive',
        })
        throw error
      } finally {
        setLoading(false)
      }
    },
    [setAuth, setLoading, toast],
  )

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  }
}


