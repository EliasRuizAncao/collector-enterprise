import { useEffect, useMemo, useCallback } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, GripVertical } from 'lucide-react'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import { Card } from '@/shared/components/ui/card'
import {
  type Field,
  FieldType,
} from '@/shared/types/formBuilder'
import { getFieldTypeLabel } from '@/shared/lib/formBuilderUtils'

interface FieldPropertiesPanelProps {
  /** Campo seleccionado para editar, null si no hay ninguno */
  field: Field | null
  /** Callback cuando se actualiza el campo */
  onFieldUpdate: (field: Field) => void
}

/**
 * Schema base de validación para todas las propiedades comunes
 */
const baseFieldSchema = z.object({
  label: z.string().min(1, 'La etiqueta es obligatoria').max(100, 'Máximo 100 caracteres'),
  placeholder: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
  helperText: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  required: z.boolean(),
  disabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
})

/**
 * Schema para campos de texto (TEXT, EMAIL, PHONE, URL)
 */
const textFieldSchema = baseFieldSchema.extend({
  validations: z
    .object({
      minLength: z.number().int().min(0).max(10000).optional(),
      maxLength: z.number().int().min(1).max(10000).optional(),
      pattern: z.string().optional(),
      patternMessage: z.string().optional(),
    })
    .optional(),
})

/**
 * Schema para campos de texto largo (TEXTAREA)
 */
const textareaFieldSchema = baseFieldSchema.extend({
  rows: z.number().int().min(1).max(20).optional(),
  validations: z
    .object({
      minLength: z.number().int().min(0).max(50000).optional(),
      maxLength: z.number().int().min(1).max(50000).optional(),
    })
    .optional(),
})

/**
 * Schema para campos numéricos (NUMBER)
 */
const numberFieldSchema = baseFieldSchema.extend({
  validations: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().min(0.0001).optional(),
    })
    .optional(),
})

/**
 * Schema para campos de fecha (DATE, TIME, DATETIME)
 */
const dateFieldSchema = baseFieldSchema.extend({
  validations: z
    .object({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
    })
    .optional(),
})

/**
 * Schema para campos de selección (SELECT, MULTISELECT, RADIO, CHECKBOX)
 */
const selectFieldSchema = baseFieldSchema.extend({
  options: z
    .array(
      z.object({
        value: z.string().min(1, 'El valor es obligatorio'),
        label: z.string().min(1, 'La etiqueta es obligatoria'),
        disabled: z.boolean().optional(),
      }),
    )
    .min(1, 'Debe haber al menos una opción'),
  validations: z
    .object({
      minSelections: z.number().int().min(0).optional(),
      maxSelections: z.number().int().min(1).optional(),
    })
    .optional(),
})

/**
 * Schema para campos de archivo (FILE, PHOTO)
 */
const fileFieldSchema = baseFieldSchema.extend({
  multiple: z.boolean().optional(),
  validations: z
    .object({
      acceptedFileTypes: z.array(z.string()).optional(),
      maxFileSize: z.number().min(0.1).max(1000).optional(), // MB
    })
    .optional(),
})

/**
 * Schema para campos de firma (SIGNATURE)
 */
const signatureFieldSchema = baseFieldSchema.extend({
  width: z.number().int().min(100).max(2000).optional(),
  height: z.number().int().min(50).max(2000).optional(),
})

type FieldFormValues = z.infer<typeof baseFieldSchema> &
  Partial<z.infer<typeof textFieldSchema>> &
  Partial<z.infer<typeof numberFieldSchema>> &
  Partial<z.infer<typeof textareaFieldSchema>> &
  Partial<z.infer<typeof dateFieldSchema>> &
  Partial<z.infer<typeof selectFieldSchema>> &
  Partial<z.infer<typeof fileFieldSchema>> &
  Partial<z.infer<typeof signatureFieldSchema>>

