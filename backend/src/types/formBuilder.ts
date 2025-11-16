/**
 * Tipos TypeScript para el constructor de formularios dinámicos
 * Collector Enterprise - Amaranto Constructora
 * Backend types
 */

/**
 * Enum con todos los tipos de campos disponibles
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
 * Validaciones disponibles para los campos
 */
export interface FieldValidations {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  step?: number
  pattern?: string
  patternMessage?: string
  minDate?: string
  maxDate?: string
  acceptedFileTypes?: string[]
  maxFileSize?: number
  minSelections?: number
  maxSelections?: number
}

/**
 * Opción para campos de selección
 */
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/**
 * Campo base que comparten todos los tipos de campos
 */
export interface BaseField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  order: number
  helperText?: string
  validations?: FieldValidations
  disabled?: boolean
  hidden?: boolean
  defaultValue?: unknown
}

/**
 * Campo de texto corto
 */
export interface TextField extends BaseField {
  type: 'TEXT'
  defaultValue?: string
}

/**
 * Campo de texto largo
 */
export interface TextareaField extends BaseField {
  type: 'TEXTAREA'
  rows?: number
  defaultValue?: string
}

/**
 * Campo numérico
 */
export interface NumberField extends BaseField {
  type: 'NUMBER'
  defaultValue?: number
}

/**
 * Campo de correo electrónico
 */
export interface EmailField extends BaseField {
  type: 'EMAIL'
  defaultValue?: string
}

/**
 * Campo de teléfono
 */
export interface PhoneField extends BaseField {
  type: 'PHONE'
  defaultValue?: string
}

/**
 * Campo de URL
 */
export interface UrlField extends BaseField {
  type: 'URL'
  defaultValue?: string
}

/**
 * Campo de fecha
 */
export interface DateField extends BaseField {
  type: 'DATE'
  defaultValue?: string
}

/**
 * Campo de hora
 */
export interface TimeField extends BaseField {
  type: 'TIME'
  defaultValue?: string
}

/**
 * Campo de fecha y hora
 */
export interface DateTimeField extends BaseField {
  type: 'DATETIME'
  defaultValue?: string
}

/**
 * Campo de selección única
 */
export interface SelectField extends BaseField {
  type: 'SELECT'
  options: SelectOption[]
  defaultValue?: string
}

/**
 * Campo de selección múltiple
 */
export interface MultiselectField extends BaseField {
  type: 'MULTISELECT'
  options: SelectOption[]
  defaultValue?: string[]
}

/**
 * Campo de botones de radio
 */
export interface RadioField extends BaseField {
  type: 'RADIO'
  options: SelectOption[]
  orientation?: 'horizontal' | 'vertical'
  defaultValue?: string
}

/**
 * Campo de casilla de verificación
 */
export interface CheckboxField extends BaseField {
  type: 'CHECKBOX'
  checkboxLabel?: string
  options?: SelectOption[]
  defaultValue?: boolean | string[]
}

/**
 * Campo de firma digital
 */
export interface SignatureField extends BaseField {
  type: 'SIGNATURE'
  width?: number
  height?: number
  defaultValue?: string
}

/**
 * Campo de carga de archivo
 */
export interface FileField extends BaseField {
  type: 'FILE'
  multiple?: boolean
  defaultValue?: string[]
}

/**
 * Campo de carga de foto/imagen
 */
export interface PhotoField extends BaseField {
  type: 'PHOTO'
  multiple?: boolean
  allowCamera?: boolean
  defaultValue?: string[]
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

