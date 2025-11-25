import { z } from 'zod'
import { FormStatus } from '@prisma/client'

/**
 * Enum de tipos de campo válidos
 */
const FieldTypeEnum = z.enum([
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'EMAIL',
  'PHONE',
  'URL',
  'DATE',
  'TIME',
  'DATETIME',
  'SELECT',
  'MULTISELECT',
  'RADIO',
  'CHECKBOX',
  'SIGNATURE',
  'FILE',
  'PHOTO',
])

/**
 * Schema para validar una opción de selección
 */
const selectOptionSchema = z.object({
  value: z.string().min(1, 'El valor de la opción es obligatorio'),
  label: z.string().min(1, 'La etiqueta de la opción es obligatoria'),
  disabled: z.boolean().optional(),
})

/**
 * Schema base para validaciones de campos (sin refinements)
 */
const baseFieldValidationsSchema = z.object({
  minLength: z.number().int().min(0).max(10000).optional(),
  maxLength: z.number().int().min(1).max(10000).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().min(0.0001).optional(),
  pattern: z.string().optional(),
  patternMessage: z.string().optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  acceptedFileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().min(0.1).max(1000).optional(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1).optional(),
})

/**
 * Schema para validaciones de campos con refinements
 */
const fieldValidationsSchema = baseFieldValidationsSchema
  .refine(
    (data) => {
      // Validar que minLength < maxLength si ambos existen
      if (data.minLength !== undefined && data.maxLength !== undefined) {
        return data.minLength <= data.maxLength
      }
      return true
    },
    {
      message: 'La longitud mínima debe ser menor o igual a la máxima',
      path: ['minLength'],
    },
  )
  .refine(
    (data) => {
      // Validar que min < max si ambos existen
      if (data.min !== undefined && data.max !== undefined) {
        return data.min <= data.max
      }
      return true
    },
    {
      message: 'El valor mínimo debe ser menor o igual al máximo',
      path: ['min'],
    },
  )
  .refine(
    (data) => {
      // Validar que minDate < maxDate si ambos existen
      if (data.minDate && data.maxDate) {
        return new Date(data.minDate) <= new Date(data.maxDate)
      }
      return true
    },
    {
      message: 'La fecha mínima debe ser anterior o igual a la máxima',
      path: ['minDate'],
    },
  )
  .refine(
    (data) => {
      // Validar que minSelections < maxSelections si ambos existen
      if (data.minSelections !== undefined && data.maxSelections !== undefined) {
        return data.minSelections <= data.maxSelections
      }
      return true
    },
    {
      message: 'El mínimo de selecciones debe ser menor o igual al máximo',
      path: ['minSelections'],
    },
  )

/**
 * Schema base para un campo
 * Contiene las propiedades comunes a todos los tipos de campos
 */
const baseFieldSchema = z.object({
  id: z.string().min(1, 'El ID del campo es obligatorio'),
  type: FieldTypeEnum,
  label: z.string().min(1, 'La etiqueta del campo es obligatoria').max(200, 'La etiqueta no puede superar los 200 caracteres'),
  placeholder: z.string().max(500, 'El placeholder no puede superar los 500 caracteres').optional(),
  required: z.boolean(),
  order: z.number().int().min(0, 'El orden debe ser mayor o igual a 0'),
  helperText: z.string().max(1000, 'El texto de ayuda no puede superar los 1000 caracteres').optional(),
  validations: fieldValidationsSchema.optional(),
  disabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
})

/**
 * Schema para campos de texto (TEXT, EMAIL, PHONE, URL)
 */
const textFieldSchema = baseFieldSchema.extend({
  type: z.enum(['TEXT', 'EMAIL', 'PHONE', 'URL']),
  validations: baseFieldValidationsSchema
    .extend({
      minLength: z.number().int().min(0).max(10000).optional(),
      maxLength: z.number().int().min(1).max(10000).optional(),
      pattern: z.string().optional(),
      patternMessage: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.minLength !== undefined && data.maxLength !== undefined) {
          return data.minLength <= data.maxLength
        }
        return true
      },
      {
        message: 'La longitud mínima debe ser menor o igual a la máxima',
        path: ['minLength'],
      },
    )
    .optional(),
})

/**
 * Schema para campo de texto largo (TEXTAREA)
 */
const textareaFieldSchema = baseFieldSchema.extend({
  type: z.literal('TEXTAREA'),
  rows: z.number().int().min(1).max(20).optional(),
  validations: baseFieldValidationsSchema
    .extend({
      minLength: z.number().int().min(0).max(50000).optional(),
      maxLength: z.number().int().min(1).max(50000).optional(),
    })
    .refine(
      (data) => {
        if (data.minLength !== undefined && data.maxLength !== undefined) {
          return data.minLength <= data.maxLength
        }
        return true
      },
      {
        message: 'La longitud mínima debe ser menor o igual a la máxima',
        path: ['minLength'],
      },
    )
    .optional(),
})

/**
 * Schema para campo numérico (NUMBER)
 */
const numberFieldSchema = baseFieldSchema.extend({
  type: z.literal('NUMBER'),
  validations: baseFieldValidationsSchema
    .extend({
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().min(0.0001).optional(),
    })
    .refine(
      (data) => {
        if (data.min !== undefined && data.max !== undefined) {
          return data.min <= data.max
        }
        return true
      },
      {
        message: 'El valor mínimo debe ser menor o igual al máximo',
        path: ['min'],
      },
    )
    .optional(),
})

/**
 * Schema para campos de fecha (DATE, TIME, DATETIME)
 */
