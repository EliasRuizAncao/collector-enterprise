import { useCallback, useState } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'

/**
 * Filtros para reportes
 */
export interface ReportFilters {
  startDate?: string
  endDate?: string
  formId?: string
  userId?: string
  project?: string
  limit?: number
}

/**
 * Datos del reporte de completitud
 */
export interface CompletionReportData {
  userId: string
  userName: string
  userEmail: string
  formId: string
  formTitle: string
  totalResponses: number
  assignedCount: number
  completedCount: number
  completionRate: number
  firstResponse: string
  lastResponse: string
}

/**
 * Respuesta del reporte de completitud
 */
interface CompletionReportResponse {
  data: CompletionReportData[]
  summary: {
    totalResponses: number
    totalUsers: number
    totalForms: number
    averageCompletionRate: number
    period: {
      startDate: string
      endDate: string
    }
  }
}

/**
 * Datos del reporte de rendimiento de usuario
 */
export interface UserPerformanceData {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  totalResponses: number
  uniqueFormsCompleted: number
  daysActive: number
  averageResponsesPerDay: number
  firstResponse: string
  lastResponse: string
  performanceScore: number
}

/**
 * Respuesta del reporte de rendimiento de usuario
 */
interface UserPerformanceResponse {
  data: UserPerformanceData[]
  summary: {
    totalUsers: number
    totalResponses: number
    averageResponsesPerUser: number
    period: {
      startDate: string
      endDate: string
    }
  }
}

/**
 * Datos del reporte de analíticas de formulario
 */
export interface FormAnalyticsData {
  form: {
    id: string
    title: string
    description?: string
    createdAt: string
  }
  summary: {
    totalResponses: number
    uniqueUsers: number
    averageResponsesPerDay: number
    period: {
      startDate: string
      endDate: string
    }
  }
  temporalTrend: Array<{
    date: string
    count: number
  }>
  fieldsAnalysis: Array<{
    fieldId: string
    fieldName: string
    responseCount: number
    emptyCount: number
    valueTypes: Record<string, number>
  }>
  topUsers: Array<{
    userId: string
    userName: string
    userEmail: string
    count: number
  }>
}

/**
 * Hook para gestionar reportes
 */
