import { useCallback, useEffect, useState } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'
import { type FormAssignment } from '@/shared/types/formBuilder'

/**
 * Frecuencia de asignación
 */
export type AssignmentFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ONCE' | 'CUSTOM'

/**
 * Input para crear una asignación
 */
export interface CreateAssignmentInput {
  formId: string
  userIds: string[]
  frequency: AssignmentFrequency
  startDate: string
  endDate?: string
}

/**
 * Input para actualizar una asignación
 */
export interface UpdateAssignmentInput {
  frequency?: AssignmentFrequency
  startDate?: string
  endDate?: string
  isCompleted?: boolean
}

/**
 * Asignación con información extendida
 */
export interface FormAssignmentWithDetails extends FormAssignment {
  formTitle?: string
  userName?: string
}

/**
 * Hook para gestionar asignaciones de formularios
 */
export const useFormAssignments = () => {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<FormAssignmentWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Obtiene todas las asignaciones
   */
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get<{
        data: FormAssignmentWithDetails[]
        pagination?: { total: number; page: number; limit: number; totalPages: number }
      }>('/assignments')
      const assignmentsData = Array.isArray(response.data.data) ? response.data.data : (response.data as unknown as FormAssignmentWithDetails[])
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
    } catch (err) {
      console.error('useFormAssignments fetchAssignments error', err)
      setError('No fue posible cargar las asignaciones.')
      setAssignments([])
      toast({
        title: 'No pudimos cargar las asignaciones',
        description: 'Intenta nuevamente en unos minutos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Crea una o múltiples asignaciones
   */
  const createAssignments = useCallback(
    async (input: CreateAssignmentInput) => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.post<FormAssignmentWithDetails[] | { data: FormAssignmentWithDetails[] }>('/assignments', input)
        const createdAssignments = Array.isArray(response.data) ? response.data : (response.data as { data: FormAssignmentWithDetails[] }).data
        setAssignments((prev) => [...createdAssignments, ...prev])
        toast({
          title: 'Asignaciones creadas',
          description: `Se crearon ${createdAssignments.length} asignación(es) correctamente.`,
        })
        return createdAssignments
      } catch (err) {
        console.error('useFormAssignments createAssignments error', err)
        toast({
          title: 'Error al crear asignaciones',
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

  /**
   * Actualiza una asignación
   */
  const updateAssignment = useCallback(
    async (id: string, input: UpdateAssignmentInput) => {
      try {
        setLoading(true)
        setError(null)
        const { data } = await api.put<FormAssignmentWithDetails>(`/assignments/${id}`, input)
        setAssignments((prev) => prev.map((assignment) => (assignment.id === id ? data : assignment)))
        toast({
          title: 'Asignación actualizada',
          description: 'La asignación fue actualizada correctamente.',
        })
        return data
      } catch (err) {
        console.error('useFormAssignments updateAssignment error', err)
        toast({
          title: 'Error al actualizar',
          description: 'No fue posible actualizar la asignación. Intenta nuevamente.',
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
   * Elimina una asignación
   */
  const deleteAssignment = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        setError(null)
        await api.delete(`/assignments/${id}`)
        setAssignments((prev) => prev.filter((assignment) => assignment.id !== id))
        toast({
          title: 'Asignación eliminada',
          description: 'La asignación fue eliminada correctamente.',
        })
      } catch (err) {
        console.error('useFormAssignments deleteAssignment error', err)
        toast({
          title: 'No pudimos eliminar la asignación',
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

  // Cargar asignaciones al montar
  useEffect(() => {
    void fetchAssignments()
  }, [fetchAssignments])

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    createAssignments,
    updateAssignment,
    deleteAssignment,
  }
}

export default useFormAssignments

