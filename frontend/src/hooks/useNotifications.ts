import { useCallback, useEffect, useRef, useState } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'FORM_ASSIGNED' | 'FORM_COMPLETED' | 'DEADLINE' | 'SYSTEM'
  read: boolean
  link: string | null
  createdAt: string
}

export interface NotificationFilters {
  page?: number
  limit?: number
  read?: 'true' | 'false' | 'all'
  type?: Notification['type']
}

export interface NotificationPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Hook para gestionar notificaciones del usuario
 * Incluye polling automático cada 30 segundos para actualizar notificaciones
 */
export const useNotifications = () => {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<NotificationPagination | null>(null)
  const pollingIntervalRef = useRef<number | null>(null)

  /**
   * Obtiene las notificaciones del usuario autenticado
   * @param filters - Filtros opcionales para la consulta (página, límite, estado de lectura, tipo)
   */
  const fetchNotifications = useCallback(
    async (filters?: NotificationFilters) => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (filters?.page) params.set('page', String(filters.page))
        if (filters?.limit) params.set('limit', String(filters.limit))
        if (filters?.read) params.set('read', filters.read)
        if (filters?.type) params.set('type', filters.type)

        const response = await api.get<{
          success: boolean
          data: Notification[]
          pagination: NotificationPagination
        }>('/notifications', {
          params: params.size > 0 ? Object.fromEntries(params.entries()) : undefined,
        })

        if (response.data.success) {
          setNotifications(response.data.data)
          setPagination(response.data.pagination)
        }
      } catch (err) {
        console.error('useNotifications fetchNotifications error', err)
        setError('No fue posible cargar las notificaciones.')
        setNotifications([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; count: number }>(
        '/notifications/unread-count',
      )

      if (response.data.success) {
        setUnreadCount(response.data.count)
      }
    } catch (err) {
      console.error('useNotifications fetchUnreadCount error', err)
      // No mostrar error en el conteo, solo loguear
    }
  }, [])

  /**
   * Marca una notificación como leída
   * Actualiza el estado local después de la operación
   * @param id - ID de la notificación a marcar como leída
   */
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await api.put(`/notifications/${id}/read`)

        // Actualizar estado local
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
        )

        // Actualizar conteo de no leídas
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('useNotifications markAsRead error', err)
        toast({
          title: 'Error',
          description: 'No se pudo marcar la notificación como leída.',
          variant: 'destructive',
        })
        throw err
      }
    },
    [toast],
  )

  /**
   * Marca todas las notificaciones como leídas
   * Actualiza el estado local después de la operación
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all')

      // Actualizar estado local
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))

      // Actualizar conteo de no leídas
      setUnreadCount(0)

      toast({
        title: 'Notificaciones marcadas',
        description: 'Todas las notificaciones han sido marcadas como leídas.',
      })
    } catch (err) {
      console.error('useNotifications markAllAsRead error', err)
      toast({
        title: 'Error',
        description: 'No se pudieron marcar todas las notificaciones como leídas.',
        variant: 'destructive',
      })
      throw err
    }
  }, [toast])

  /**
   * Elimina una notificación
   * Actualiza el estado local después de la operación
   * @param id - ID de la notificación a eliminar
   */
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/notifications/${id}`)

        // Actualizar estado local
        const deleted = notifications.find((n) => n.id === id)
        setNotifications((prev) => prev.filter((notif) => notif.id !== id))

        // Actualizar conteo si la notificación no estaba leída
        if (deleted && !deleted.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      } catch (err) {
        console.error('useNotifications deleteNotification error', err)
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la notificación.',
          variant: 'destructive',
        })
        throw err
      }
    },
    [notifications, toast],
  )

  /**
   * Inicia el polling automático para actualizar notificaciones cada 30 segundos
   * Carga las notificaciones inmediatamente al iniciar
   */
  const startPolling = useCallback(() => {
    // Limpiar intervalo anterior si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Cargar notificaciones inmediatamente
    void fetchNotifications({ page: 1, limit: 10, read: 'all' })
    void fetchUnreadCount()

    // Configurar polling cada 30 segundos
    pollingIntervalRef.current = window.setInterval(() => {
      void fetchNotifications({ page: 1, limit: 10, read: 'all' })
      void fetchUnreadCount()
    }, 30000)
  }, [fetchNotifications, fetchUnreadCount])

  /**
   * Detiene el polling automático
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Limpiar intervalo al desmontar el componente
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling,
  }
}

