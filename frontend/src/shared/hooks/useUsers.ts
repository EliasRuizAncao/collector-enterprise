import { useCallback, useEffect, useRef, useState } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'
import type { UserDialogFormValues, UserRole, UserStatus } from '@/admin/components/users/UserDialog'

export interface UserSummary {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastActivity?: string
}

export interface UserFilters {
  search?: string
  role?: UserRole
  status?: UserStatus
  page?: number
  pageSize?: number
}

// Hook que centraliza la gestión de usuarios para el panel administrativo
export const useUsers = () => {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFiltersRef = useRef<UserFilters | undefined>(undefined)

  const fetchUsers = useCallback(
    async (filters?: UserFilters) => {
      try {
        setLoading(true)
        setError(null)
        const resolvedFilters = filters ?? lastFiltersRef.current ?? undefined
        lastFiltersRef.current = resolvedFilters

        const effectiveFilters = resolvedFilters
        const params = new URLSearchParams()

        if (effectiveFilters?.search) params.set('search', effectiveFilters.search)
        if (effectiveFilters?.role) params.set('role', effectiveFilters.role)
        if (effectiveFilters?.status) params.set('status', effectiveFilters.status)
        if (effectiveFilters?.page) params.set('page', String(effectiveFilters.page))
        if (effectiveFilters?.pageSize) params.set('limit', String(effectiveFilters.pageSize))

        const response = await api.get<{ data: UserSummary[]; pagination: { total: number; page: number; limit: number } }>(`/users`, {
          params: params.size > 0 ? Object.fromEntries(params.entries()) : undefined,
        })

        const usersData = Array.isArray(response.data.data) ? response.data.data : []
        setUsers(usersData)
      } catch (err) {
        console.error('useUsers fetchUsers error', err)
        setError('No fue posible cargar la lista de usuarios.')
        setUsers([]) // Asegurar que siempre sea un array
        toast({
          title: 'No pudimos cargar los usuarios',
          description: 'Intenta nuevamente en unos minutos.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const createUser = useCallback(
    async (payload: UserDialogFormValues) => {
      try {
        setLoading(true)
        setError(null)
        // El payload ya viene con roleId desde UserDialog (convertido de role a roleId)
        const { data } = await api.post<UserSummary>(`/users`, payload)
        setUsers((prev) => [data, ...prev])
        toast({
          title: 'Usuario creado',
          description: `Se creó el usuario ${data.name} correctamente.`,
        })
      } catch (err) {
        console.error('useUsers createUser error', err)
        toast({
          title: 'Error al crear usuario',
          description: 'Verifica los datos ingresados e intenta nuevamente.',
          variant: 'destructive',
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const updateUser = useCallback(
    async (id: string, payload: Partial<UserDialogFormValues>) => {
      try {
        setLoading(true)
        setError(null)
        const { data } = await api.put<UserSummary>(`/users/${id}`, payload)
        setUsers((prev) => prev.map((user) => (user.id === id ? data : user)))
        toast({
          title: 'Usuario actualizado',
          description: `Se actualizaron los datos de ${data.name}.`,
        })
      } catch (err) {
        console.error('useUsers updateUser error', err)
        toast({
          title: 'Error al actualizar',
          description: 'No fue posible actualizar el usuario. Intenta nuevamente.',
          variant: 'destructive',
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const deleteUser = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        setError(null)
        await api.delete(`/users/${id}`)
        setUsers((prev) => prev.filter((user) => user.id !== id))
        toast({
          title: 'Usuario eliminado',
          description: 'El colaborador fue eliminado del sistema.',
        })
      } catch (err) {
        console.error('useUsers deleteUser error', err)
        toast({
          title: 'No pudimos eliminar al usuario',
          description: 'Refresca la página e inténtalo nuevamente.',
          variant: 'destructive',
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const toggleUserStatus = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        setError(null)
        const user = users.find((item) => item.id === id)
        if (!user) {
          throw new Error('Usuario no encontrado')
        }

        const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        const { data } = await api.put<UserSummary>(`/users/${id}`, { status: nextStatus })

        setUsers((prev) => prev.map((item) => (item.id === id ? data : item)))
        toast({
          title: 'Estado actualizado',
          description: `El usuario ahora está ${nextStatus === 'ACTIVE' ? 'activo' : 'inactivo'}.`,
        })
      } catch (err) {
        console.error('useUsers toggleUserStatus error', err)
        toast({
          title: 'No pudimos actualizar el estado',
          description: 'Intenta nuevamente.',
          variant: 'destructive',
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [toast, users],
  )

  return {
    users,
    loading,
    error,
    lastFilters: lastFiltersRef.current,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
  }
}

export default useUsers