export const useReports = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Obtiene reporte de completitud
   */
  const getCompletionReport = useCallback(
    async (filters?: ReportFilters): Promise<CompletionReportResponse | null> => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (filters?.startDate) params.set('startDate', filters.startDate)
        if (filters?.endDate) params.set('endDate', filters.endDate)
        if (filters?.userId) params.set('userId', filters.userId)
        if (filters?.formId) params.set('formId', filters.formId)

        const response = await api.get<CompletionReportResponse>('/reports/completion', {
          params: params.size > 0 ? Object.fromEntries(params.entries()) : undefined,
        })

        return response.data
      } catch (err: any) {
        console.error('useReports getCompletionReport error', err)
        setError('No fue posible obtener el reporte de completitud.')
        toast({
          title: 'Error al obtener reporte',
          description: 'Intenta nuevamente en unos minutos.',
          variant: 'destructive',
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  /**
   * Obtiene reporte de rendimiento de usuarios
   */
  const getUserPerformanceReport = useCallback(
    async (filters?: ReportFilters): Promise<UserPerformanceResponse | null> => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (filters?.startDate) params.set('startDate', filters.startDate)
        if (filters?.endDate) params.set('endDate', filters.endDate)
        if (filters?.limit) params.set('limit', String(filters.limit))

        const response = await api.get<UserPerformanceResponse>('/reports/user-performance', {
          params: params.size > 0 ? Object.fromEntries(params.entries()) : undefined,
        })

        return response.data
      } catch (err: any) {
        console.error('useReports getUserPerformanceReport error', err)
        setError('No fue posible obtener el reporte de rendimiento.')
        toast({
          title: 'Error al obtener reporte',
          description: 'Intenta nuevamente en unos minutos.',
          variant: 'destructive',
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  /**
   * Obtiene reporte de analíticas de formulario
   */
  const getFormAnalyticsReport = useCallback(
    async (formId: string, filters?: ReportFilters): Promise<FormAnalyticsData | null> => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (filters?.startDate) params.set('startDate', filters.startDate)
        if (filters?.endDate) params.set('endDate', filters.endDate)

        const response = await api.get<FormAnalyticsData>(`/reports/form-analytics/${formId}`, {
          params: params.size > 0 ? Object.fromEntries(params.entries()) : undefined,
        })

        return response.data
      } catch (err: any) {
        console.error('useReports getFormAnalyticsReport error', err)
        setError('No fue posible obtener el reporte de analíticas.')
        toast({
          title: 'Error al obtener reporte',
          description: 'Intenta nuevamente en unos minutos.',
          variant: 'destructive',
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  /**
   * Exporta reporte a Excel desde el backend
   */
  const exportReportToExcel = useCallback(
    async (type: 'completion' | 'user-performance' | 'form-analytics', filters?: ReportFilters): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        params.set('type', type)
        if (filters?.startDate) params.set('startDate', filters.startDate)
        if (filters?.endDate) params.set('endDate', filters.endDate)
        if (filters?.userId) params.set('userId', filters.userId)
        if (filters?.formId) params.set('formId', filters.formId)
        if (filters?.limit) params.set('limit', String(filters.limit))

        const response = await api.get('/reports/export/excel', {
          params: Object.fromEntries(params.entries()),
          responseType: 'blob', // Importante para descargar archivos
        })

        // Crear URL del blob y descargar
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url

        // Obtener nombre del archivo del header Content-Disposition o usar uno por defecto
        const contentDisposition = response.headers['content-disposition']
        let filename = `reporte-${type}-${new Date().toISOString().split('T')[0]}.xlsx`
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Exportación exitosa',
          description: 'El archivo Excel se ha descargado correctamente.',
        })

        return true
      } catch (err: any) {
        console.error('useReports exportReportToExcel error', err)
        setError('No fue posible exportar el reporte a Excel.')
        toast({
          title: 'Error al exportar',
          description: err.response?.data?.error || 'No se pudo exportar el archivo Excel.',
          variant: 'destructive',
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  /**
   * Exporta reporte a PDF desde el backend
   */
  const exportReportToPDF = useCallback(
    async (type: 'completion' | 'user-performance' | 'form-analytics', filters?: ReportFilters): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        params.set('type', type)
        if (filters?.startDate) params.set('startDate', filters.startDate)
        if (filters?.endDate) params.set('endDate', filters.endDate)
        if (filters?.userId) params.set('userId', filters.userId)
        if (filters?.formId) params.set('formId', filters.formId)
        if (filters?.limit) params.set('limit', String(filters.limit))

        const response = await api.get('/reports/export/pdf', {
          params: Object.fromEntries(params.entries()),
          responseType: 'blob', // Importante para descargar archivos
        })

        // Crear URL del blob y descargar
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url

        // Obtener nombre del archivo del header Content-Disposition o usar uno por defecto
        const contentDisposition = response.headers['content-disposition']
        let filename = `reporte-${type}-${new Date().toISOString().split('T')[0]}.pdf`
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Exportación exitosa',
          description: 'El archivo PDF se ha descargado correctamente.',
        })

        return true
      } catch (err: any) {
        console.error('useReports exportReportToPDF error', err)
        setError('No fue posible exportar el reporte a PDF.')
        toast({
          title: 'Error al exportar',
          description: err.response?.data?.error || 'No se pudo exportar el archivo PDF.',
          variant: 'destructive',
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  return {
    loading,
    error,
    getCompletionReport,
    getUserPerformanceReport,
    getFormAnalyticsReport,
    exportReportToExcel,
    exportReportToPDF,
  }
}

export default useReports

