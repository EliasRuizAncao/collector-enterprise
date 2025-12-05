import { useCallback, useState, useEffect } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'
import { Permission } from '@/shared/types/permissions'

export interface Role {
  id: string
  name: string
  displayName: string
  description?: string
  isSystem: boolean
  permissions: Permission[]
  _count?: {
    users: number
  }
}

/**
 * Hook para gestión de roles y permisos
 */
export const useRoles = () => {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get<Role[]>('/roles')
      setRoles(data)
    } catch (err: any) {
      console.error('useRoles fetchRoles error', err)
      setError('No se pudieron cargar los roles')
      toast({
        title: 'Error al cargar roles',
        description: 'Intenta nuevamente en unos minutos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Cargar permisos disponibles
  const fetchPermissions = useCallback(async () => {
    try {
      const { data } = await api.get<Permission[]>('/permissions')
      setPermissions(data)
    } catch (err: any) {
      console.error('useRoles fetchPermissions error', err)
    }
  }, [])

  // Crear rol
  const createRole = useCallback(
    async (roleData: {
      name: string
      displayName: string
      description?: string
      permissions: Permission[]
    }) => {
      try {
        setLoading(true)
        setError(null)
        const { data } = await api.post<Role>('/roles', roleData)
        setRoles((prev) => [...prev, data])
        toast({
          title: 'Rol creado',
          description: `El rol "${data.displayName}" fue creado exitosamente.`,
        })
        return data
      } catch (err: any) {
        console.error('useRoles createRole error', err)
        const errorMessage = err.response?.data?.error || 'No se pudo crear el rol'
        setError(errorMessage)
        toast({
          title: 'Error al crear rol',
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

  // Actualizar rol
  const updateRole = useCallback(
    async (
      roleId: string,
      roleData: {
        displayName?: string
        description?: string
        permissions?: Permission[]
      },
    ) => {
      try {
        setLoading(true)
        setError(null)
        const { data } = await api.put<Role>(`/roles/${roleId}`, roleData)
        setRoles((prev) => prev.map((r) => (r.id === roleId ? data : r)))
        toast({
          title: 'Rol actualizado',
          description: `El rol "${data.displayName}" fue actualizado exitosamente.`,
        })
        return data
      } catch (err: any) {
        console.error('useRoles updateRole error', err)
        const errorMessage = err.response?.data?.error || 'No se pudo actualizar el rol'
        setError(errorMessage)
        toast({
          title: 'Error al actualizar rol',
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

  // Eliminar rol
  const deleteRole = useCallback(
    async (roleId: string) => {
      try {
        setLoading(true)
        setError(null)
        await api.delete(`/roles/${roleId}`)
        setRoles((prev) => prev.filter((r) => r.id !== roleId))
        toast({
          title: 'Rol eliminado',
          description: 'El rol fue eliminado exitosamente.',
        })
      } catch (err: any) {
        console.error('useRoles deleteRole error', err)
        const errorMessage = err.response?.data?.error || 'No se pudo eliminar el rol'
        setError(errorMessage)
        toast({
          title: 'Error al eliminar rol',
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

  // Cargar datos al montar
  useEffect(() => {
    void fetchRoles()
    void fetchPermissions()
  }, [fetchRoles, fetchPermissions])

  return {
    roles,
    permissions,
    loading,
    error,
    fetchRoles,
    fetchPermissions,
    createRole,
    updateRole,
    deleteRole,
  }
}

