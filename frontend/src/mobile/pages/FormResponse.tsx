/**
 * Responder Formulario - Mobile
 * Vista optimizada para móvil para responder formularios asignados
 * Incluye: cámara, geolocalización, firma digital, offline support
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MoreVertical,
  Check,
  X,
  AlertCircle,
  Save,
  Send,
  WifiOff,
  CheckCircle2,
  Loader2,
  FileText,
  HelpCircle,
  AlertTriangle,
  LayoutGrid,
  List,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { useSwipe } from '../hooks/useGestures'
import { useHaptics } from '../hooks/useHaptics'
import { useAuthStore } from '@/shared/store/authStore'
import { offlineStorage } from '../utils/offlineStorage'
import { dataManager } from '../utils/dataManager'
import type { Form, Field, FieldType } from '@/shared/types/formBuilder'
import {
  MobileTextInput,
  MobileTextarea,
  MobileNumberInput,
  MobileDateInput,
  MobileTimeInput,
  MobileSelect,
  MobileRadioGroup,
  MobileCheckbox,
  MobileSwitch,
  MobileFileInput,
} from '../components/inputs'
import { SignaturePad, CameraCapture, LocationPicker } from '../components'

/**
 * Tipo para los datos de respuesta del formulario
 */
type FormData = Record<string, unknown>

/**
 * Tipo para errores de validación
 */
type ValidationErrors = Record<string, string>

/**
 * Tipo para el estado del formulario
 */
interface FormState {
  form: Form | null
  assignment: {
    id: string
    formId: string
    userId: string
    isCompleted: boolean
  } | null
  currentFieldIndex: number
  formData: FormData
  validationErrors: ValidationErrors
  isDirty: boolean
  isSaving: boolean
  isSubmitting: boolean
  lastSaved: Date | null
}

/**
 * Componente Skeleton para el formulario
 */
const FormSkeleton = () => (
  <div className="flex min-h-screen flex-col">
    <div className="sticky top-0 z-50 border-b bg-background p-4">
      <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-2 w-full animate-pulse rounded bg-muted" />
    </div>
    <div className="flex-1 p-6">
      <div className="space-y-4">
        <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-14 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  </div>
)

/**
 * Componente para mostrar un campo del formulario
 */
