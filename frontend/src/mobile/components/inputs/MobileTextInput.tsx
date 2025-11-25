/**
 * MobileTextInput - Input de texto optimizado para mobile
 * Soporta: text, email, tel, url
 */

import { useState, useRef, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { inputBaseClasses, getInputStateClasses, getInputMode, getAutocomplete } from './inputUtils'
import './inputStyles.css'

export interface MobileTextInputProps {
  /** Valor del input */
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
  /** Tipo de input */
  type?: 'text' | 'email' | 'tel' | 'url'
  /** Longitud máxima */
  maxLength?: number
  /** Si mostrar checkmark de éxito */
  showSuccess?: boolean
  /** Si el campo es válido */
  isValid?: boolean
  /** Autocomplete attribute */
  autoComplete?: string
  /** Name del campo (para autocomplete) */
  name?: string
  /** ID del campo */
  id?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileTextInput = ({
  value,
  onChange,
  label,
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  type = 'text',
  maxLength,
  showSuccess = false,
  isValid = false,
  autoComplete,
  name,
  id,
  onBlur,
  onFocus,
}: MobileTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasShaken, setHasShaken] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Shake animation cuando hay error
  useEffect(() => {
    if (error && !hasShaken) {
      setHasShaken(true)
      const timer = setTimeout(() => setHasShaken(false), 400)
      return () => clearTimeout(timer)
    }
  }, [error, hasShaken])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength)
    }
    onChange(newValue)
  }

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  const inputId = id || `mobile-text-input-${name || Math.random().toString(36).substr(2, 9)}`
  const showClearButton = value && !disabled && isFocused
  const showSuccessIcon = showSuccess && isValid && value && !error

  return (
    <div className="mobile-input-container">
      {label && (
        <label htmlFor={inputId} className="mobile-input-label">
          {label}
          {required && <span className="mobile-input-label-required">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type={type}
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
          autoComplete={autoComplete || getAutocomplete(type, name)}
          inputMode={getInputMode(type)}
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
            getInputStateClasses(error, showSuccessIcon, false, false),
            hasShaken && error && 'input-shake',
            showClearButton && 'pr-10',
            showSuccessIcon && 'pr-10',
          )}
        />

        {/* Clear button */}
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Limpiar campo"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Success icon */}
        {showSuccessIcon && !showClearButton && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
      </div>

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

export default MobileTextInput

