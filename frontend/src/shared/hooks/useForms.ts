import { useCallback, useEffect, useRef, useState } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'
import { type FormStatus } from '@/shared/types/formBuilder'

/**
 * Resumen de un formulario para la lista
 */
export interface FormSummary {
  id: string
  title: string
  description?: string
  fields: unknown[] // Array de campos (estructura completa)
  version: number
  status: FormStatus
  createdById: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

/**
 * Filtros para la búsqueda de formularios
 */
export interface FormFilters {
  search?: string
  status?: FormStatus
  page?: number
  pageSize?: number
}

/**
 * Respuesta paginada de formularios
 */
interface FormsResponse {
  data: FormSummary[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Hook que centraliza la gestión de formularios para el panel administrativo
 */
export const useForms = () => {
  const { toast } = useToast()
  const [forms, setForms] = useState<FormSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<FormsResponse['pagination'] | null>(null)
  const lastFiltersRef = useRef<FormFilters | undefined>(undefined)

  /**
   * Obtiene la lista de formularios con filtros opcionales
   */
  const fetchForms = useCallback(
    async (filters?: FormFilters) => {
      try {
        setLoading(true)
        setError(null)
        const resolvedFilters = filters ?? lastFiltersRef.current ?? undefined
        lastFiltersRef.current = resolvedFilters

        const effectiveFilters = resolvedFilters
        const params = new URLSearchParams()

        if (effectiveFilters?.search) params.set('search', effectiveFilters.search)
        if (effectiveFilters?.status) params.set('status', effectiveFilters.status)
        if (effectiveFilters?.page) params.set('page', String(effectiveFilters.page))
        if (effectiveFilters?.pageSize) params.set('limit', String(effectiveFilters.pageSize))

        const response = await api.get<FormsResponse>('/forms', {
          params: params.size > 0 ? Object.fromEntries(params.entries()) : undefined,
        })

        const formsData = Array.isArray(response.data.data) ? response.data.data : []
        setForms(formsData)
        setPagination(response.data.pagination || null)
      } catch (err) {
        console.error('useForms fetchForms error', err)
        setError('No fue posible cargar la lista de formularios.')
        setForms([])
        setPagination(null)
        toast({
          title: 'No pudimos cargar los formularios',
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
   * Archiva un formulario (soft delete)
   */
  const archiveForm = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        setError(null)
        await api.post(`/forms/${id}/archive`)
        setForms((prev) => prev.filter((form) => form.id !== id))
        toast({
          title: 'Formulario archivado',
          description: 'El formulario fue archivado correctamente.',
        })
      } catch (err) {
        console.error('useForms archiveForm error', err)
        toast({
          title: 'No pudimos archivar el formulario',
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

  /**
   * Duplica un formulario
   */
  const duplicateForm = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        setError(null)
        // Obtener el formulario original
        const { data: originalForm } = await api.get<FormSummary>(`/forms/${id}`)
        
        // Crear una copia con nuevo título
        const { data: duplicatedForm } = await api.post<FormSummary>('/forms', {
          title: `${originalForm.title} (copia)`,
          description: originalForm.description,
          fields: originalForm.fields,
        })

        setForms((prev) => [duplicatedForm, ...prev])
        toast({
          title: 'Formulario duplicado',
          description: 'Se creó una copia del formulario.',
        })
        return duplicatedForm
      } catch (err) {
        console.error('useForms duplicateForm error', err)
        toast({
          title: 'No pudimos duplicar el formulario',
          description: 'Intenta nuevamente.',
          variant: 'destructive',
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  /**
   * Publica un formulario
   */
  const publishForm = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        setError(null)
        const { data } = await api.post<FormSummary>(`/forms/${id}/publish`)
        setForms((prev) => prev.map((form) => (form.id === id ? data : form)))
        toast({
          title: 'Formulario publicado',
          description: 'El formulario está ahora disponible para los usuarios.',
        })
      } catch (err) {
        console.error('useForms publishForm error', err)
        toast({
          title: 'No pudimos publicar el formulario',
          description: 'Intenta nuevamente.',
          variant: 'destructive',
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  // Cargar formularios al montar el componente
  useEffect(() => {
    void fetchForms()
  }, [fetchForms])

  return {
    forms,
    loading,
    error,
    pagination,
    lastFilters: lastFiltersRef.current,
    fetchForms,
    archiveForm,
    duplicateForm,
    publishForm,
  }
}

export default useForms

