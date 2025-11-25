/**
 * MobileTextarea - Textarea optimizado para mobile
 * Auto-resize según contenido con max height y scroll
 */

import { useState, useRef, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { inputBaseClasses, getInputStateClasses } from './inputUtils'
import './inputStyles.css'

export interface MobileTextareaProps {
  /** Valor del textarea */
  value: string
  /** Callback cuando cambia el valor */
  onChange: (value: string) => void
  /** Label del campo */
  label?: string
  /** Placeholder */
  placeholder?: string
  /** Texto de ayuda */
  helperText?: string
  /** Mensaje de error */
  error?: string
  /** Si el campo es requerido */
  required?: boolean
  /** Si el campo está deshabilitado */
  disabled?: boolean
  /** Número de filas iniciales */
  rows?: number
  /** Longitud máxima */
  maxLength?: number
  /** Altura máxima en píxeles */
  maxHeight?: number
  /** ID del campo */
  id?: string
  /** Name del campo */
  name?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileTextarea = ({
  value,
  onChange,
  label,
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  rows = 3,
  maxLength,
  maxHeight = 300,
  id,
  name,
  onBlur,
  onFocus,
}: MobileTextareaProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasShaken, setHasShaken] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Shake animation cuando hay error
  useEffect(() => {
    if (error && !hasShaken) {
      setHasShaken(true)
      const timer = setTimeout(() => setHasShaken(false), 400)
      return () => clearTimeout(timer)
    }
  }, [error, hasShaken])

  // Auto-resize
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto para obtener el scrollHeight correcto
    textarea.style.height = 'auto'
    
    // Calcular nueva altura
    const scrollHeight = textarea.scrollHeight
    const newHeight = Math.min(scrollHeight, maxHeight)
    
    textarea.style.height = `${newHeight}px`
    
    // Si excede maxHeight, habilitar scroll
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto'
    } else {
      textarea.style.overflowY = 'hidden'
    }
  }, [value, maxHeight])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength)
    }
    onChange(newValue)
  }

  const inputId = id || `mobile-textarea-${name || Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="mobile-input-container">
      {label && (
        <label htmlFor={inputId} className="mobile-input-label">
          {label}
          {required && <span className="mobile-input-label-required">*</span>}
        </label>
      )}

      <textarea
        ref={textareaRef}
        id={inputId}
        value={value}
        onChange={handleChange}
        onBlur={(e) => {
          setIsFocused(false)
          onBlur?.()
        }}
        onFocus={(e) => {
          setIsFocused(true)
          onFocus?.()
        }}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${inputId}-error`
            : helperText
              ? `${inputId}-helper`
              : undefined
        }
        className={cn(
          inputBaseClasses,
          getInputStateClasses(error, false, false, false),
          hasShaken && error && 'input-shake',
          'resize-none min-h-[56px]',
        )}
        style={{ maxHeight: `${maxHeight}px` }}
      />

      {/* Helper text */}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mobile-input-helper">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <div id={`${inputId}-error`} className="mobile-input-error" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Character counter */}
      {maxLength && (
        <div
          className={cn(
            'mobile-input-counter',
            value.length > maxLength * 0.9 && 'mobile-input-counter-warning',
            value.length >= maxLength && 'mobile-input-counter-error',
          )}
        >
          {value.length} / {maxLength}
        </div>
      )}
    </div>
  )
}

export default MobileTextarea

