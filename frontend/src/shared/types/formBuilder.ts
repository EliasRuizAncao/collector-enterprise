/**
 * Tipos TypeScript para el constructor de formularios dinámicos
 * Collector Enterprise - Amaranto Constructora
 */

/**
 * Tipo con todos los tipos de campos disponibles en el constructor
 */
export type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'SELECT'
  | 'MULTISELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'SIGNATURE'
  | 'FILE'
  | 'PHOTO'

/**
 * Constantes para FieldType (para uso en comparaciones y valores literales)
 */
export const FieldType = {
  TEXT: 'TEXT' as const,
  TEXTAREA: 'TEXTAREA' as const,
  NUMBER: 'NUMBER' as const,
  EMAIL: 'EMAIL' as const,
  PHONE: 'PHONE' as const,
  URL: 'URL' as const,
  DATE: 'DATE' as const,
  TIME: 'TIME' as const,
  DATETIME: 'DATETIME' as const,
  SELECT: 'SELECT' as const,
  MULTISELECT: 'MULTISELECT' as const,
  RADIO: 'RADIO' as const,
  CHECKBOX: 'CHECKBOX' as const,
  SIGNATURE: 'SIGNATURE' as const,
  FILE: 'FILE' as const,
  PHOTO: 'PHOTO' as const,
} as const

/**
 * Estado del formulario
 */
export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

/**
 * Constantes para FormStatus (para uso en comparaciones y valores literales)
 */
export const FormStatus = {
  DRAFT: 'DRAFT' as const,
  PUBLISHED: 'PUBLISHED' as const,
  ARCHIVED: 'ARCHIVED' as const,
} as const

/**
 * Validaciones disponibles para los campos
 */
export interface FieldValidations {
  /** Longitud mínima (para campos de texto) */
  minLength?: number
  /** Longitud máxima (para campos de texto) */
  maxLength?: number
  /** Valor mínimo (para campos numéricos) */
  min?: number
  /** Valor máximo (para campos numéricos) */
  max?: number
  /** Incremento/paso (para campos numéricos) */
  step?: number
  /** Patrón regex personalizado */
  pattern?: string
  /** Mensaje de error personalizado para el patrón */
  patternMessage?: string
  /** Fecha mínima (para campos de fecha) */
  minDate?: string
  /** Fecha máxima (para campos de fecha) */
  maxDate?: string
  /** Tipos de archivo permitidos (para FILE, PHOTO) */
  acceptedFileTypes?: string[]
  /** Tamaño máximo del archivo en MB (para FILE, PHOTO) */
  maxFileSize?: number
  /** Número mínimo de opciones seleccionadas (para MULTISELECT) */
  minSelections?: number
  /** Número máximo de opciones seleccionadas (para MULTISELECT) */
  maxSelections?: number
}

/**
 * Opción para campos de selección (SELECT, MULTISELECT, RADIO)
 */
export interface SelectOption {
  /** Valor único de la opción */
  value: string
  /** Etiqueta visible para el usuario */
  label: string
  /** Si la opción está deshabilitada */
  disabled?: boolean
}

/**
 * Campo base que comparten todos los tipos de campos
 */
export interface BaseField {
  /** Identificador único del campo */
  id: string
  /** Tipo de campo */
  type: FieldType
  /** Etiqueta visible del campo */
  label: string
  /** Texto de ayuda/placeholder */
  placeholder?: string
  /** Si el campo es obligatorio */
  required: boolean
  /** Orden de visualización del campo */
  order: number
  /** Texto de ayuda adicional */
  helperText?: string
  /** Validaciones específicas del campo */
  validations?: FieldValidations
  /** Si el campo está deshabilitado */
  disabled?: boolean
  /** Si el campo está oculto */
  hidden?: boolean
  /** Valor por defecto del campo */
  defaultValue?: unknown
}

/**
 * Campo de texto corto (una línea)
 */
export interface TextField extends BaseField {
  type: 'TEXT'
  validations?: FieldValidations & {
    minLength?: number
    maxLength?: number
    pattern?: string
    patternMessage?: string
  }
  defaultValue?: string
}