/**
 * Obtiene el schema de validación según el tipo de campo
 */
const getFieldSchema = (fieldType: FieldType) => {
  switch (fieldType) {
    case FieldType.TEXT:
    case FieldType.EMAIL:
    case FieldType.PHONE:
    case FieldType.URL:
      return textFieldSchema
    case FieldType.TEXTAREA:
      return textareaFieldSchema
    case FieldType.NUMBER:
      return numberFieldSchema
    case FieldType.DATE:
    case FieldType.TIME:
    case FieldType.DATETIME:
      return dateFieldSchema
    case FieldType.SELECT:
    case FieldType.MULTISELECT:
    case FieldType.RADIO:
    case FieldType.CHECKBOX:
      return selectFieldSchema
    case FieldType.FILE:
    case FieldType.PHOTO:
      return fileFieldSchema
    case FieldType.SIGNATURE:
      return signatureFieldSchema
    default:
      return baseFieldSchema
  }
}

/**
 * Panel de propiedades para editar un campo seleccionado
 * Muestra un formulario dinámico según el tipo de campo
 */
const FieldPropertiesPanel = ({ field, onFieldUpdate }: FieldPropertiesPanelProps) => {
  // Si no hay campo seleccionado, mostrar mensaje
  if (!field) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            No hay campo seleccionado
          </p>
          <p className="text-xs text-muted-foreground">
            Selecciona un campo del canvas para editar sus propiedades
          </p>
        </div>
      </div>
    )
  }

  // Obtener schema según tipo de campo
  const schema = useMemo(() => getFieldSchema(field.type), [field.type])

  // Inicializar formulario
  const form = useForm<FieldFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validar en tiempo real
    defaultValues: getDefaultValues(field),
  })

  // Actualizar valores cuando cambia el campo seleccionado
  useEffect(() => {
    const defaultValues = getDefaultValues(field)
    Object.keys(defaultValues).forEach((key) => {
      form.setValue(key as keyof FieldFormValues, defaultValues[key as keyof FieldFormValues])
    })
  }, [field, form])

  // Guardar automáticamente cuando cambian los valores
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Asegurar que los valores requeridos estén presentes
      if (value.label && field) {
        const updatedField = buildFieldFromFormValues(field, value as FieldFormValues)
        onFieldUpdate(updatedField)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, field, onFieldUpdate])

  const onSubmit = (values: FieldFormValues) => {
    const updatedField = buildFieldFromFormValues(field, values)
    onFieldUpdate(updatedField)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 space-y-1 border-b border-border/70 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h2 className="text-base font-semibold text-foreground">Propiedades del campo</h2>
        <p className="text-xs text-muted-foreground">{getFieldTypeLabel(field.type)}</p>
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto p-4">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Propiedades básicas */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Etiqueta *</FormLabel>
                    <FormControl>
                      <Input {...formField} placeholder="Nombre del campo" />
                    </FormControl>
                    <FormDescription>
                      Nombre visible del campo para el usuario
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="placeholder"
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Placeholder</FormLabel>
                    <FormControl>
                      <Input {...formField} placeholder="Texto de ayuda..." />
                    </FormControl>
                    <FormDescription>
                      Texto que aparece cuando el campo está vacío
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="helperText"
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Texto de ayuda</FormLabel>
                    <FormControl>
                      <Textarea {...formField} placeholder="Descripción adicional..." rows={2} />
                    </FormControl>
                    <FormDescription>
                      Texto de ayuda que aparece debajo del campo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Propiedades específicas según tipo de campo */}
            {renderTypeSpecificFields(field, form)}

            <Separator />

            {/* Configuraciones avanzadas */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="required"
                render={({ field: formField }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Obligatorio</FormLabel>
                      <FormDescription className="text-xs">
                        El usuario debe completar este campo
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={formField.value}
                        onCheckedChange={formField.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="disabled"
                render={({ field: formField }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Deshabilitado</FormLabel>
                      <FormDescription className="text-xs">
                        El campo no será editable
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={formField.value || false}
                        onCheckedChange={formField.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hidden"
                render={({ field: formField }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Oculto</FormLabel>
                      <FormDescription className="text-xs">
                        El campo no será visible
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={formField.value || false}
                        onCheckedChange={formField.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}

/**
 * Renderiza campos específicos según el tipo de campo
 */
const renderTypeSpecificFields = (field: Field, form: ReturnType<typeof useForm<FieldFormValues>>) => {
  switch (field.type) {
    case FieldType.TEXT:
    case FieldType.EMAIL:
    case FieldType.PHONE:
    case FieldType.URL:
      return <TextValidationFields form={form} />

    case FieldType.TEXTAREA:
      return (
        <>
          <TextareaSpecificFields form={form} />
          <TextValidationFields form={form} />
        </>
      )

    case FieldType.NUMBER:
      return <NumberValidationFields form={form} />

    case FieldType.DATE:
    case FieldType.TIME:
    case FieldType.DATETIME:
      return <DateValidationFields form={form} />

    case FieldType.SELECT:
    case FieldType.MULTISELECT:
    case FieldType.RADIO:
    case FieldType.CHECKBOX:
      return <SelectOptionsFields form={form} field={field} />

    case FieldType.FILE:
    case FieldType.PHOTO:
      return <FileValidationFields form={form} />

    case FieldType.SIGNATURE:
      return <SignatureFields form={form} />

    default:
      return null
  }
}

/**
 * Campos de validación para texto
 */
const TextValidationFields = ({ form }: { form: ReturnType<typeof useForm<FieldFormValues>> }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-foreground">Validaciones</h3>
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="validations.minLength"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Longitud mínima</FormLabel>
            <FormControl>
              <Input
                {...formField}
                type="number"
                min={0}
                onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="validations.maxLength"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Longitud máxima</FormLabel>
            <FormControl>
              <Input
                {...formField}
                type="number"
                min={1}
                onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
)

/**
 * Campos específicos para textarea
 */
const TextareaSpecificFields = ({ form }: { form: ReturnType<typeof useForm<FieldFormValues>> }) => (
  <FormField
    control={form.control}
    name="rows"
    render={({ field: formField }) => (
      <FormItem>
        <FormLabel>Filas</FormLabel>
        <FormControl>
          <Input
            {...formField}
            type="number"
            min={1}
            max={20}
            onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
          />
        </FormControl>
        <FormDescription>Número de filas visibles por defecto</FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
)

/**
 * Campos de validación para números
 */
const NumberValidationFields = ({ form }: { form: ReturnType<typeof useForm<FieldFormValues>> }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-foreground">Validaciones</h3>
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="validations.min"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Valor mínimo</FormLabel>
            <FormControl>
              <Input
                {...formField}
                type="number"
                step="any"
                onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="validations.max"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Valor máximo</FormLabel>
            <FormControl>
              <Input
                {...formField}
                type="number"
                step="any"
                onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <FormField
      control={form.control}
      name="validations.step"
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>Incremento (step)</FormLabel>
          <FormControl>
            <Input
              {...formField}
              type="number"
              min={0.0001}
              step="any"
              onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
            />
          </FormControl>
          <FormDescription>Incremento permitido entre valores</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
)

/**
 * Campos de validación para fechas
 */
const DateValidationFields = ({ form }: { form: ReturnType<typeof useForm<FieldFormValues>> }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-foreground">Validaciones</h3>
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="validations.minDate"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Fecha mínima</FormLabel>
            <FormControl>
              <Input {...formField} type="date" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="validations.maxDate"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Fecha máxima</FormLabel>
            <FormControl>
              <Input {...formField} type="date" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
)

/**
 * Campos para opciones de selección
 */
const SelectOptionsFields = ({
  form,
}: {
  form: ReturnType<typeof useForm<FieldFormValues>>
  field?: Field
}) => {
  const options = form.watch('options') || []

  const addOption = useCallback(() => {
    const newOptions = [
      ...options,
      { value: `opcion_${options.length + 1}`, label: `Opción ${options.length + 1}` },
    ]
    form.setValue('options', newOptions)
  }, [options, form])

  const removeOption = useCallback(
    (index: number) => {
      const newOptions = options.filter((_, i) => i !== index)
      form.setValue('options', newOptions)
    },
    [options, form],
  )

  const updateOption = useCallback(
    (index: number, key: 'value' | 'label', value: string) => {
      const newOptions = [...options]
      newOptions[index] = { ...newOptions[index], [key]: value }
      form.setValue('options', newOptions)
    },
    [options, form],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Opciones</h3>
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-start gap-2">
              <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 space-y-2">
                <Input
                  value={option.value}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  placeholder="Valor"
                />
                <Input
                  value={option.label}
                  onChange={(e) => updateOption(index, 'label', e.target.value)}
                  placeholder="Etiqueta"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOption(index)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {options.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No hay opciones. Agrega al menos una.
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Campos de validación para archivos
 */
const FileValidationFields = ({ form }: { form: ReturnType<typeof useForm<FieldFormValues>> }) => (
  <div className="space-y-4">
    <FormField
      control={form.control}
      name="multiple"
      render={({ field: formField }) => (
        <FormItem className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3">
          <div className="space-y-0.5">
            <FormLabel>Múltiples archivos</FormLabel>
            <FormDescription className="text-xs">
              Permitir seleccionar múltiples archivos
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={formField.value || false}
              onCheckedChange={formField.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />

    <h3 className="text-sm font-semibold text-foreground">Validaciones</h3>
    <FormField
      control={form.control}
      name="validations.maxFileSize"
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>Tamaño máximo (MB)</FormLabel>
          <FormControl>
            <Input
              {...formField}
              type="number"
              min={0.1}
              max={1000}
              step={0.1}
              onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
)

/**
 * Campos específicos para firma
 */
const SignatureFields = ({ form }: { form: ReturnType<typeof useForm<FieldFormValues>> }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-foreground">Dimensiones</h3>
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="width"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Ancho (px)</FormLabel>
            <FormControl>
              <Input
                {...formField}
                type="number"
                min={100}
                max={2000}
                onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="height"
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>Alto (px)</FormLabel>
            <FormControl>
              <Input
                {...formField}
                type="number"
                min={50}
                max={2000}
                onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
)

/**
 * Obtiene los valores por defecto del formulario desde un campo
 */
const getDefaultValues = (field: Field): FieldFormValues => {
  const base = {
    label: field.label,
    placeholder: field.placeholder || '',
    helperText: field.helperText || '',
    required: field.required,
    disabled: field.disabled || false,
    hidden: field.hidden || false,
  }

  switch (field.type) {
    case FieldType.TEXTAREA:
      return { ...base, rows: 'rows' in field ? field.rows : undefined }
    case FieldType.SELECT:
    case FieldType.MULTISELECT:
    case FieldType.RADIO:
    case FieldType.CHECKBOX:
      return { ...base, options: 'options' in field ? field.options || [] : [] }
    case FieldType.FILE:
    case FieldType.PHOTO:
      return { ...base, multiple: 'multiple' in field ? field.multiple : false }
    case FieldType.SIGNATURE:
      return {
        ...base,
        width: 'width' in field ? field.width : undefined,
        height: 'height' in field ? field.height : undefined,
      }
    default:
      return { ...base, validations: field.validations }
  }
}

/**
 * Construye un campo actualizado desde los valores del formulario
 */
const buildFieldFromFormValues = (originalField: Field, values: FieldFormValues): Field => {
  return {
    ...originalField,
    ...values,
  } as Field
}

export default FieldPropertiesPanel