const dateFieldSchema = baseFieldSchema.extend({
  type: z.enum(['DATE', 'TIME', 'DATETIME']),
  validations: baseFieldValidationsSchema
    .extend({
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.minDate && data.maxDate) {
          return new Date(data.minDate) <= new Date(data.maxDate)
        }
        return true
      },
      {
        message: 'La fecha mínima debe ser anterior o igual a la máxima',
        path: ['minDate'],
      },
    )
    .optional(),
})

/**
 * Schema para campos de selección (SELECT, MULTISELECT, RADIO, CHECKBOX)
 */
const selectFieldSchema = baseFieldSchema.extend({
  type: z.enum(['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX']),
  options: z
    .array(selectOptionSchema)
    .min(1, 'Los campos de selección deben tener al menos una opción'),
  validations: baseFieldValidationsSchema
    .extend({
      minSelections: z.number().int().min(0).optional(),
      maxSelections: z.number().int().min(1).optional(),
    })
    .refine(
      (data) => {
        if (data.minSelections !== undefined && data.maxSelections !== undefined) {
          return data.minSelections <= data.maxSelections
        }
        return true
      },
      {
        message: 'El mínimo de selecciones debe ser menor o igual al máximo',
        path: ['minSelections'],
      },
    )
    .optional(),
  checkboxLabel: z.string().optional(), // Solo para CHECKBOX cuando es casilla única
})

/**
 * Schema para campo de firma (SIGNATURE)
 */
const signatureFieldSchema = baseFieldSchema.extend({
  type: z.literal('SIGNATURE'),
  width: z.number().int().min(100).max(2000).optional(),
  height: z.number().int().min(50).max(2000).optional(),
})

/**
 * Schema para campos de archivo (FILE, PHOTO)
 */
const fileFieldSchema = baseFieldSchema.extend({
  type: z.enum(['FILE', 'PHOTO']),
  multiple: z.boolean().optional(),
  validations: baseFieldValidationsSchema
    .extend({
      acceptedFileTypes: z.array(z.string()).optional(),
      maxFileSize: z.number().min(0.1).max(1000).optional(),
    })
    .optional(),
})

/**
 * Schema unificado para validar cualquier tipo de campo
 * Usa discriminated union basado en el tipo
 */
export const fieldSchema: z.ZodTypeAny = z.discriminatedUnion('type', [
  textFieldSchema,
  textareaFieldSchema,
  numberFieldSchema,
  dateFieldSchema,
  selectFieldSchema,
  signatureFieldSchema,
  fileFieldSchema,
])

/**
 * Schema para crear un formulario
 */
export const createFormSchema = z
  .object({
    title: z
      .string()
      .min(1, 'El título es obligatorio')
      .max(200, 'El título no puede superar los 200 caracteres'),
    description: z
      .string()
      .max(1000, 'La descripción no puede superar los 1000 caracteres')
      .optional()
      .or(z.literal('')),
    fields: z.array(fieldSchema).min(0, 'El formulario debe tener al menos 0 campos'),
  })
  .refine(
    (data) => {
      // Validar que no haya IDs duplicados en los campos
      const ids = data.fields.map((field) => (field as { id: string }).id)
      const uniqueIds = new Set(ids)
      return ids.length === uniqueIds.size
    },
    {
      message: 'No puede haber campos con IDs duplicados',
      path: ['fields'],
    },
  )
  .refine(
    (data) => {
      // Validar que no haya órdenes duplicados
      const orders = data.fields.map((field) => (field as { order: number }).order)
      const uniqueOrders = new Set(orders)
      return orders.length === uniqueOrders.size
    },
    {
      message: 'No puede haber campos con el mismo orden',
      path: ['fields'],
    },
  )

/**
 * Schema para actualizar un formulario
 * Todos los campos son opcionales excepto que se validen si se proporcionan
 */
export const updateFormSchema = z
  .object({
    title: z
      .string()
      .min(1, 'El título es obligatorio')
      .max(200, 'El título no puede superar los 200 caracteres')
      .optional(),
    description: z
      .string()
      .max(1000, 'La descripción no puede superar los 1000 caracteres')
      .optional()
      .or(z.literal('')),
    fields: z.array(fieldSchema).min(0, 'El formulario debe tener al menos 0 campos').optional(),
    incrementVersion: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Si se proporcionan fields, validar que no haya IDs duplicados
      if (data.fields) {
        const ids = data.fields.map((field) => (field as { id: string }).id)
        const uniqueIds = new Set(ids)
        return ids.length === uniqueIds.size
      }
      return true
    },
    {
      message: 'No puede haber campos con IDs duplicados',
      path: ['fields'],
    },
  )
  .refine(
    (data) => {
      // Si se proporcionan fields, validar que no haya órdenes duplicados
      if (data.fields) {
        const orders = data.fields.map((field) => (field as { order: number }).order)
        const uniqueOrders = new Set(orders)
        return orders.length === uniqueOrders.size
      }
      return true
    },
    {
      message: 'No puede haber campos con el mismo orden',
      path: ['fields'],
    },
  )

/**
 * Schema para query params de listado de formularios
 */
export const listFormsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(FormStatus).optional(),
  search: z.string().optional(),
})

/**
 * Tipos inferidos de los schemas
 */
export type CreateFormInput = z.infer<typeof createFormSchema>
export type UpdateFormInput = z.infer<typeof updateFormSchema>
export type FieldInput = z.infer<typeof fieldSchema>
export type ListFormsQuery = z.infer<typeof listFormsQuerySchema>