/**
 * Campo de texto largo (múltiples líneas)
 */
export interface TextareaField extends BaseField {
  type: 'TEXTAREA'
  validations?: FieldValidations & {
    minLength?: number
    maxLength?: number
  }
  /** Número de filas por defecto */
  rows?: number
  defaultValue?: string
}

/**
 * Campo numérico
 */
export interface NumberField extends BaseField {
  type: 'NUMBER'
  validations?: FieldValidations & {
    min?: number
    max?: number
    step?: number
  }
  defaultValue?: number
}

/**
 * Campo de correo electrónico
 */
export interface EmailField extends BaseField {
  type: 'EMAIL'
  validations?: FieldValidations & {
    maxLength?: number
  }
  defaultValue?: string
}

/**
 * Campo de teléfono
 */
export interface PhoneField extends BaseField {
  type: 'PHONE'
  validations?: FieldValidations & {
    pattern?: string
    patternMessage?: string
  }
  defaultValue?: string
}

/**
 * Campo de URL
 */
export interface UrlField extends BaseField {
  type: 'URL'
  validations?: FieldValidations & {
    maxLength?: number
  }
  defaultValue?: string
}

/**
 * Campo de fecha
 */
export interface DateField extends BaseField {
  type: 'DATE'
  validations?: FieldValidations & {
    minDate?: string
    maxDate?: string
  }
  defaultValue?: string
}

/**
 * Campo de hora
 */
export interface TimeField extends BaseField {
  type: 'TIME'
  validations?: FieldValidations & {
    min?: string
    max?: string
  }
  defaultValue?: string
}

/**
 * Campo de fecha y hora
 */
export interface DateTimeField extends BaseField {
  type: 'DATETIME'
  validations?: FieldValidations & {
    minDate?: string
    maxDate?: string
  }
  defaultValue?: string
}

/**
 * Campo de selección única (dropdown)
 */
export interface SelectField extends BaseField {
  type: 'SELECT'
  /** Opciones disponibles para seleccionar */
  options: SelectOption[]
  defaultValue?: string
}

/**
 * Campo de selección múltiple
 */
export interface MultiselectField extends BaseField {
  type: 'MULTISELECT'
  /** Opciones disponibles para seleccionar */
  options: SelectOption[]
  validations?: FieldValidations & {
    minSelections?: number
    maxSelections?: number
  }
  defaultValue?: string[]
}

/**
 * Campo de botones de radio
 */
export interface RadioField extends BaseField {
  type: 'RADIO'
  /** Opciones disponibles para seleccionar */
  options: SelectOption[]
  /** Orientación: horizontal o vertical */
  orientation?: 'horizontal' | 'vertical'
  defaultValue?: string
}

/**
 * Campo de casilla de verificación
 */
export interface CheckboxField extends BaseField {
  type: 'CHECKBOX'
  /** Texto de la casilla (si es una sola casilla) */
  checkboxLabel?: string
  /** Si es un grupo de checkboxes, las opciones */
  options?: SelectOption[]
  defaultValue?: boolean | string[]
}

/**
 * Campo de firma digital
 */
export interface SignatureField extends BaseField {
  type: 'SIGNATURE'
  /** Ancho del área de firma en píxeles */
  width?: number
  /** Alto del área de firma en píxeles */
  height?: number
  defaultValue?: string // Base64 de la imagen
}

/**
 * Campo de carga de archivo
 */
export interface FileField extends BaseField {
  type: 'FILE'
  validations?: FieldValidations & {
    acceptedFileTypes?: string[]
    maxFileSize?: number
  }
  /** Si permite múltiples archivos */
  multiple?: boolean
  defaultValue?: string[] // URLs de los archivos
}

/**
 * Campo de carga de foto/imagen
 */
