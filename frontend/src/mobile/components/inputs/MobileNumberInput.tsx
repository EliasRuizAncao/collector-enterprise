/**
 * MobileNumberInput - Input numérico con botones +/- y formato
 */

import { useState, useRef, useEffect } from 'react'
import { Minus, Plus, AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { inputBaseClasses, getInputStateClasses, formatNumber, parseFormattedNumber } from './inputUtils'
import { hapticFeedback } from '../../hooks/useGestures'
import './inputStyles.css'

export interface MobileNumberInputProps {
  /** Valor del input */
  value: number | string
  /** Callback cuando cambia el valor */
  onChange: (value: number) => void
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
  /** Valor mínimo */
  min?: number
  /** Valor máximo */
  max?: number
  /** Incremento/paso */
  step?: number
  /** Si mostrar formato con separadores */
  format?: boolean
  /** ID del campo */
  id?: string
  /** Name del campo */
  name?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileNumberInput = ({
  value,
  onChange,
  label,
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  min,
  max,
  step = 1,
  format = true,
  id,
  name,
  onBlur,
  onFocus,
}: MobileNumberInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasShaken, setHasShaken] = useState(false)
  const [displayValue, setDisplayValue] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Sincronizar displayValue con value
  useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      setDisplayValue('')
    } else {
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      if (!isNaN(numValue)) {
        setDisplayValue(format ? formatNumber(numValue) : String(numValue))
      } else {
        setDisplayValue(String(value))
      }
    }
  }, [value, format])

  // Shake animation cuando hay error
  useEffect(() => {
    if (error && !hasShaken) {
      setHasShaken(true)
      const timer = setTimeout(() => setHasShaken(false), 400)
      return () => clearTimeout(timer)
    }
  }, [error, hasShaken])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Permitir vacío temporalmente
    if (inputValue === '') {
      setDisplayValue('')
      onChange(0)
      return
    }

    // Si está formateado, parsear
    const numValue = format ? parseFormattedNumber(inputValue) : parseFloat(inputValue)
    
    if (!isNaN(numValue)) {
      // Aplicar min/max
      let finalValue = numValue
      if (min !== undefined && finalValue < min) finalValue = min
      if (max !== undefined && finalValue > max) finalValue = max
      
      onChange(finalValue)
      setDisplayValue(format ? formatNumber(finalValue) : String(finalValue))
    } else {
      // Mantener el valor de display para permitir edición
      setDisplayValue(inputValue)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    
    // Asegurar que el valor final sea válido
    const numValue = format ? parseFormattedNumber(displayValue) : parseFloat(displayValue)
    if (!isNaN(numValue)) {
      let finalValue = numValue
      if (min !== undefined && finalValue < min) finalValue = min
      if (max !== undefined && finalValue > max) finalValue = max
      onChange(finalValue)
      setDisplayValue(format ? formatNumber(finalValue) : String(finalValue))
    } else {
      onChange(0)
      setDisplayValue('')
    }
    
    onBlur?.()
  }

  const handleIncrement = () => {
    const current = typeof value === 'number' ? value : parseFloat(String(value)) || 0
    const newValue = current + step
    
    let finalValue = newValue
    if (max !== undefined && finalValue > max) {
      finalValue = max
      hapticFeedback('warning')
    } else {
      hapticFeedback('light')
    }
    
    onChange(finalValue)
  }

  const handleDecrement = () => {
    const current = typeof value === 'number' ? value : parseFloat(String(value)) || 0
    const newValue = current - step
    
    let finalValue = newValue
    if (min !== undefined && finalValue < min) {
      finalValue = min
      hapticFeedback('warning')
    } else {
      hapticFeedback('light')
    }
    
    onChange(finalValue)
  }

  const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
  const canDecrement = min === undefined || numValue > min
  const canIncrement = max === undefined || numValue < max

  const inputId = id || `mobile-number-input-${name || Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="mobile-input-container">
      {label && (
        <label htmlFor={inputId} className="mobile-input-label">
          {label}
          {required && <span className="mobile-input-label-required">*</span>}
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Botón decrementar */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0 rounded-xl"
          onClick={handleDecrement}
          disabled={disabled || !canDecrement}
          aria-label="Decrementar"
        >
          <Minus className="h-5 w-5" />
        </Button>

        {/* Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
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
              'text-center',
            )}
          />
        </div>

        {/* Botón incrementar */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0 rounded-xl"
          onClick={handleIncrement}
          disabled={disabled || !canIncrement}
          aria-label="Incrementar"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Indicadores de min/max */}
      {(min !== undefined || max !== undefined) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {min !== undefined && (
            <span className={cn(numValue < min && 'text-destructive')}>
              Mín: {format ? formatNumber(min) : min}
            </span>
          )}
          {max !== undefined && (
            <span className={cn(numValue > max && 'text-destructive')}>
              Máx: {format ? formatNumber(max) : max}
            </span>
          )}
        </div>
      )}

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

export default MobileNumberInput

