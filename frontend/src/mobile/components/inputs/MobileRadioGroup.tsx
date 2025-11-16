/**
 * MobileRadioGroup - Radio buttons como cards grandes seleccionables
 */

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { hapticFeedback } from '../../hooks/useGestures'
import './inputStyles.css'

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface MobileRadioGroupProps {
  /** Valor seleccionado */
  value: string | null
  /** Callback cuando cambia el valor */
  onChange: (value: string) => void
  /** Opciones disponibles */
  options: RadioOption[]
  /** Label del grupo */
  label?: string
  /** Texto de ayuda */
  helperText?: string
  /** Mensaje de error */
  error?: string
  /** Si el campo es requerido */
  required?: boolean
  /** Si el campo está deshabilitado */
  disabled?: boolean
  /** ID del campo */
  id?: string
  /** Name del campo */
  name?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileRadioGroup = ({
  value,
  onChange,
  options,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  id,
  name,
  onBlur,
  onFocus,
}: MobileRadioGroupProps) => {
  const [hasShaken, setHasShaken] = useState(false)

  // Shake animation cuando hay error
  useEffect(() => {
    if (error && !hasShaken) {
      setHasShaken(true)
      const timer = setTimeout(() => setHasShaken(false), 400)
      return () => clearTimeout(timer)
    }
  }, [error, hasShaken])

  const handleSelect = (optionValue: string) => {
    if (disabled) return
    hapticFeedback('light')
    onChange(optionValue)
    onFocus?.()
  }

  const groupId = id || `mobile-radio-group-${name || Math.random().toString(36).substr(2, 9)}`
  const groupName = name || groupId

  return (
    <div className="mobile-input-container">
      {label && (
        <div className="mb-3">
          <span className="mobile-input-label">
            {label}
            {required && <span className="mobile-input-label-required">*</span>}
          </span>
        </div>
      )}

      <div
        role="radiogroup"
        aria-labelledby={label ? `${groupId}-label` : undefined}
        aria-required={required}
        aria-invalid={!!error}
        className={cn('space-y-3', hasShaken && error && 'input-shake')}
      >
        {options.map((option) => {
          const isSelected = value === option.value
          const isDisabled = disabled || option.disabled

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !isDisabled && handleSelect(option.value)}
              disabled={isDisabled}
              onBlur={onBlur}
              className={cn(
                'w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
                'hover:bg-accent',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-input bg-background',
                isDisabled && 'opacity-50 cursor-not-allowed',
              )}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
            >
              {/* Radio button */}
              <div className="mt-0.5 shrink-0">
                {isSelected ? (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-base">{option.label}</div>
                {option.description && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {option.description}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p className="mobile-input-helper mt-2">{helperText}</p>
      )}

      {/* Error message */}
      {error && (
        <div className="mobile-input-error mt-2" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default MobileRadioGroup