const FormField = ({
  field,
  value,
  error,
  onChange,
  onBlur,
  isOnline,
  showCameraCapture,
  currentPhotoField,
  setShowCameraCapture,
  setCurrentPhotoField,
  showSignaturePad,
  currentSignatureField,
  setShowSignaturePad,
  setCurrentSignatureField,
}: {
  field: Field
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  onBlur: () => void
  isOnline: boolean
  showCameraCapture: boolean
  currentPhotoField: string | null
  setShowCameraCapture: (show: boolean) => void
  setCurrentPhotoField: (fieldId: string | null) => void
  showSignaturePad: boolean
  currentSignatureField: string | null
  setShowSignaturePad: (show: boolean) => void
  setCurrentSignatureField: (fieldId: string | null) => void
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Scroll automático a error
  useEffect(() => {
    if (error && inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  // Renderizar según el tipo de campo usando componentes optimizados
  const renderInput = () => {
    switch (field.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        return (
          <MobileTextInput
            value={(value as string) || ''}
            onChange={(val) => onChange(val)}
            label={field.label}
            placeholder={field.placeholder}
            helperText={field.helperText}
            error={error}
            required={field.required}
            disabled={field.disabled}
            type={field.type.toLowerCase() as 'text' | 'email' | 'tel' | 'url'}
            maxLength={field.validations?.maxLength}
            showSuccess={!error && !!value}
            isValid={!error && !!value}
            name={field.id}
            id={field.id}
            onBlur={onBlur}
            onFocus={() => {
              // Scroll automático ya está en el componente
            }}
          />
        )

      case 'TEXTAREA':
        return (
          <MobileTextarea
            value={(value as string) || ''}
            onChange={(val) => onChange(val)}
            label={field.label}
            placeholder={field.placeholder}
            helperText={field.helperText}
            error={error}
            required={field.required}
            disabled={field.disabled}
            rows={(field as any).rows}
            maxLength={field.validations?.maxLength}
            name={field.id}
            id={field.id}
            onBlur={onBlur}
          />
        )

      case 'NUMBER':
        return (
          <MobileNumberInput
            value={(value as number) || 0}
            onChange={(val) => onChange(val)}
            label={field.label}
            placeholder={field.placeholder}
            helperText={field.helperText}
            error={error}
            required={field.required}
            disabled={field.disabled}
            min={field.validations?.min}
            max={field.validations?.max}
            step={field.validations?.step}
            format={true}
            name={field.id}
            id={field.id}
            onBlur={onBlur}
          />
        )

      case 'DATE':
        return (
          <MobileDateInput
            value={value ? (typeof value === 'string' ? new Date(value) : value as Date) : null}
            onChange={(val) => onChange(val ? val.toISOString() : null)}
            label={field.label}
            placeholder={field.placeholder}
            helperText={field.helperText}
            error={error}
            required={field.required}
            disabled={field.disabled}
            minDate={field.validations?.minDate ? new Date(field.validations.minDate) : undefined}
            maxDate={field.validations?.maxDate ? new Date(field.validations.maxDate) : undefined}
            showQuickSelects={true}
            name={field.id}
            id={field.id}
            onBlur={onBlur}
          />
        )

      case 'TIME':
        return (
          <MobileTimeInput
            value={value ? (typeof value === 'string' ? new Date(`2000-01-01T${value}`) : value as Date) : null}
            onChange={(val) => {
              if (val) {
                const hours = String(val.getHours()).padStart(2, '0')
                const minutes = String(val.getMinutes()).padStart(2, '0')
                onChange(`${hours}:${minutes}`)
              } else {
                onChange(null)
              }
            }}
            label={field.label}
            placeholder={field.placeholder}
            helperText={field.helperText}
            error={error}
            required={field.required}
            disabled={field.disabled}
            showQuickSelects={true}
            name={field.id}
            id={field.id}
            onBlur={onBlur}
          />
        )

      case 'DATETIME':
        // Para datetime, usar date y time por separado o un input datetime-local
        return (
          <MobileDateInput
            value={value ? (typeof value === 'string' ? new Date(value) : value as Date) : null}
            onChange={(val) => onChange(val ? val.toISOString() : null)}
            label={field.label}
            placeholder={field.placeholder}
            helperText={field.helperText}
            error={error}
            required={field.required}
            disabled={field.disabled}
            minDate={field.validations?.minDate ? new Date(field.validations.minDate) : undefined}
            maxDate={field.validations?.maxDate ? new Date(field.validations.maxDate) : undefined}
            showQuickSelects={false}
            name={field.id}
            id={field.id}
            onBlur={onBlur}
          />
        )

      case 'SELECT':
        const selectField = field as any
        return (
          <MobileSelect
            value={(value as string) || null}
            onChange={(val) => onChange(val)}
            options={selectField.options || []}
            label={field.label}
            placeholder={field.placeholder}
            helperText={field.helperText}
            error={error}
            required={field.required}
            disabled={field.disabled}
            multiple={false}
            showSearch={selectField.options?.length > 10}
            name={field.id}
            id={field.id}
            onBlur={onBlur}
          />
        )

      case 'MULTISELECT':
        const multiselectField = field as any
        return (
          <MobileSelect
            value={(value as string[]) || []}
            onChange={(val) => onChange(val)}
            options={multiselectField.options || []}
            label={field.label}
            placeholder={field.placeholder}
            helperText={field.helperText}
            error={error}
            required={field.required}
            disabled={field.disabled}
            multiple={true}
            showSearch={multiselectField.options?.length > 10}
            name={field.id}
            id={field.id}
            onBlur={onBlur}
          />
        )

      case 'RADIO':
        const radioField = field as any
        return (
          <MobileRadioGroup
            value={(value as string) || null}
            onChange={(val) => onChange(val)}
            options={radioField.options || []}
            label={field.label}
            helperText={field.helperText}
            error={error}
            required={field.required}
            disabled={field.disabled}
            name={field.id}
            id={field.id}
            onBlur={onBlur}
          />
        )

      case 'CHECKBOX':
        const checkboxField = field as any
        if (checkboxField.options) {
          // Grupo de checkboxes
          return (
            <MobileCheckbox
              value={(value as string[]) || []}
              onChange={(val) => onChange(val)}
              options={checkboxField.options}
              label={field.label}
              helperText={field.helperText}
              error={error}
              required={field.required}
              disabled={field.disabled}
              name={field.id}
              id={field.id}
              onBlur={onBlur}
            />
          )
        } else {
          // Checkbox simple
          return (
            <MobileCheckbox
              value={(value as boolean) || false}
              onChange={(val) => onChange(val)}
              label={checkboxField.checkboxLabel || field.label}
              helperText={field.helperText}
              error={error}
              required={field.required}
              disabled={field.disabled}
              name={field.id}
              id={field.id}
              onBlur={onBlur}
            />
          )
        }

      case 'PHOTO':
      case 'IMAGE':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-600 ml-1">*</span>}
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPhotoField(field.id)
                  setShowCameraCapture(true)
                }}
                disabled={field.disabled || !isOnline}
              >
                Capturar foto
              </Button>
            </div>
            {value && Array.isArray(value) && value.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {value.map((file: File, index: number) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white hover:bg-red-600"
                      onClick={() => {
                        const newFiles = [...(value as File[])]
                        newFiles.splice(index, 1)
                        onChange(newFiles.length > 0 ? newFiles : null)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {field.helperText && !error && (
              <p className="text-sm text-muted-foreground">{field.helperText}</p>
            )}
            {showCameraCapture && currentPhotoField === field.id && (
              <CameraCapture
                open={showCameraCapture}
                onClose={() => {
                  setShowCameraCapture(false)
                  setCurrentPhotoField(null)
                }}
                onCapture={(photos: File[]) => {
                  const currentFiles = (value as File[]) || []
                  onChange([...currentFiles, ...photos])
                  setShowCameraCapture(false)
                  setCurrentPhotoField(null)
                }}
                maxPhotos={(field as any).multiple ? 10 : 1}
              />
            )}
          </div>
        )

      case 'FILE':
        return (
          <MobileFileInput
            value={value ? (Array.isArray(value) ? value as File[] : [value as File]) : null}
            onChange={(files) => onChange(files)}
            label={field.label}
            helperText={field.helperText}
            error={error}
            required={field.required}
            disabled={field.disabled || !isOnline}
            accept={field.validations?.acceptedFileTypes?.join(',')}
            multiple={(field as any).multiple}
            maxSize={field.validations?.maxFileSize}
            isPhoto={false}
            name={field.id}
            id={field.id}
            onBlur={onBlur}
          />
        )

      case 'SIGNATURE':
        return (
          <div className="space-y-2">
            {value && (
              <div className="relative rounded-lg border p-2">
                <img
                  src={value as string}
                  alt="Firma"
                  className="h-24 w-full object-contain"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentSignatureField(field.id)
                    setShowSignaturePad(true)
                  }}
                  className="mt-2 w-full"
                >
                  Editar firma
                </Button>
              </div>
            )}
            {!value && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentSignatureField(field.id)
                  setShowSignaturePad(true)
                }}
                className="w-full"
                disabled={field.disabled}
              >
                Agregar firma
              </Button>
            )}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {field.helperText && !error && (
              <p className="text-sm text-muted-foreground">{field.helperText}</p>
            )}
            {showSignaturePad && currentSignatureField === field.id && (
              <SignaturePad
                open={showSignaturePad}
                onClose={() => {
                  setShowSignaturePad(false)
                  setCurrentSignatureField(null)
                }}
                value={value as string | null}
                onSave={(signature) => {
                  onChange(signature.dataUrl)
                  setShowSignaturePad(false)
                  setCurrentSignatureField(null)
                }}
                validate={field.required}
              />
            )}
          </div>
        )

      case 'GEOLOCATION':
      case 'LOCATION':
        return (
          <LocationPicker
            onLocationSelect={(location) => {
              onChange({
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                address: location.address?.formatted,
                timestamp: location.timestamp,
              })
            }}
            initialLocation={
              value
                ? {
                    latitude: (value as any).latitude,
                    longitude: (value as any).longitude,
                    accuracy: (value as any).accuracy,
                    timestamp: new Date((value as any).timestamp || Date.now()),
                    address: (value as any).address
                      ? {
                          formatted: (value as any).address,
                        }
                      : undefined,
                  }
                : null
            }
            required={field.required}
            modal={false}
            showMap={true}
          />
        )

      default:
        return (
          <div className="rounded-lg border border-dashed border-input p-4 text-center text-muted-foreground">
            Tipo de campo no soportado: {field.type}
          </div>
        )
    }
  }

  // Los componentes de input ya incluyen label, helper text y error
  // Solo renderizar el input directamente
  return <div>{renderInput()}</div>
}

/**
 * Componente principal de respuesta de formulario
 */
const MobileFormResponse = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const haptics = useHaptics()

  // Estado del formulario
  const [state, setState] = useState<FormState>({
    form: null,
    assignment: null,
    currentFieldIndex: 0,
    formData: {},
    validationErrors: {},
    isDirty: false,
    isSaving: false,
    isSubmitting: false,
    lastSaved: null,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSummaryDialog, setShowSummaryDialog] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [confirmedSubmit, setConfirmedSubmit] = useState(false)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [currentSignatureField, setCurrentSignatureField] = useState<string | null>(null)
  const [currentPhotoField, setCurrentPhotoField] = useState<string | null>(null)
  
  // Modo de visualización: 'single' = campo por campo, 'all' = todos los campos
  const [viewMode, setViewMode] = useState<'single' | 'all'>(() => {
    // Cargar preferencia del usuario desde localStorage
    const saved = localStorage.getItem('form-view-mode')
    return (saved === 'single' || saved === 'all') ? saved : 'all'
  })

  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const formContainerRef = useRef<HTMLDivElement>(null)

  // Campos ordenados
  const sortedFields = useMemo(() => {
    if (!state.form) return []
    return [...state.form.fields].sort((a, b) => a.order - b.order)
  }, [state.form])

  const currentField = sortedFields[state.currentFieldIndex]
  const totalFields = sortedFields.length
  const completedFields = useMemo(() => {
    return sortedFields.filter((field) => {
      const value = state.formData[field.id]
      return value !== undefined && value !== null && value !== ''
    }).length
  }, [sortedFields, state.formData])

  const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 0

  // Detectar estado online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Cargar formulario y asignación
  useEffect(() => {
    const loadForm = async () => {
      if (!assignmentId) {
        setError('ID de asignación no proporcionado')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Intentar cargar desde IndexedDB primero (offline)
        try {
          const cachedAssignment = await offlineStorage.getAssignment(assignmentId)
          if (cachedAssignment?.data?.form) {
            setState((prev) => ({ ...prev, form: cachedAssignment.data.form as Form }))
          }
        } catch (e) {
          console.warn('Error al cargar desde cache:', e)
        }

        // Cargar desde API
        const assignmentRes = await api.get(`/assignments/${assignmentId}`, { timeout: 10000 })
        const assignment = assignmentRes.data

        // Obtener el formulario usando el formId de la asignación
        let formRes = null
        if (assignment?.formId) {
          try {
            formRes = await api.get(`/forms/${assignment.formId}`, { timeout: 10000 })
          } catch (error: any) {
            console.warn('Error al cargar formulario:', error)
            // Continuar sin el formulario si falla
          }
        }

        // Verificar que esté asignado al usuario actual
        if (assignment.userId !== user?.id) {
          setError('No tienes permiso para acceder a esta asignación')
          setIsLoading(false)
          return
        }

        let form: Form
        if (formRes?.data) {
          form = formRes.data
        } else if (assignment?.formId) {
          // Obtener formulario por formId
          try {
            const formResponse = await api.get(`/forms/${assignment.formId}`, { timeout: 10000 })
            form = formResponse.data
          } catch (e: any) {
            // Si falla con 404, usar datos mock o mostrar error
            if (e?.response?.status === 404) {
              setError('Formulario no encontrado. Verifica tu conexión.')
              setIsLoading(false)
              return
            }
            throw e
          }
        }

        // Guardar assignment en cache usando dataManager (con compresión)
        try {
          await dataManager.saveAssignment({
            id: assignmentId,
            formId: assignment.formId,
            userId: assignment.userId,
            data: { form }, // Guardar form dentro de data
            status: assignment.isCompleted ? 'completed' : 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            _syncStatus: 'synced',
            _version: 1,
          })
        } catch (e) {
          console.warn('Error al guardar en cache:', e)
        }

        // Cargar borrador si existe usando offlineStorage
        let draftData: FormData = {}
        try {
          const draftId = `draft-${assignmentId}`
          const draft = await offlineStorage.getResponse(draftId)
          if (draft && draft._isDraft && draft.data) {
            draftData = draft.data as FormData
          }
        } catch (e) {
          // Draft puede no existir aún
          console.warn('Error al cargar borrador:', e)
        }

        setState((prev) => ({
          ...prev,
          form,
          assignment: {
            id: assignment.id,
            formId: assignment.formId,
            userId: assignment.userId,
            isCompleted: assignment.isCompleted,
          },
          formData: draftData,
        }))
      } catch (err: any) {
        console.error('Error al cargar formulario:', err)
        setError(
          err.response?.data?.message || 'Error al cargar el formulario. Intenta nuevamente.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadForm()
  }, [assignmentId, user?.id])

  // Auto-save cada 30 segundos
  useEffect(() => {
    if (!state.isDirty || !state.form || !assignmentId) return

    autoSaveTimerRef.current = setInterval(() => {
      void saveDraft()
    }, 30000) // 30 segundos

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [state.isDirty, state.form, assignmentId])

  // Guardar borrador
  const saveDraft = useCallback(async () => {
    if (!state.form || !assignmentId || !state.isDirty) return

    setState((prev) => ({ ...prev, isSaving: true }))

    try {
      // Guardar en IndexedDB usando dataManager (con compresión automática)
      const draftId = `draft-${assignmentId}`
      await dataManager.saveResponse({
        id: draftId,
        assignmentId,
        data: state.formData,
        _isDraft: true,
        _syncStatus: 'pending',
        _lastSaved: new Date(),
        _version: 1,
      })

      // Intentar guardar en servidor si hay conexión
      if (isOnline) {
        try {
          await api.post(`/assignments/${assignmentId}/draft`, {
            data: state.formData,
          })
          // Marcar como sincronizado si se guardó en servidor
          await offlineStorage.markAsSync(draftId)
        } catch (e: any) {
          // Si falla, se guardó localmente y se sincronizará después
          // Solo loggear errores que no sean 404 (endpoint no implementado aún)
          if (e?.response?.status !== 404) {
            console.warn('Error al guardar borrador en servidor:', e)
          }
        }
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        isDirty: false,
        lastSaved: new Date(),
      }))

      toast({
        title: 'Borrador guardado',
        description: 'Tu progreso se ha guardado automáticamente',
        duration: 2000,
      })
    } catch (err) {
      console.error('Error al guardar borrador:', err)
      setState((prev) => ({ ...prev, isSaving: false }))
    }
  }, [state.form, assignmentId, state.formData, state.isDirty, isOnline, toast])

  // Validar campo
  const validateField = useCallback(
    (field: Field, value: unknown): string | null => {
      if (field.required && (value === undefined || value === null || value === '')) {
        return 'Este campo es obligatorio'
      }

      if (value === undefined || value === null || value === '') {
        return null // Campo opcional vacío es válido
      }

      const validations = field.validations
      if (!validations) return null

      // Validaciones de texto
      if (field.type === 'TEXT' || field.type === 'TEXTAREA' || field.type === 'EMAIL') {
        const strValue = String(value)
        if (validations.minLength && strValue.length < validations.minLength) {
          return `Mínimo ${validations.minLength} caracteres`
        }
        if (validations.maxLength && strValue.length > validations.maxLength) {
          return `Máximo ${validations.maxLength} caracteres`
        }
        if (validations.pattern) {
          const regex = new RegExp(validations.pattern)
          if (!regex.test(strValue)) {
            return validations.patternMessage || 'Formato inválido'
          }
        }
      }

      // Validaciones de número
      if (field.type === 'NUMBER') {
        const numValue = Number(value)
        if (isNaN(numValue)) {
          return 'Debe ser un número válido'
        }
        if (validations.min !== undefined && numValue < validations.min) {
          return `Mínimo ${validations.min}`
        }
        if (validations.max !== undefined && numValue > validations.max) {
          return `Máximo ${validations.max}`
        }
      }

      // Validaciones de email
      if (field.type === 'EMAIL') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(value))) {
          return 'Email inválido'
        }
      }

      return null
    },
    [],
  )

  // Validar todos los campos
  const validateAllFields = useCallback((): boolean => {
    const errors: ValidationErrors = {}

    sortedFields.forEach((field) => {
      const value = state.formData[field.id]
      const error = validateField(field, value)
      if (error) {
        errors[field.id] = error
      }
    })

    setState((prev) => ({ ...prev, validationErrors: errors }))

    if (Object.keys(errors).length > 0) {
      // Scroll al primer error
      const firstErrorFieldId = Object.keys(errors)[0]
      const errorElement = document.getElementById(`field-${firstErrorFieldId}`)
      if (errorElement && formContainerRef.current) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      // Vibración háptica
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }

      return false
    }

    return true
  }, [sortedFields, state.formData, validateField])

  // Manejar cambio de valor
  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, [fieldId]: value },
        isDirty: true,
        validationErrors: { ...prev.validationErrors, [fieldId]: undefined },
      }))

      // Guardar automáticamente al cambiar de campo
      void saveDraft()
    },
    [saveDraft],
  )

  // Manejar blur (validar al salir del campo)
  const handleFieldBlur = useCallback(
    (fieldId: string) => {
      const field = sortedFields.find((f) => f.id === fieldId)
      if (!field) return

      const value = state.formData[fieldId]
      const error = validateField(field, value)

      setState((prev) => ({
        ...prev,
        validationErrors: {
          ...prev.validationErrors,
          [fieldId]: error || undefined,
        },
      }))
    },
    [sortedFields, state.formData, validateField],
  )

  // Navegación entre campos
  const goToField = useCallback((index: number) => {
    if (index >= 0 && index < totalFields) {
      setState((prev) => ({ ...prev, currentFieldIndex: index }))
    }
  }, [totalFields])

  const goToNext = useCallback(() => {
    if (state.currentFieldIndex < totalFields - 1) {
      goToField(state.currentFieldIndex + 1)
    }
  }, [state.currentFieldIndex, totalFields, goToField])

  const goToPrevious = useCallback(() => {
    if (state.currentFieldIndex > 0) {
      goToField(state.currentFieldIndex - 1)
    }
  }, [state.currentFieldIndex, goToField])

  // Swipe gestures para navegación
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipe({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    threshold: 50,
  })

  // Scroll automático al campo actual en modo "campo por campo"
  useEffect(() => {
    if (viewMode === 'single' && currentField && formContainerRef.current) {
      // Pequeño delay para asegurar que el DOM se haya actualizado
      const timer = setTimeout(() => {
        const fieldElement = document.getElementById(`field-${currentField.id}`)
        if (fieldElement) {
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [viewMode, state.currentFieldIndex, currentField])

  // Enviar formulario
  const handleSubmit = useCallback(async () => {
    if (!state.form || !assignmentId) return

    if (!validateAllFields()) {
      haptics.warning()
      toast({
        title: 'Error de validación',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      })
      return
    }

    if (!confirmedSubmit) {
      setShowConfirmDialog(true)
      return
    }

    setState((prev) => ({ ...prev, isSubmitting: true }))

    try {
      // Obtener geolocalización si está disponible
      let latitude: number | undefined
      let longitude: number | undefined

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 60000,
          })
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
      } catch (e) {
        // Geolocalización no disponible o denegada
        console.warn('No se pudo obtener geolocalización:', e)
      }

      // Enviar respuesta
      const response = await api.post(`/assignments/${assignmentId}/submit`, {
        data: state.formData,
        latitude,
        longitude,
      })

      // Eliminar borrador usando offlineStorage
      try {
        const draftId = `draft-${assignmentId}`
        await offlineStorage.deleteDraft(draftId)
      } catch (e) {
        console.warn('Error al eliminar borrador:', e)
      }

      haptics.success()
      toast({
        title: 'Formulario enviado',
        description: 'Tu respuesta se ha enviado correctamente',
        duration: 3000,
      })

      // Redirigir después de 1 segundo
      setTimeout(() => {
        navigate('/mobile/assignments')
      }, 1000)
    } catch (err: any) {
      console.error('Error al enviar formulario:', err)
      
      // Si falla y estamos offline, guardar para sincronizar después usando dataManager
      if (!isOnline) {
        try {
          const responseId = `response-${assignmentId}-${Date.now()}`
          await dataManager.saveResponse({
            id: responseId,
            assignmentId,
            data: state.formData,
            location: latitude && longitude ? {
              latitude,
              longitude,
              accuracy: undefined,
            } : undefined,
            _isDraft: false,
            _syncStatus: 'pending',
            _lastSaved: new Date(),
            _version: 1,
          })

          toast({
            title: 'Guardado para sincronizar',
            description: 'Tu respuesta se guardó localmente y se enviará cuando haya conexión',
            duration: 3000,
          })

          navigate('/mobile/assignments')
        } catch (e) {
          haptics.error()
          toast({
            title: 'Error',
            description: 'No se pudo guardar la respuesta. Intenta nuevamente.',
            variant: 'destructive',
          })
        }
      } else {
        haptics.error()
        toast({
          title: 'Error al enviar',
          description: err.response?.data?.message || 'Hubo un problema al enviar el formulario',
          variant: 'destructive',
        })
      }
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false, confirmedSubmit: false }))
    }
  }, [state.form, assignmentId, state.formData, validateAllFields, confirmedSubmit, isOnline, navigate, toast])

  // Guardar y salir
  const handleSaveAndExit = useCallback(async () => {
    await saveDraft()
    navigate('/mobile/assignments')
  }, [saveDraft, navigate])

  // Loading state
  if (isLoading) {
    return <FormSkeleton />
  }

  // Error state
  if (error || !state.form || !state.assignment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-xl font-semibold">Error</h2>
        <p className="mb-4 text-center text-muted-foreground">{error || 'Formulario no encontrado'}</p>
        <Button onClick={() => navigate('/mobile/assignments')}>Volver a tareas</Button>
      </div>
    )
  }

  // Si está completado, mostrar mensaje
  if (state.assignment.isCompleted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <CheckCircle2 className="mb-4 h-12 w-12 text-green-600" />
        <h2 className="mb-2 text-xl font-semibold">Formulario completado</h2>
        <p className="mb-4 text-center text-muted-foreground">
          Este formulario ya ha sido completado anteriormente
        </p>
        <Button onClick={() => navigate('/mobile/assignments')}>Volver a tareas</Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header Sticky */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => navigate('/mobile/assignments')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 px-3">
          <h1 className="truncate text-base font-semibold">{state.form.title}</h1>
          <p className="text-xs text-muted-foreground">
            {viewMode === 'single' 
              ? `Campo ${state.currentFieldIndex + 1} de ${totalFields}` 
              : `${completedFields} de ${totalFields} campos`}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowSummaryDialog(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Ver resumen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSaveAndExit}>
              <Save className="mr-2 h-4 w-4" />
              Guardar y salir
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                const newMode = viewMode === 'single' ? 'all' : 'single'
                setViewMode(newMode)
                localStorage.setItem('form-view-mode', newMode)
                // Si cambia a modo single, asegurar que el campo actual esté visible
                if (newMode === 'single' && currentField) {
                  const fieldElement = document.getElementById(`field-${currentField.id}`)
                  if (fieldElement) {
                    fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }
              }}
            >
              {viewMode === 'single' ? (
                <>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Ver todos los campos
                </>
              ) : (
                <>
                  <List className="mr-2 h-4 w-4" />
                  Campo por campo
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              Ayuda
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-border bg-muted/30 px-4 py-2">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Offline Badge */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <WifiOff className="h-4 w-4" />
          <span>Modo offline - Los datos se sincronizarán cuando haya conexión</span>
        </div>
      )}

      {/* Contenido Principal */}
      <div
        ref={formContainerRef}
        className="flex-1 overflow-y-auto pb-24"
        onTouchStart={viewMode === 'single' ? handleTouchStart : undefined}
        onTouchMove={viewMode === 'single' ? handleTouchMove : undefined}
        onTouchEnd={viewMode === 'single' ? handleTouchEnd : undefined}
      >
        <div className="p-6 space-y-6">
          {viewMode === 'all' ? (
            // Modo: Todos los campos visibles
            sortedFields.map((field) => (
              <div key={field.id} id={`field-${field.id}`}>
                <FormField
                  field={field}
                  value={state.formData[field.id]}
                  error={state.validationErrors[field.id]}
                  onChange={(value) => handleFieldChange(field.id, value)}
                  onBlur={() => handleFieldBlur(field.id)}
                  isOnline={isOnline}
                  showCameraCapture={showCameraCapture}
                  currentPhotoField={currentPhotoField}
                  setShowCameraCapture={setShowCameraCapture}
                  setCurrentPhotoField={setCurrentPhotoField}
                  showSignaturePad={showSignaturePad}
                  currentSignatureField={currentSignatureField}
                  setShowSignaturePad={setShowSignaturePad}
                  setCurrentSignatureField={setCurrentSignatureField}
                />
              </div>
            ))
          ) : (
            // Modo: Campo por campo
            currentField && (
              <div id={`field-${currentField.id}`}>
                <FormField
                  field={currentField}
                  value={state.formData[currentField.id]}
                  error={state.validationErrors[currentField.id]}
                  onChange={(value) => handleFieldChange(currentField.id, value)}
                  onBlur={() => handleFieldBlur(currentField.id)}
                  isOnline={isOnline}
                  showCameraCapture={showCameraCapture}
                  currentPhotoField={currentPhotoField}
                  setShowCameraCapture={setShowCameraCapture}
                  setCurrentPhotoField={setCurrentPhotoField}
                  showSignaturePad={showSignaturePad}
                  currentSignatureField={currentSignatureField}
                  setShowSignaturePad={setShowSignaturePad}
                  setCurrentSignatureField={setCurrentSignatureField}
                />
              </div>
            )
          )}

          {/* Indicador de guardado */}
          {state.isSaving && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </div>
          )}

          {state.lastSaved && !state.isSaving && (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3 w-3" />
              <span>Guardado {state.lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Sticky */}
      <footer className="fixed bottom-16 left-0 right-0 z-[60] border-t border-border bg-background px-4 py-3 safe-bottom">
        <div className="flex items-center gap-3">
          {viewMode === 'single' ? (
            // Modo campo por campo: mostrar navegación
            <>
              <Button
                variant="ghost"
                onClick={goToPrevious}
                disabled={state.currentFieldIndex === 0}
                className="flex-1"
              >
                Anterior
              </Button>

              {state.currentFieldIndex < totalFields - 1 ? (
                <Button onClick={goToNext} className="flex-1" disabled={!currentField}>
                  Siguiente
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={state.isSubmitting || !currentField}
                  className="flex-1"
                >
                  {state.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={saveDraft}
                disabled={!state.isDirty || state.isSaving}
                title="Guardar borrador"
              >
                <Save className="h-4 w-4" />
              </Button>
            </>
          ) : (
            // Modo todos los campos: solo botón de enviar
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={saveDraft}
                disabled={!state.isDirty || state.isSaving}
                title="Guardar borrador"
                className="flex-shrink-0"
              >
                <Save className="h-4 w-4" />
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={state.isSubmitting}
                className="flex-1"
              >
                {state.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </footer>

      {/* Modal de Confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Confirmar envío</DialogTitle>
            <DialogDescription>
              Revisa que todos los datos sean correctos antes de enviar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Campos completados: {completedFields} de {totalFields}</p>
              {completedFields < totalFields && (
                <p className="mt-1 text-sm text-amber-600">
                  ⚠️ Hay {totalFields - completedFields} campo(s) sin completar
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm"
                checked={confirmedSubmit}
                onCheckedChange={(checked) => setConfirmedSubmit(checked === true)}
              />
              <label
                htmlFor="confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirmo que los datos son correctos
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Revisar
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false)
                setConfirmedSubmit(true)
                void handleSubmit()
              }}
              disabled={!confirmedSubmit}
            >
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Resumen */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-h-[80vh] max-w-[90vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resumen del formulario</DialogTitle>
            <DialogDescription>
              Revisa todas tus respuestas antes de enviar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {sortedFields.map((field) => {
              const value = state.formData[field.id]
              const hasValue = value !== undefined && value !== null && value !== ''

              return (
                <div key={field.id} className="space-y-1 border-b pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </span>
                    {hasValue ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  {hasValue ? (
                    <p className="text-sm text-muted-foreground">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sin completar</p>
                  )}
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSummaryDialog(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setShowSummaryDialog(false)
                setShowConfirmDialog(true)
              }}
            >
              Enviar formulario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MobileFormResponse
