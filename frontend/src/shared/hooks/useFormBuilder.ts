import { useState, useCallback, useEffect, useRef } from 'react'

import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'
import { type Form, type CreateFormInput, type UpdateFormInput } from '@/shared/types/formBuilder'

interface UseFormBuilderOptions {
  /** ID del formulario a cargar (opcional) */
  formId?: string
  /** Si se debe cargar automáticamente al montar */
  autoLoad?: boolean
  /** Si se debe guardar automáticamente cada X segundos */
  autoSave?: boolean
  /** Intervalo de auto-save en segundos (default: 30) */
  autoSaveInterval?: number
  /** Callback cuando se guarda exitosamente */
  onSave?: (form: Form) => void
  /** Callback cuando se publica exitosamente */
  onPublish?: (form: Form) => void
}

interface UseFormBuilderReturn {
  /** Formulario actual */
  form: Form | null
  /** Estado de carga */
  loading: boolean
  /** Estado de guardado */
  saving: boolean
  /** Error actual */
  error: string | null
  /** Si hay cambios sin guardar */
  hasUnsavedChanges: boolean
  /** Cargar un formulario por ID */
  loadForm: (id: string) => Promise<void>
  /** Guardar o actualizar el formulario */
  saveForm: (data: CreateFormInput | UpdateFormInput) => Promise<Form | null>
  /** Publicar el formulario (cambiar status a PUBLISHED) */
  publishForm: (id: string) => Promise<Form | null>
  /** Marcar cambios como guardados */
  markAsSaved: () => void
  /** Actualizar datos pendientes de guardar (para auto-save) */
  updatePendingSave: (data: CreateFormInput | UpdateFormInput) => void
  /** Resetear el estado del hook */
  reset: () => void
}

/**
 * Hook personalizado para gestionar formularios en el constructor
 * Proporciona funciones para cargar, guardar y publicar formularios
 */
