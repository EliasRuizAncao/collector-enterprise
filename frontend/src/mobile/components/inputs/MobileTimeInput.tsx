/**
 * MobileTimeInput - Input de hora con native picker y quick selects
 */

import { useState, useRef, useEffect } from 'react'
import { Clock, X, AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { inputBaseClasses, getInputStateClasses, formatTime } from './inputUtils'
import './inputStyles.css'

export interface MobileTimeInputProps {
  /** Valor del input (Date o string HH:MM) */
  value: Date | string | null
  /** Callback cuando cambia el valor */
  onChange: (value: Date | null) => void
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
  /** Si mostrar quick selects */
  showQuickSelects?: boolean
  /** Formato 12h o 24h */
  format12h?: boolean
  /** ID del campo */
  id?: string
  /** Name del campo */
  name?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileTimeInput = ({
  value,
  onChange,
  label,
  placeholder = 'Selecciona una hora',
  helperText,
  error,
  required = false,
  disabled = false,
  showQuickSelects = true,
  format12h = false,
  id,
  name,
  onBlur,
  onFocus,
}: MobileTimeInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasShaken, setHasShaken] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Convertir value a string para el input (HH:MM)
  const getInputValue = (): string => {
    if (!value) return ''
    
    if (typeof value === 'string') {
      // Si ya es string, verificar formato
      if (value.match(/^\d{2}:\d{2}$/)) {
        return value
      }
      // Intentar parsear como Date
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return formatTime(date)
      }
      return ''
    }
    
    if (value instanceof Date) {
      return formatTime(value)
    }
    
    return ''
  }

  // Shake animation cuando hay error
  useEffect(() => {
    if (error && !hasShaken) {
      setHasShaken(true)
      const timer = setTimeout(() => setHasShaken(false), 400)
      return () => clearTimeout(timer)
    }
  }, [error, hasShaken])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeString = e.target.value
    if (!timeString) {
      onChange(null)
      return
    }

    // Crear Date con la hora seleccionada (usar fecha de hoy)
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    
    if (!isNaN(date.getTime())) {
      onChange(date)
    }
  }

  const handleClear = () => {
    onChange(null)
    inputRef.current?.focus()
  }

  const handleQuickSelect = (minutes: number) => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + minutes)
    onChange(now)
  }

  const formatTime12h = (date: Date): string => {
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12 // 0 debería ser 12
    const minutesStr = String(minutes).padStart(2, '0')
    return `${hours}:${minutesStr} ${ampm}`
  }

  const inputId = id || `mobile-time-input-${name || Math.random().toString(36).substr(2, 9)}`
  const displayValue = value
    ? format12h && value instanceof Date
      ? formatTime12h(value)
      : formatTime(typeof value === 'string' ? new Date(`2000-01-01T${value}`) : value)
    : ''
  const showClearButton = value && !disabled && isFocused

  return (
    <div className="mobile-input-container">
      {label && (
        <label htmlFor={inputId} className="mobile-input-label">
          {label}
          {required && <span className="mobile-input-label-required">*</span>}
        </label>
      )}

      <div className="space-y-2">
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            type="time"
            value={getInputValue()}
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
              showClearButton && 'pr-10',
            )}
          />

          {/* Icono de reloj */}
          {!showClearButton && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <Clock className="h-5 w-5" />
            </div>
          )}

          {/* Clear button */}
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Limpiar hora"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick selects */}
        {showQuickSelects && !disabled && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(0)}
              className="text-xs"
            >
              Ahora
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(30)}
              className="text-xs"
            >
              +30 min
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(60)}
              className="text-xs"
            >
              +1 hora
            </Button>
          </div>
        )}

        {/* Display value */}
        {displayValue && (
          <p className="text-sm text-muted-foreground">Hora seleccionada: {displayValue}</p>
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
    </div>
  )
}

export default MobileTimeInput

