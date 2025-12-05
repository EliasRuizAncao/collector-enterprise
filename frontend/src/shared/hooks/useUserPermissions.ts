import { useCallback, useState } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'
import { Permission } from '@/shared/types/permissions'

/**
 * Hook para gestionar permisos personalizados de un usuario
 */
export const useUserPermissions = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Obtener permisos de un usuario
  const getUserPermissions = useCallback(async (userId: string): Promise<Permission[]> => {
    try {
      setLoading(true)
      const { data } = await api.get<{ permissions: Permission[] }>(`/users/${userId}/permissions`)
      return data.permissions
    } catch (err: any) {
      console.error('useUserPermissions getUserPermissions error', err)
      toast({
        title: 'Error al obtener permisos',
        description: 'No se pudieron cargar los permisos del usuario.',
        variant: 'destructive',
      })
      return []
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Actualizar permisos personalizados de un usuario
  const updateUserPermissions = useCallback(
    async (userId: string, permissions: Permission[]) => {
      try {
        setLoading(true)
        const { data } = await api.put<{ permissions: Permission[] }>(`/users/${userId}/permissions`, {
          permissions,
        })
        toast({
          title: 'Permisos actualizados',
          description: 'Los permisos del usuario fueron actualizados exitosamente.',
        })
        return data.permissions
      } catch (err: any) {
        console.error('useUserPermissions updateUserPermissions error', err)
        const errorMessage = err.response?.data?.error || 'No se pudieron actualizar los permisos'
        toast({
          title: 'Error al actualizar permisos',
          description: errorMessage,
          variant: 'destructive',
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  return {
    loading,
    getUserPermissions,
    updateUserPermissions,
  }
}