export interface PhotoField extends BaseField {
  type: 'PHOTO'
  validations?: FieldValidations & {
    acceptedFileTypes?: string[]
    maxFileSize?: number
  }
  /** Si permite múltiples fotos */
  multiple?: boolean
  /** Si permite tomar foto desde la cámara */
  allowCamera?: boolean
  defaultValue?: string[] // URLs de las fotos
}

/**
 * Unión de todos los tipos de campos posibles
 */
export type Field =
  | TextField
  | TextareaField
  | NumberField
  | EmailField
  | PhoneField
  | UrlField
  | DateField
  | TimeField
  | DateTimeField
  | SelectField
  | MultiselectField
  | RadioField
  | CheckboxField
  | SignatureField
  | FileField
  | PhotoField

/**
 * Formulario completo con todos sus campos y metadatos
 */
export interface Form {
  /** Identificador único del formulario */
  id: string
  /** Título del formulario */
  title: string
  /** Descripción del formulario */
  description?: string
  /** Campos que componen el formulario */
  fields: Field[]
  /** Versión del formulario (para versionado) */
  version: number
  /** Estado actual del formulario */
  status: FormStatus
  /** ID del usuario que creó el formulario */
  createdById: string
  /** Nombre del usuario que creó el formulario */
  createdByName?: string
  /** Fecha de creación */
  createdAt: string
  /** Fecha de última actualización */
  updatedAt: string
  /** Si el formulario está activo */
  isActive?: boolean
}

/**
 * Respuesta de un formulario completado por un usuario
 */
export interface FormResponse {
  /** Identificador único de la respuesta */
  id: string
  /** ID del formulario al que pertenece */
  formId: string
  /** ID del usuario que completó el formulario */
  userId: string
  /** Nombre del usuario que completó el formulario */
  userName?: string
  /** Datos de las respuestas (mapeo fieldId -> valor) */
  data: Record<string, unknown>
  /** Latitud (si se capturó geolocalización) */
  latitude?: number
  /** Longitud (si se capturó geolocalización) */
  longitude?: number
  /** Fecha de envío */
  submittedAt: string
}

/**
 * Asignación de formulario a un usuario
 */
export interface FormAssignment {
  /** Identificador único de la asignación */
  id: string
  /** ID del formulario asignado */
  formId: string
  /** ID del usuario asignado */
  userId: string
  /** Nombre del usuario asignado */
  userName?: string
  /** Frecuencia de asignación */
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ONCE' | 'CUSTOM'
  /** Fecha de inicio */
  startDate: string
  /** Fecha de fin (opcional) */
  endDate?: string
  /** Si la asignación está completada */
  isCompleted: boolean
  /** Fecha de creación */
  createdAt: string
}

/**
 * Tipo para crear un nuevo formulario (sin id, timestamps, etc.)
 */
export type CreateFormInput = Omit<Form, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdByName'>

/**
 * Tipo para actualizar un formulario existente
 */
export type UpdateFormInput = Partial<Omit<Form, 'id' | 'createdAt' | 'createdById' | 'version'>> & {
  /** Si se proporciona, incrementa la versión */
  incrementVersion?: boolean
}

/**
 * Tipo para crear una respuesta de formulario
 */
export type CreateFormResponseInput = {
  formId: string
  data: Record<string, unknown>
  latitude?: number | null
  longitude?: number | null
}

/**
 * Tipo para crear una asignación de formulario
 */
export type CreateFormAssignmentInput = Omit<FormAssignment, 'id' | 'createdAt' | 'isCompleted' | 'userName'>

/**
 * Utilidad para verificar si un campo es de un tipo específico
 */
export function isFieldType<T extends FieldType>(
  field: Field,
  type: T,
): field is Extract<Field, { type: T }> {
  return field.type === type
}

/**
 * Utilidad para obtener el tipo de campo de forma segura
 */
export function getFieldType(field: Field): FieldType {
  return field.type
}

/**
 * Utilidad para ordenar campos por su propiedad `order`
 */
export function sortFieldsByOrder(fields: Field[]): Field[] {
  return [...fields].sort((a, b) => a.order - b.order)
}

/**
 * Utilidad para generar un ID único para un campo
 */
export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

