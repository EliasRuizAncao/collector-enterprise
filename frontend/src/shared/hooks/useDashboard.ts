import { useCallback, useEffect, useRef, useState } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'

/**
 * KPIs del dashboard
 */
export interface DashboardKPIs {
  totalActiveForms: {
    value: number
    change: number
  }
  formsCompletedToday: {
    value: number
    change: number
  }
  formsCompletedThisWeek: {
    value: number
    change: number
  }
  activeUsers: {
    value: number
    change: number
  }
  completionRate: {
    value: number
    change: number
  }
}

/**
 * Respuesta de estadísticas del dashboard
 */
interface DashboardStatsResponse {
  kpis: DashboardKPIs
}

/**
 * Serie de datos para gráfico de línea (formularios completados)
 */
export interface FormsCompletedSeries {
  day: string
  date: string
  completados: number
}

/**
 * Respuesta de formularios completados
 */
interface FormsCompletedResponse {
  series: FormsCompletedSeries[]
  startDate: string
  endDate: string
}

/**
 * Datos para gráfico de barras (formularios por tipo)
 */
export interface FormsByTypeData {
  type: string
  cantidad: number
}

/**
 * Respuesta de formularios por tipo
 */
interface FormsByTypeResponse {
  byStatus: FormsByTypeData[]
  topForms: FormsByTypeData[]
}

/**
 * Item de actividad reciente
 */
export interface ActivityItem {
  id: string
  user: string
  action: string
  module: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

/**
 * Respuesta de actividad reciente
 */
interface RecentActivityResponse {
  activities: ActivityItem[]
}

/**
 * Filtros para formularios completados
 */
export interface DashboardFilters {
  startDate?: string
  endDate?: string
  userId?: string
}

/**
 * Hook para gestionar datos del dashboard
 */
export const useDashboard = () => {
  const { toast } = useToast()
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [formsCompletedSeries, setFormsCompletedSeries] = useState<FormsCompletedSeries[]>([])
  const [formsByType, setFormsByType] = useState<FormsByTypeData[]>([])
  const [topForms, setTopForms] = useState<FormsByTypeData[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const filtersRef = useRef<DashboardFilters | undefined>(undefined)

  /**
   * Obtiene las estadísticas generales del dashboard (KPIs)
   */
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get<DashboardStatsResponse>('/dashboard/stats')
      setKpis(response.data.kpis)
    } catch (err: any) {
      // Silenciar errores 404 en desarrollo (backend no implementado completamente)
      if (err?.response?.status === 404 || err?.response?.status === 501) {
        console.warn('Dashboard stats endpoint not implemented yet')
        return
      }

      if (err?.response?.status === 429) {
        console.warn('Rate limit exceeded for dashboard stats.')
      } else {
        console.error('useDashboard fetchStats error', err)
        setError('No fue posible cargar las estadísticas del dashboard.')
        toast({
          title: 'Error al cargar estadísticas',
          description: 'Intenta nuevamente en unos minutos.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Obtiene formularios completados agrupados por fecha
   */
  const fetchFormsCompleted = useCallback(
    async (filters?: DashboardFilters) => {
      try {
        setLoading(true)
        setError(null)

        const effectiveFilters = filters || filtersRef.current
        filtersRef.current = effectiveFilters

        const params = new URLSearchParams()
        if (effectiveFilters?.startDate) params.set('startDate', effectiveFilters.startDate)
        if (effectiveFilters?.endDate) params.set('endDate', effectiveFilters.endDate)
        if (effectiveFilters?.userId) params.set('userId', effectiveFilters.userId)

        const response = await api.get<FormsCompletedResponse>('/dashboard/forms/completed', {
          params: params.size > 0 ? Object.fromEntries(params.entries()) : undefined,
        })

        setFormsCompletedSeries(response.data.series)
      } catch (err: any) {
        // Silenciar errores 404 en desarrollo
        if (err?.response?.status === 404 || err?.response?.status === 501) {
          console.warn('Forms completed endpoint not implemented yet')
          return
        }

        if (err?.response?.status === 429) {
          console.warn('Rate limit exceeded for forms completed.')
        } else {
          console.error('useDashboard fetchFormsCompleted error', err)
          setError('No fue posible cargar los formularios completados.')
          toast({
            title: 'Error al cargar formularios completados',
            description: 'Intenta nuevamente en unos minutos.',
            variant: 'destructive',
          })
        }
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  /**
   * Obtiene formularios agrupados por tipo
   */
  const fetchFormsByType = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get<FormsByTypeResponse>('/dashboard/forms/by-type')
      setFormsByType(response.data.byStatus)
      setTopForms(response.data.topForms)
    } catch (err: any) {
      // Silenciar errores 404 en desarrollo
      if (err?.response?.status === 404 || err?.response?.status === 501) {
        console.warn('Forms by type endpoint not implemented yet')
        return
      }

      if (err?.response?.status === 429) {
        console.warn('Rate limit exceeded for forms by type.')
      } else {
        console.error('useDashboard fetchFormsByType error', err)
        setError('No fue posible cargar los formularios por tipo.')
        toast({
          title: 'Error al cargar formularios por tipo',
          description: 'Intenta nuevamente en unos minutos.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Obtiene actividad reciente del sistema
   */
  const fetchRecentActivity = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get<RecentActivityResponse>('/dashboard/activity')
      setRecentActivity(response.data.activities)
    } catch (err: any) {
      // Silenciar errores 404 en desarrollo
      if (err?.response?.status === 404 || err?.response?.status === 501) {
        console.warn('Recent activity endpoint not implemented yet')
        return
      }

      if (err?.response?.status === 429) {
        console.warn('Rate limit exceeded for recent activity.')
      } else {
        console.error('useDashboard fetchRecentActivity error', err)
        setError('No fue posible cargar la actividad reciente.')
        toast({
          title: 'Error al cargar actividad reciente',
          description: 'Intenta nuevamente en unos minutos.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Obtiene todos los datos del dashboard
   */
  const fetchAll = useCallback(
    async (filters?: DashboardFilters) => {
      await Promise.all([
        fetchStats(),
        fetchFormsCompleted(filters),
        fetchFormsByType(),
        fetchRecentActivity(),
      ])
    },
    [fetchStats, fetchFormsCompleted, fetchFormsByType, fetchRecentActivity],
  )

  /**
   * Inicia refresh automático cada 30 segundos
   */
  const startAutoRefresh = useCallback(
    (intervalMs: number = 30000) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        void fetchAll(filtersRef.current)
      }, intervalMs)
    },
    [fetchAll],
  )

  /**
   * Detiene el refresh automático
   */
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    kpis,
    formsCompletedSeries,
    formsByType,
    topForms,
    recentActivity,
    loading,
    error,
    filters: filtersRef.current,
    fetchStats,
    fetchFormsCompleted,
    fetchFormsByType,
    fetchRecentActivity,
    fetchAll,
    startAutoRefresh,
    stopAutoRefresh,
  }
}

export default useDashboard

