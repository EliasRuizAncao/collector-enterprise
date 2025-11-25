/**
 * Utilidades comunes para inputs mobile
 */

import { cn } from '@/shared/lib/utils'

/**
 * Clases base para inputs mobile
 */
export const inputBaseClasses = cn(
  'min-h-[56px] w-full rounded-xl border bg-background px-4 py-3 text-base',
  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-all duration-200',
)

/**
 * Clases para estado de error
 */
export const inputErrorClasses = 'border-destructive focus:ring-destructive'

/**
 * Clases para estado de éxito
 */
export const inputSuccessClasses = 'border-green-500 focus:ring-green-500'

/**
 * Clases para estado de warning
 */
export const inputWarningClasses = 'border-amber-500 focus:ring-amber-500'

/**
 * Clases para estado de info
 */
export const inputInfoClasses = 'border-blue-500 focus:ring-blue-500'

/**
 * Función para obtener clases según el estado del input
 */
export const getInputStateClasses = (
  error?: string,
  success?: boolean,
  warning?: boolean,
  info?: boolean,
): string => {
  if (error) return inputErrorClasses
  if (success) return inputSuccessClasses
  if (warning) return inputWarningClasses
  if (info) return inputInfoClasses
  return 'border-input'
}

/**
 * Formatear número con separadores de miles
 */
export const formatNumber = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return ''
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return String(value)
  return num.toLocaleString('es-CL')
}

/**
 * Parsear número formateado
 */
export const parseFormattedNumber = (value: string): number => {
  if (!value) return 0
  // Remover separadores de miles
  const cleaned = value.replace(/[.,]/g, (match, offset) => {
    // Si hay más caracteres después, es separador de miles
    return offset < value.length - 3 ? '' : match
  })
  return parseFloat(cleaned) || 0
}

/**
 * Formatear fecha a DD/MM/YYYY
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  
  return `${day}/${month}/${year}`
}

/**
 * Parsear fecha desde DD/MM/YYYY
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null
  
  const parts = dateString.split('/')
  if (parts.length !== 3) return null
  
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)
  
  const date = new Date(year, month, day)
  if (isNaN(date.getTime())) return null
  
  return date
}

/**
 * Formatear hora a HH:MM (24h)
 */
export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  
  return `${hours}:${minutes}`
}

/**
 * Obtener input mode según tipo de campo
 */
export const getInputMode = (type: 'text' | 'email' | 'tel' | 'url' | 'number'): 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' => {
  switch (type) {
    case 'email':
      return 'email'
    case 'tel':
      return 'tel'
    case 'url':
      return 'url'
    case 'number':
      return 'numeric'
    default:
      return 'text'
  }
}

/**
 * Obtener autocomplete attribute según tipo
 */
export const getAutocomplete = (type: 'text' | 'email' | 'tel' | 'url', name?: string): string | undefined => {
  if (name) {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('email')) return 'email'
    if (lowerName.includes('phone') || lowerName.includes('tel')) return 'tel'
    if (lowerName.includes('url') || lowerName.includes('website')) return 'url'
    if (lowerName.includes('name')) return 'name'
    if (lowerName.includes('address')) return 'street-address'
  }
  
  switch (type) {
    case 'email':
      return 'email'
    case 'tel':
      return 'tel'
    case 'url':
      return 'url'
    default:
      return undefined
  }
}

