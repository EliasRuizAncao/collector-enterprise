import { useCallback, useState } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'

export interface AuditLog {
  id: string
  userId: string
  action: string
  module: string
  details: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface AuditLogFilters {
  page?: number
  limit?: number
  userId?: string
  module?: string
  action?: string
  startDate?: string
  endDate?: string
}

export interface AuditLogPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Hook para gestionar logs de auditoría
 */
export const useAuditLogs = () => {
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<AuditLogPagination | null>(null)
  const [modules, setModules] = useState<string[]>([])
  const [actions, setActions] = useState<string[]>([])

  /**
   * Obtiene los logs de auditoría con filtros
   */
  const fetchAuditLogs = useCallback(
    async (filters?: AuditLogFilters) => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (filters?.page) params.set('page', String(filters.page))
        if (filters?.limit) params.set('limit', String(filters.limit))
        if (filters?.userId) params.set('userId', filters.userId)
        if (filters?.module) params.set('module', filters.module)
        if (filters?.action) params.set('action', filters.action)
        if (filters?.startDate) params.set('startDate', filters.startDate)
        if (filters?.endDate) params.set('endDate', filters.endDate)

        const response = await api.get<{
          success: boolean
          data: AuditLog[]
          pagination: AuditLogPagination
        }>('/audit-logs', {
          params: params.size > 0 ? Object.fromEntries(params.entries()) : undefined,
        })

        if (response.data.success) {
          setLogs(response.data.data)
          setPagination(response.data.pagination)
        }
      } catch (err: any) {
        console.error('useAuditLogs fetchAuditLogs error', err)
        setError('No fue posible cargar los logs de auditoría.')
        setLogs([])
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los logs de auditoría.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  /**
   * Obtiene la lista de módulos únicos
   */
  const fetchModules = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; data: string[] }>('/audit-logs/modules')

      if (response.data.success) {
        setModules(response.data.data)
      }
    } catch (err) {
      console.error('useAuditLogs fetchModules error', err)
    }
  }, [])

  /**
   * Obtiene la lista de acciones únicas (opcionalmente filtradas por módulo)
   */
  const fetchActions = useCallback(
    async (module?: string) => {
      try {
        const params = module ? { module } : undefined
        const response = await api.get<{ success: boolean; data: string[] }>(
          '/audit-logs/actions',
          { params },
        )

        if (response.data.success) {
          setActions(response.data.data)
        }
      } catch (err) {
        console.error('useAuditLogs fetchActions error', err)
      }
    },
    [],
  )

  /**
   * Exporta los logs a CSV
   */
  const exportToCSV = useCallback(
    async (filters?: AuditLogFilters): Promise<boolean> => {
      try {
        const params = new URLSearchParams()
        if (filters?.userId) params.set('userId', filters.userId)
        if (filters?.module) params.set('module', filters.module)
        if (filters?.action) params.set('action', filters.action)
        if (filters?.startDate) params.set('startDate', filters.startDate)
        if (filters?.endDate) params.set('endDate', filters.endDate)
        // Para exportar, obtener todos los resultados (sin paginación)
        params.set('limit', '10000')

        const response = await api.get<{
          success: boolean
          data: AuditLog[]
          pagination: AuditLogPagination
        }>('/audit-logs', {
          params: Object.fromEntries(params.entries()),
        })

        if (!response.data.success || !response.data.data.length) {
          toast({
            title: 'Sin datos',
            description: 'No hay logs para exportar con los filtros seleccionados.',
            variant: 'destructive',
          })
          return false
        }

        // Convertir a CSV
        const headers = ['Fecha/Hora', 'Usuario', 'Email', 'Rol', 'Módulo', 'Acción', 'IP', 'Detalles']
        const rows = response.data.data.map((log) => [
          new Date(log.createdAt).toLocaleString('es-CL'),
          log.user.name,
          log.user.email,
          log.user.role,
          log.module,
          log.action,
          log.ipAddress || '',
          JSON.stringify(log.details || {}),
        ])

        const csvContent = [
          headers.join(','),
          ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n')

        // Crear blob y descargar
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: 'Exportación exitosa',
          description: `Se exportaron ${response.data.data.length} logs de auditoría.`,
        })

        return true
      } catch (err: any) {
        console.error('useAuditLogs exportToCSV error', err)
        toast({
          title: 'Error al exportar',
          description: 'No se pudo exportar los logs de auditoría.',
          variant: 'destructive',
        })
        return false
      }
    },
    [toast],
  )

  return {
    logs,
    modules,
    actions,
    loading,
    error,
    pagination,
    fetchAuditLogs,
    fetchModules,
    fetchActions,
    exportToCSV,
  }
}

