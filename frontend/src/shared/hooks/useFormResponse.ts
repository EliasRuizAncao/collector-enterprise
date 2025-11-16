import { useCallback, useState } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'
import { type Form, type CreateFormResponseInput } from '@/shared/types/formBuilder'
import { type FormAssignmentWithDetails } from './useFormAssignments'

/**
 * Hook para gestionar la respuesta de un formulario
 */
export const useFormResponse = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Obtiene una asignación y su formulario asociado
   */
  const getAssignmentWithForm = useCallback(async (assignmentId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Obtener la asignación
      const assignmentResponse = await api.get<FormAssignmentWithDetails>(`/assignments/${assignmentId}`)
      const assignment = assignmentResponse.data

      // Obtener el formulario
      const formResponse = await api.get<Form>(`/forms/${assignment.formId}`)
      const form = formResponse.data

      return { assignment, form }
    } catch (err) {
      console.error('useFormResponse getAssignmentWithForm error', err)
      setError('No fue posible cargar el formulario.')
      toast({
        title: 'Error al cargar el formulario',
        description: 'Intenta nuevamente en unos minutos.',
        variant: 'destructive',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Envía una respuesta de formulario
   */
  const submitResponse = useCallback(
    async (input: CreateFormResponseInput) => {
      try {
        setLoading(true)
        setError(null)

        const { data } = await api.post<{ id: string; submittedAt: string; message: string }>('/responses', input)

        toast({
          title: 'Respuesta enviada',
          description: 'Tu respuesta fue enviada correctamente.',
        })

        return data
      } catch (err: any) {
        console.error('useFormResponse submitResponse error', err)
        const errorMessage = err?.response?.data?.error || err?.message || 'No fue posible enviar la respuesta.'
        const errorDetails = err?.response?.data?.details
        setError(errorMessage)
        toast({
          title: 'Error al enviar la respuesta',
          description: errorDetails 
            ? `${errorMessage}: ${JSON.stringify(errorDetails)}`
            : errorMessage,
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
    error,
    getAssignmentWithForm,
    submitResponse,
  }
}

export default useFormResponse