export const useFormBuilder = (options: UseFormBuilderOptions = {}): UseFormBuilderReturn => {
  const {
    formId,
    autoLoad = false,
    autoSave = false,
    autoSaveInterval = 30,
    onSave,
    onPublish,
  } = options

  const { toast } = useToast()

  // Estados
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Referencias para auto-save
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedDataRef = useRef<CreateFormInput | UpdateFormInput | null>(null)
  const pendingSaveRef = useRef<CreateFormInput | UpdateFormInput | null>(null)

  /**
   * Carga un formulario existente desde el backend
   */
  const loadForm = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        setError(null)

        const { data } = await api.get<Form>(`/forms/${id}`)

        setForm(data)
        setHasUnsavedChanges(false)
        lastSavedDataRef.current = null

        toast({
          title: 'Formulario cargado',
          description: 'El formulario se cargó correctamente',
        })
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'No se pudo cargar el formulario. Verifica que exista y que tengas permisos.'

        setError(errorMessage)
        setForm(null)

        toast({
          title: 'Error al cargar',
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

  /**
   * Guarda o actualiza un formulario
   * Detecta automáticamente si es creación o actualización basándose en si existe form.id
   */
  const saveForm = useCallback(
    async (data: CreateFormInput | UpdateFormInput): Promise<Form | null> => {
      try {
        setSaving(true)
        setError(null)

        // Determinar si es update: si hay un form existente con id, o si data tiene id explícito
        const formIdToUpdate = form?.id || ('id' in data && typeof data.id === 'string' ? data.id : null)
        const isUpdate = !!formIdToUpdate

        const endpoint = isUpdate ? `/forms/${formIdToUpdate}` : '/forms'
        const method = isUpdate ? 'put' : 'post'

        // Preparar payload (remover id del body si existe, ya que va en la URL)
        const payload = { ...data }
        if ('id' in payload) {
          delete (payload as { id?: string }).id
        }

        const { data: savedForm } = await api[method]<Form>(endpoint, payload)

        setForm(savedForm)
        setHasUnsavedChanges(false)
        lastSavedDataRef.current = data

        // Llamar callback si existe
        if (onSave) {
          onSave(savedForm)
        }

        toast({
          title: isUpdate ? 'Formulario actualizado' : 'Formulario creado',
          description: 'Los cambios se guardaron correctamente',
        })

        return savedForm
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'No se pudo guardar el formulario. Intenta nuevamente.'

        setError(errorMessage)

        toast({
          title: 'Error al guardar',
          description: errorMessage,
          variant: 'destructive',
        })

        throw err
      } finally {
        setSaving(false)
      }
    },
    [toast, onSave],
  )

  /**
   * Publica un formulario (cambia su estado a PUBLISHED)
   */
  const publishForm = useCallback(
    async (id: string): Promise<Form | null> => {
      try {
        setSaving(true)
        setError(null)

        const { data: publishedForm } = await api.post<Form>(`/forms/${id}/publish`)

        setForm(publishedForm)
        setHasUnsavedChanges(false)

        // Llamar callback si existe
        if (onPublish) {
          onPublish(publishedForm)
        }

        toast({
          title: 'Formulario publicado',
          description: 'El formulario está ahora disponible para los usuarios',
        })

        return publishedForm
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'No se pudo publicar el formulario. Verifica que esté completo.'

        setError(errorMessage)

        toast({
          title: 'Error al publicar',
          description: errorMessage,
          variant: 'destructive',
        })

        throw err
      } finally {
        setSaving(false)
      }
    },
    [toast, onPublish],
  )

  /**
   * Marca los cambios como guardados (útil después de auto-save)
   */
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false)
    lastSavedDataRef.current = pendingSaveRef.current
    pendingSaveRef.current = null
  }, [])

  /**
   * Resetea el estado del hook
   */
  const reset = useCallback(() => {
    setForm(null)
    setError(null)
    setHasUnsavedChanges(false)
    lastSavedDataRef.current = null
    pendingSaveRef.current = null

    // Limpiar auto-save timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
  }, [])

  /**
   * Función para comparar si hay cambios sin guardar
   */
  const hasChanges = useCallback(
    (currentData: CreateFormInput | UpdateFormInput): boolean => {
      if (!lastSavedDataRef.current) {
        return true
      }

      // Comparación simple de JSON (puede mejorarse con deep comparison)
      return JSON.stringify(currentData) !== JSON.stringify(lastSavedDataRef.current)
    },
    [],
  )

  /**
   * Auto-save: guarda automáticamente cada X segundos si hay cambios
   */
  useEffect(() => {
    if (!autoSave || !form) {
      return
    }

    // Limpiar timer anterior si existe
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
    }

    // Configurar nuevo timer
    autoSaveTimerRef.current = setInterval(() => {
      if (pendingSaveRef.current && hasChanges(pendingSaveRef.current)) {
        // Guardar en segundo plano sin bloquear la UI
        saveForm(pendingSaveRef.current).catch((err) => {
          console.error('Error en auto-save:', err)
          // No mostrar toast en auto-save para no molestar al usuario
        })
      }
    }, autoSaveInterval * 1000)

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    }
  }, [autoSave, autoSaveInterval, form, saveForm, hasChanges])

  /**
   * Cargar formulario automáticamente si se proporciona formId y autoLoad
   */
  useEffect(() => {
    if (autoLoad && formId) {
      void loadForm(formId)
    }
  }, [autoLoad, formId, loadForm])

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [])

  /**
   * Función helper para actualizar el estado de cambios sin guardar
   * Esta función puede ser llamada desde el componente padre cuando detecta cambios
   */
  const updatePendingSave = useCallback((data: CreateFormInput | UpdateFormInput) => {
    pendingSaveRef.current = data
    setHasUnsavedChanges(hasChanges(data))
  }, [hasChanges])

  return {
    form,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    loadForm,
    saveForm,
    publishForm,
    markAsSaved,
    updatePendingSave,
    reset,
  }
}

/**
 * Hook simplificado que expone solo las funciones esenciales
 * Útil cuando no necesitas todas las opciones avanzadas
 */
export const useFormBuilderSimple = (formId?: string) => {
  return useFormBuilder({
    formId,
    autoLoad: !!formId,
    autoSave: false,
  })
}

export default useFormBuilder

