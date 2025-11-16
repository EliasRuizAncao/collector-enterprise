/**
 * MobileCheckbox - Checkbox grande optimizado para mobile
 */

import { useState, useEffect } from 'react'
import { Check, Minus, AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { hapticFeedback } from '../../hooks/useGestures'
import './inputStyles.css'

export interface CheckboxOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface MobileCheckboxProps {
  /** Valor (boolean para single, string[] para group) */
  value: boolean | string[]
  /** Callback cuando cambia el valor */
  onChange: (value: boolean | string[]) => void
  /** Label del checkbox (para single) */
  label?: string
  /** Opciones (para group) */
  options?: CheckboxOption[]
  /** Texto de ayuda */
  helperText?: string
  /** Mensaje de error */
  error?: string
  /** Si el campo es requerido */
  required?: boolean
  /** Si el campo está deshabilitado */
  disabled?: boolean
  /** Estado indeterminado (para single) */
  indeterminate?: boolean
  /** ID del campo */
  id?: string
  /** Name del campo */
  name?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileCheckbox = ({
  value,
  onChange,
  label,
  options,
  helperText,
  error,
  required = false,
  disabled = false,
  indeterminate = false,
  id,
  name,
  onBlur,
  onFocus,
}: MobileCheckboxProps) => {
  const [hasShaken, setHasShaken] = useState(false)

  // Shake animation cuando hay error
  useEffect(() => {
    if (error && !hasShaken) {
      setHasShaken(true)
      const timer = setTimeout(() => setHasShaken(false), 400)
      return () => clearTimeout(timer)
    }
  }, [error, hasShaken])

  // Si hay options, es un grupo
  const isGroup = !!options && options.length > 0

  // Para single checkbox
  const handleSingleToggle = () => {
    if (disabled) return
    hapticFeedback('light')
    onChange(!(value as boolean))
    onFocus?.()
  }

  // Para group checkbox
  const handleGroupToggle = (optionValue: string) => {
    if (disabled) return
    hapticFeedback('light')
    const currentValues = (value as string[]) || []
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter((v) => v !== optionValue)
      : [...currentValues, optionValue]
    onChange(newValues)
    onFocus?.()
  }

  const checkboxId = id || `mobile-checkbox-${name || Math.random().toString(36).substr(2, 9)}`

  // Renderizar single checkbox
  if (!isGroup) {
    const isChecked = value === true
    const isIndeterminate = indeterminate && !isChecked

    return (
      <div className="mobile-input-container">
        <button
          type="button"
          onClick={handleSingleToggle}
          disabled={disabled}
          onBlur={onBlur}
          className={cn(
            'flex items-center gap-3 w-full p-4 rounded-xl border-2 text-left transition-all',
            'hover:bg-accent',
            isChecked || isIndeterminate
              ? 'border-primary bg-primary/5'
              : 'border-input bg-background',
            disabled && 'opacity-50 cursor-not-allowed',
            hasShaken && error && 'input-shake',
          )}
          role="checkbox"
          aria-checked={isIndeterminate ? 'mixed' : isChecked}
          aria-disabled={disabled}
          aria-invalid={!!error}
        >
          {/* Checkbox visual */}
          <div
            className={cn(
              'h-8 w-8 shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors',
              isChecked || isIndeterminate
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background',
            )}
          >
            {isIndeterminate ? (
              <Minus className="h-5 w-5" />
            ) : isChecked ? (
              <Check className="h-5 w-5" />
            ) : null}
          </div>

          {/* Label */}
          {label && (
            <div className="flex-1">
              <span className="text-base font-medium">
                {label}
                {required && <span className="ml-1 text-destructive">*</span>}
              </span>
            </div>
          )}
        </button>

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

  // Renderizar group de checkboxes
  const selectedValues = (value as string[]) || []

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
        role="group"
        aria-labelledby={label ? `${checkboxId}-label` : undefined}
        aria-required={required}
        aria-invalid={!!error}
        className={cn('space-y-3', hasShaken && error && 'input-shake')}
      >
        {options.map((option) => {
          const isChecked = selectedValues.includes(option.value)
          const isDisabled = disabled || option.disabled

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !isDisabled && handleGroupToggle(option.value)}
              disabled={isDisabled}
              onBlur={onBlur}
              className={cn(
                'w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                'hover:bg-accent',
                isChecked
                  ? 'border-primary bg-primary/5'
                  : 'border-input bg-background',
                isDisabled && 'opacity-50 cursor-not-allowed',
              )}
              role="checkbox"
              aria-checked={isChecked}
              aria-disabled={isDisabled}
            >
              {/* Checkbox visual */}
              <div
                className={cn(
                  'h-8 w-8 shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors mt-0.5',
                  isChecked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background',
                )}
              >
                {isChecked && <Check className="h-5 w-5" />}
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

export default MobileCheckbox

