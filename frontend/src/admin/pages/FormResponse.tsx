import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MapPin, Send, AlertCircle, X } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useToast } from '@/shared/components/ui/use-toast'
import ConfirmDialog from '@/shared/components/common/ConfirmDialog'
import { useFormResponse } from '@/shared/hooks/useFormResponse'
import { useGeolocation } from '@/shared/hooks/useGeolocation'
import {
  type Form,
  type Field,
  FieldType,
  type TextareaField,
  type NumberField,
  type DateField,
  type DateTimeField,
  type SelectField,
  type MultiselectField,
  type RadioField,
  type CheckboxField,
  type FileField,
  type PhotoField,
} from '@/shared/types/formBuilder'
import { sortFieldsByOrder } from '@/shared/types/formBuilder'

/**
 * Página para responder un formulario asignado
 */
const FormResponse = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { getAssignmentWithForm, submitResponse, loading } = useFormResponse()

  const [form, setForm] = useState<Form | null>(null)
  const [formLoading, setFormLoading] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [validationSchema, setValidationSchema] = useState<z.ZodObject<any> | null>(null)

  // Crear resolver dinámico basado en el schema
  const resolver = useMemo(() => {
    if (!validationSchema) return undefined
    return zodResolver(validationSchema)
  }, [validationSchema])

  // Inicializar React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid },
  } = useForm<Record<string, unknown>>({
    resolver,
    mode: 'onChange',
    defaultValues: {},
  })

  // Handler para errores de validación
  const onError = (errors: Record<string, unknown>) => {
    console.error('Errores de validación:', errors)
    toast({
      title: 'Error de validación',
      description: 'Por favor, completa todos los campos requeridos correctamente.',
      variant: 'destructive',
    })
  }

  // Hook de geolocalización
  const { location, error: locationError, loading: locationLoading, requestLocation } = useGeolocation({
    timeout: 10000,
    enableHighAccuracy: true,
  })

  // Obtener geolocalización automáticamente al cargar
  useEffect(() => {
    // Esperar un poco para asegurar que el componente esté montado
    const timer = setTimeout(() => {
      requestLocation()
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar

  // Cargar formulario
  useEffect(() => {
    if (!assignmentId) {
      toast({
        title: 'Error',
        description: 'ID de asignación no válido.',
        variant: 'destructive',
      })
      navigate('/admin/dashboard')
      return
    }

    const loadForm = async () => {
      try {
        setFormLoading(true)
        const { form: loadedForm } = await getAssignmentWithForm(assignmentId)
        setForm(loadedForm)
        const schema = createValidationSchema(loadedForm.fields)
        const defaultValues = getDefaultValues(loadedForm.fields)
        setValidationSchema(schema)
        // Resetear el formulario con los valores por defecto
        reset(defaultValues)
      } catch (err) {
        console.error('Error al cargar formulario:', err)
        navigate('/admin/dashboard')
      } finally {
        setFormLoading(false)
      }
    }

    void loadForm()
  }, [assignmentId, getAssignmentWithForm, navigate, toast, reset])

  // Crear schema de validación dinámico
  const createValidationSchema = (fields: Field[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {}
    fields.forEach((field) => {
      if (field.hidden) return

      let fieldSchema: z.ZodTypeAny

      switch (field.type) {
        case FieldType.TEXT:
        case FieldType.TEXTAREA:
        case FieldType.EMAIL:
        case FieldType.PHONE:
        case FieldType.URL:
          let stringSchema: z.ZodString = z.string()
          if (field.validations?.minLength) {
            stringSchema = stringSchema.min(field.validations.minLength, `Mínimo ${field.validations.minLength} caracteres`)
          }
          if (field.validations?.maxLength) {
            stringSchema = stringSchema.max(field.validations.maxLength, `Máximo ${field.validations.maxLength} caracteres`)
          }
          if (field.type === FieldType.EMAIL) {
            stringSchema = stringSchema.email('Email inválido')
          }
          if (field.type === FieldType.URL) {
            stringSchema = stringSchema.url('URL inválida')
          }
          if (field.validations?.pattern) {
            const regex = new RegExp(field.validations.pattern)
            stringSchema = stringSchema.regex(
              regex,
              field.validations.patternMessage || 'Formato inválido',
            )
          }
          fieldSchema = stringSchema
          break

        case FieldType.NUMBER:
          let numberSchema: z.ZodNumber = z.coerce.number({ message: 'Debe ser un número' })
          if (field.validations?.min !== undefined) {
            numberSchema = numberSchema.min(field.validations.min, `Mínimo ${field.validations.min}`)
          }
          if (field.validations?.max !== undefined) {
            numberSchema = numberSchema.max(field.validations.max, `Máximo ${field.validations.max}`)
          }
          fieldSchema = numberSchema
          break

        case FieldType.DATE:
        case FieldType.TIME:
        case FieldType.DATETIME:
          fieldSchema = z.string()
          break

        case FieldType.SELECT:
        case FieldType.RADIO:
          fieldSchema = z.string()
          break

        case FieldType.MULTISELECT:
        case FieldType.CHECKBOX:
          if (field.type === FieldType.CHECKBOX && !(field as CheckboxField).options) {
            fieldSchema = z.boolean()
          } else {
            fieldSchema = z.array(z.string())
            if (field.validations?.minSelections) {
              fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(
                field.validations.minSelections,
                `Selecciona al menos ${field.validations.minSelections} opción(es)`,
              )
            }
            if (field.validations?.maxSelections) {
              fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).max(
                field.validations.maxSelections,
                `Selecciona máximo ${field.validations.maxSelections} opción(es)`,
              )
            }
          }
          break

        case FieldType.FILE:
        case FieldType.PHOTO:
          fieldSchema = z.array(z.string()).optional()
          break

        case FieldType.SIGNATURE:
          fieldSchema = z.string().optional()
          break

        default:
          fieldSchema = z.unknown()
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional()
      } else if (field.type === FieldType.CHECKBOX && !(field as CheckboxField).options) {
        // Checkbox simple requerido
        fieldSchema = z.boolean().refine((val) => val === true, 'Este campo es obligatorio')
      }

      schemaFields[field.id] = fieldSchema
    })

    return z.object(schemaFields)
  }

  // Obtener valores por defecto
  const getDefaultValues = (fields: Field[]) => {
    const defaults: Record<string, unknown> = {}
    fields.forEach((field) => {
      if (field.hidden) return

      if (field.defaultValue !== undefined) {
        defaults[field.id] = field.defaultValue
      } else {
        switch (field.type) {
          case FieldType.MULTISELECT:
          case FieldType.CHECKBOX:
            if (field.type === FieldType.CHECKBOX && !(field as CheckboxField).options) {
              defaults[field.id] = false
            } else {
              defaults[field.id] = []
            }
            break
          case FieldType.FILE:
          case FieldType.PHOTO:
            // Campos de archivo/foto siempre deben ser arrays
            defaults[field.id] = []
            break
          case FieldType.NUMBER:
            // Para números, usar string vacío en lugar de undefined para evitar controlled/uncontrolled
            defaults[field.id] = ''
            break
          default:
            defaults[field.id] = ''
        }
      }
    })
    return defaults
  }

  // Manejar envío del formulario
  const onSubmit = async (data: Record<string, unknown>) => {
    console.log('onSubmit llamado con datos:', data)
    console.log('Form disponible:', !!form)
    console.log('AssignmentId:', assignmentId)
    console.log('Errores de validación:', errors)
    console.log('Es válido:', isValid)

    if (!form || !assignmentId) {
      console.error('Form o assignmentId no disponible')
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del formulario.',
        variant: 'destructive',
      })
      return
    }

    // Validar que tenemos los datos necesarios
    console.log('Datos del formulario validados:', data)
    setShowConfirmDialog(true)
  }

  // Confirmar envío
  const handleConfirmSubmit = async () => {
    if (!form || !assignmentId) {
      console.error('Form o assignmentId no disponible en confirmación')
      setShowConfirmDialog(false)
      return
    }

    try {
      setSubmitting(true)
      const formData = getValues()

      // Limpiar y convertir datos según el tipo de campo
      const cleanedData: Record<string, unknown> = {}
      Object.entries(formData).forEach(([key, value]) => {
        const field = form.fields.find((f) => f.id === key)
        if (!field) return

        // Para campos MULTISELECT, CHECKBOX con opciones, FILE y PHOTO, asegurar que sean arrays
        if (
          field.type === FieldType.MULTISELECT ||
          field.type === FieldType.FILE ||
          field.type === FieldType.PHOTO ||
          (field.type === FieldType.CHECKBOX && (field as CheckboxField).options)
        ) {
          if (value === '' || value === null || value === undefined) {
            cleanedData[key] = []
          } else if (!Array.isArray(value)) {
            // Si no es array pero debería serlo, convertir
            cleanedData[key] = []
          } else {
            cleanedData[key] = value
          }
        }
        // Para campos NUMBER, convertir string vacío a undefined si no es requerido
        else if (field.type === FieldType.NUMBER && (value === '' || value === null)) {
          if (field.required) {
            cleanedData[key] = value
          }
          // Si no es requerido, no incluirlo
        }
        // Para otros campos, convertir strings vacíos a undefined si no es requerido
        else if ((value === '' || value === null) && !field.required) {
          // No incluir campos opcionales vacíos
        } else {
          cleanedData[key] = value
        }
      })

      console.log('Enviando respuesta con datos:', cleanedData)
      console.log('Ubicación:', location)
      
      // Preparar payload para enviar
      const payload = {
        formId: form.id,
        data: cleanedData,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      }
      
      console.log('Payload completo:', payload)

      await submitResponse(payload)

      toast({
        title: '¡Respuesta enviada!',
        description: 'Tu respuesta fue enviada correctamente.',
      })

      setTimeout(() => {
        navigate('/admin/dashboard')
      }, 2000)
    } catch (err: any) {
      console.error('Error al enviar respuesta:', err)
      const errorMessage = err?.response?.data?.error || err?.message || 'Ocurrió un error inesperado.'
      const errorDetails = err?.response?.data?.details
      toast({
        title: 'Error al enviar respuesta',
        description: errorDetails 
          ? `${errorMessage}: ${JSON.stringify(errorDetails)}`
          : errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
      setShowConfirmDialog(false)
    }
  }

  // Renderizar campo según su tipo
  const renderField = (field: Field) => {
    if (field.hidden) return null

    const error = errors[field.id]
    const isRequired = field.required

    switch (field.type) {
      case FieldType.TEXT:
      case FieldType.EMAIL:
      case FieldType.PHONE:
      case FieldType.URL:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => (
                <Input
                  {...formField}
                  value={String(formField.value ?? '')}
                  id={field.id}
                  type={
                    field.type === FieldType.EMAIL
                      ? 'email'
                      : field.type === FieldType.PHONE
                        ? 'tel'
                        : field.type === FieldType.URL
                          ? 'url'
                          : 'text'
                  }
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  className={error ? 'border-destructive' : ''}
                />
              )}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.TEXTAREA:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => (
                <Textarea
                  {...formField}
                  value={String(formField.value ?? '')}
                  id={field.id}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  rows={(field as TextareaField).rows || 4}
                  className={error ? 'border-destructive' : ''}
                />
              )}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.NUMBER:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => (
                <Input
                  id={field.id}
                  type="number"
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  min={(field as NumberField).validations?.min}
                  max={(field as NumberField).validations?.max}
                  step={(field as NumberField).validations?.step}
                  className={error ? 'border-destructive' : ''}
                  value={formField.value === '' || formField.value === undefined ? '' : String(formField.value)}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : e.target.value
                    formField.onChange(value)
                  }}
                  onBlur={formField.onBlur}
                />
              )}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.DATE:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => (
                <Input
                  {...formField}
                  value={String(formField.value ?? '')}
                  id={field.id}
                  type="date"
                  disabled={field.disabled}
                  min={(field as DateField).validations?.minDate}
                  max={(field as DateField).validations?.maxDate}
                  className={error ? 'border-destructive' : ''}
                />
              )}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.TIME:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => (
                <Input
                  {...formField}
                  value={String(formField.value ?? '')}
                  id={field.id}
                  type="time"
                  disabled={field.disabled}
                  className={error ? 'border-destructive' : ''}
                />
              )}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.DATETIME:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => (
                <Input
                  {...formField}
                  value={String(formField.value ?? '')}
                  id={field.id}
                  type="datetime-local"
                  disabled={field.disabled}
                  min={(field as DateTimeField).validations?.minDate}
                  max={(field as DateTimeField).validations?.maxDate}
                  className={error ? 'border-destructive' : ''}
                />
              )}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.SELECT:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => (
                <Select onValueChange={formField.onChange} value={formField.value || ''} disabled={field.disabled}>
                  <SelectTrigger id={field.id} className={error ? 'border-destructive' : ''}>
                    <SelectValue placeholder={field.placeholder || 'Selecciona una opción'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field as SelectField).options.map((option) => (
                      <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.RADIO:
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => (
                <RadioGroup
                  onValueChange={formField.onChange}
                  value={formField.value || ''}
                  disabled={field.disabled}
                  className={(field as RadioField).orientation === 'horizontal' ? 'flex gap-4' : ''}
                >
                  {(field as RadioField).options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} disabled={option.disabled} />
                      <Label htmlFor={`${field.id}-${option.value}`} className="font-normal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.CHECKBOX:
        const checkboxField = field as CheckboxField
        if (!checkboxField.options) {
          // Checkbox simple
          return (
            <div key={field.id} className="flex items-center space-x-2">
              <Controller
                name={field.id}
                control={control}
                render={({ field: formField }) => (
                  <Checkbox
                    id={field.id}
                    checked={formField.value as boolean}
                    onCheckedChange={formField.onChange}
                    disabled={field.disabled}
                  />
                )}
              />
              <Label htmlFor={field.id} className="font-normal cursor-pointer">
                {checkboxField.checkboxLabel || field.label}
                {isRequired && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
          )
        } else {
          // Grupo de checkboxes
          return (
            <div key={field.id} className="space-y-2">
              <Label>
                {field.label}
                {isRequired && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Controller
                name={field.id}
                control={control}
                render={({ field: formField }) => {
                  // Asegurar que el valor sea siempre un array
                  const currentValue = Array.isArray(formField.value) 
                    ? formField.value 
                    : (formField.value === '' || formField.value === null || formField.value === undefined 
                        ? [] 
                        : [])
                  
                  return (
                    <div className="space-y-2">
                      {checkboxField.options?.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${field.id}-${option.value}`}
                            checked={currentValue.includes(option.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                formField.onChange([...currentValue, option.value])
                              } else {
                                formField.onChange(currentValue.filter((v) => v !== option.value))
                              }
                            }}
                            disabled={field.disabled || option.disabled}
                          />
                          <Label htmlFor={`${field.id}-${option.value}`} className="font-normal cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
              {error && <p className="text-sm text-destructive">{error.message as string}</p>}
            </div>
          )
        }

      case FieldType.MULTISELECT:
        // Por ahora, usar checkboxes para multiselect
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => {
                // Asegurar que el valor sea siempre un array
                const currentValue = Array.isArray(formField.value) 
                  ? formField.value 
                  : (formField.value === '' || formField.value === null || formField.value === undefined 
                      ? [] 
                      : [])
                
                return (
                  <div className="space-y-2">
                    {(field as MultiselectField).options.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${field.id}-${option.value}`}
                          checked={currentValue.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              formField.onChange([...currentValue, option.value])
                            } else {
                              formField.onChange(currentValue.filter((v) => v !== option.value))
                            }
                          }}
                          disabled={field.disabled || option.disabled}
                        />
                        <Label htmlFor={`${field.id}-${option.value}`} className="font-normal cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.FILE:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => {
                // Asegurar que el valor sea siempre un array
                const currentFiles = Array.isArray(formField.value) 
                  ? formField.value 
                  : (formField.value === '' || formField.value === null || formField.value === undefined 
                      ? [] 
                      : [])
                
                return (
                  <div className="space-y-2">
                    <Input
                      id={field.id}
                      type="file"
                      multiple={(field as FileField).multiple}
                      accept={(field as FileField).validations?.acceptedFileTypes?.join(',')}
                      disabled={field.disabled}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        // Convertir archivos a base64 o URLs (por ahora solo guardamos los nombres)
                        const fileNames = files.map((f) => f.name)
                        formField.onChange((field as FileField).multiple ? [...currentFiles, ...fileNames] : fileNames)
                      }}
                    />
                    {currentFiles.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Archivos seleccionados: {currentFiles.length}
                      </div>
                    )}
                  </div>
                )
              }}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.PHOTO:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              render={({ field: formField }) => {
                // Asegurar que el valor sea siempre un array
                const currentPhotos = Array.isArray(formField.value) 
                  ? formField.value 
                  : (formField.value === '' || formField.value === null || formField.value === undefined 
                      ? [] 
                      : [])
                
                return (
                  <div className="space-y-2">
                    <Input
                      id={field.id}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple={(field as PhotoField).multiple}
                      disabled={field.disabled}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        // Convertir archivos a base64 para enviarlos
                        const photoPromises = files.map((file) => {
                          return new Promise<string>((resolve, reject) => {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              resolve(reader.result as string)
                            }
                            reader.onerror = reject
                            reader.readAsDataURL(file)
                          })
                        })
                        
                        Promise.all(photoPromises).then((base64Photos) => {
                          const newPhotos = (field as PhotoField).multiple
                            ? [...currentPhotos, ...base64Photos]
                            : base64Photos
                          formField.onChange(newPhotos)
                        }).catch((err) => {
                          console.error('Error al leer archivos:', err)
                          toast({
                            title: 'Error',
                            description: 'No se pudieron leer las imágenes.',
                            variant: 'destructive',
                          })
                        })
                      }}
                    />
                    {currentPhotos.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {currentPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={photo} 
                              alt={`Foto ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => {
                                const newPhotos = currentPhotos.filter((_, i) => i !== index)
                                formField.onChange(newPhotos)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }}
            />
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
            {error && <p className="text-sm text-destructive">{error.message as string}</p>}
          </div>
        )

      case FieldType.SIGNATURE:
        // TODO: Implementar firma digital
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">Firma digital próximamente disponible</p>
            </div>
            {field.helperText && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
          </div>
        )

      default:
        return null
    }
  }

  if (formLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No se pudo cargar el formulario.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const sortedFields = sortFieldsByOrder(form.fields)

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          {form.description && <CardDescription>{form.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
            {/* Información de geolocalización */}
            {locationLoading && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Obteniendo ubicación...</AlertDescription>
              </Alert>
            )}
            {location && !locationLoading && (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  Ubicación capturada: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </AlertDescription>
              </Alert>
            )}
            {locationError && !locationLoading && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}

            {/* Renderizar campos */}
            {sortedFields.map((field) => renderField(field))}

            {/* Mostrar errores de validación si existen */}
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <div className="text-sm opacity-90">
                  <p className="mb-2">Por favor, corrige los errores en el formulario antes de enviar.</p>
                  <ul className="mt-2 text-xs list-disc list-inside space-y-1">
                    {Object.entries(errors).map(([key, error]) => {
                      const field = form.fields.find((f) => f.id === key)
                      return (
                        <li key={key}>
                          <strong>{field?.label || key}</strong>: {error?.message as string}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Alert>
            )}

            {/* Botón de envío */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || loading || formLoading}
                onClick={() => {
                  console.log('Botón clickeado')
                  console.log('Errores:', errors)
                  console.log('Es válido:', isValid)
                  console.log('Datos actuales:', getValues())
                }}
              >
                {submitting || loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Respuesta
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirmar envío"
        description="¿Estás seguro de que deseas enviar esta respuesta? No podrás modificarla después."
        confirmText="Enviar"
        cancelText="Cancelar"
        variant="default"
      />
    </div>
  )
}

export default FormResponse

