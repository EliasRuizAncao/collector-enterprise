/**
 * MobileDateInput - Input de fecha con native picker y quick selects
 */

import { useState, useRef, useEffect } from 'react'
import { Calendar, X, AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { inputBaseClasses, getInputStateClasses, formatDate, parseDate } from './inputUtils'
import './inputStyles.css'

export interface MobileDateInputProps {
  /** Valor del input (Date o string ISO) */
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
  /** Fecha mínima */
  minDate?: Date | string
  /** Fecha máxima */
  maxDate?: Date | string
  /** Si mostrar quick selects */
  showQuickSelects?: boolean
  /** ID del campo */
  id?: string
  /** Name del campo */
  name?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileDateInput = ({
  value,
  onChange,
  label,
  placeholder = 'Selecciona una fecha',
  helperText,
  error,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  showQuickSelects = true,
  id,
  name,
  onBlur,
  onFocus,
}: MobileDateInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasShaken, setHasShaken] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Convertir value a string para el input
  const getInputValue = (): string => {
    if (!value) return ''
    const date = typeof value === 'string' ? new Date(value) : value
    if (isNaN(date.getTime())) return ''
    // Formato YYYY-MM-DD para input type="date"
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Convertir minDate y maxDate a string
  const getMinDate = (): string | undefined => {
    if (!minDate) return undefined
    const date = typeof minDate === 'string' ? new Date(minDate) : minDate
    if (isNaN(date.getTime())) return undefined
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getMaxDate = (): string | undefined => {
    if (!maxDate) return undefined
    const date = typeof maxDate === 'string' ? new Date(maxDate) : maxDate
    if (isNaN(date.getTime())) return undefined
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
    const dateString = e.target.value
    if (!dateString) {
      onChange(null)
      return
    }

    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      onChange(date)
    }
  }

  const handleClear = () => {
    onChange(null)
    inputRef.current?.focus()
  }

  const handleQuickSelect = (days: number) => {
    const today = new Date()
    today.setDate(today.getDate() + days)
    onChange(today)
  }

  const inputId = id || `mobile-date-input-${name || Math.random().toString(36).substr(2, 9)}`
  const displayValue = value
    ? formatDate(typeof value === 'string' ? new Date(value) : value)
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
            type="date"
            value={getInputValue()}
            onChange={handleChange}
            onClick={(e) => {
              // Asegurar que el click abra el date picker en móviles
              if (inputRef.current && 'showPicker' in HTMLInputElement.prototype) {
                try {
                  inputRef.current.showPicker()
                } catch (err) {
                  // showPicker puede fallar en algunos navegadores, ignorar
                }
              }
            }}
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
            min={getMinDate()}
            max={getMaxDate()}
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
              // El padding-right ya está manejado por CSS para inputs type="date"
              // Solo agregar padding extra si hay botón de limpiar
              showClearButton && 'pr-10',
              // Asegurar que el input sea clickeable
              'cursor-pointer',
            )}
          />

          {/* Icono de calendario - clickeable para abrir el date picker */}
          {!showClearButton && (
            <button
              type="button"
              onClick={() => {
                inputRef.current?.showPicker?.() || inputRef.current?.click()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              aria-label="Abrir selector de fecha"
            >
              <Calendar className="h-5 w-5" />
            </button>
          )}

          {/* Clear button */}
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Limpiar fecha"
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
              Hoy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(1)}
              className="text-xs"
            >
              Mañana
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(7)}
              className="text-xs"
            >
              En 1 semana
            </Button>
          </div>
        )}

        {/* Display value */}
        {displayValue && (
          <p className="text-sm text-muted-foreground">Fecha seleccionada: {displayValue}</p>
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

export default MobileDateInput

