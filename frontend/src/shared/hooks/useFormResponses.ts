import { useCallback, useState } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'

/**
 * Respuesta de formulario con información extendida
 */
export interface FormResponseWithDetails {
  id: string
  formId: string
  formTitle: string
  userId: string
  userName?: string
  userEmail?: string
  data: Record<string, unknown>
  latitude?: number | null
  longitude?: number | null
  submittedAt: string
}

/**
 * Filtros para búsqueda de respuestas
 */
export interface FormResponseFilters {
  formId?: string
  userId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

/**
 * Respuesta paginada de respuestas
 */
interface FormResponsesResponse {
  data: FormResponseWithDetails[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Hook para gestionar respuestas de formularios
 */
export const useFormResponses = () => {
  const { toast } = useToast()
  const [responses, setResponses] = useState<FormResponseWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<FormResponsesResponse['pagination'] | null>(null)

  /**
   * Obtiene las respuestas con filtros opcionales
   */
  const fetchResponses = useCallback(
    async (filters?: FormResponseFilters) => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (filters?.formId) params.set('formId', filters.formId)
        if (filters?.userId) params.set('userId', filters.userId)
        if (filters?.startDate) params.set('startDate', filters.startDate)
        if (filters?.endDate) params.set('endDate', filters.endDate)
        if (filters?.page) params.set('page', String(filters.page))
        if (filters?.limit) params.set('limit', String(filters.limit))

        const response = await api.get<FormResponsesResponse>('/responses', {
          params: params.size > 0 ? Object.fromEntries(params.entries()) : undefined,
        })

        setResponses(response.data.data)
        setPagination(response.data.pagination || null)
      } catch (err) {
        console.error('useFormResponses fetchResponses error', err)
        setError('No fue posible cargar las respuestas.')
        setResponses([])
        setPagination(null)
        toast({
          title: 'No pudimos cargar las respuestas',
          description: 'Intenta nuevamente en unos minutos.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  /**
   * Obtiene una respuesta específica por ID
   */
  const getResponse = useCallback(
    async (id: string): Promise<FormResponseWithDetails> => {
      try {
        setLoading(true)
        setError(null)

        const { data } = await api.get<FormResponseWithDetails>(`/responses/${id}`)
        return data
      } catch (err) {
        console.error('useFormResponses getResponse error', err)
        setError('No fue posible cargar la respuesta.')
        toast({
          title: 'Error al cargar la respuesta',
          description: 'Intenta nuevamente en unos minutos.',
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
    responses,
    loading,
    error,
    pagination,
    fetchResponses,
    getResponse,
  }
}

export default useFormResponses

