/**
 * MobileSwitch - Switch estilo iOS/Android según plataforma
 */

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { hapticFeedback } from '../../hooks/useGestures'
import { isIOS, isAndroid } from '../../utils/deviceDetector'
import './inputStyles.css'

export interface MobileSwitchProps {
  /** Valor del switch */
  value: boolean
  /** Callback cuando cambia el valor */
  onChange: (value: boolean) => void
  /** Label del switch */
  label?: string
  /** Texto de ayuda */
  helperText?: string
  /** Mensaje de error */
  error?: string
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

const MobileSwitch = ({
  value,
  onChange,
  label,
  helperText,
  error,
  disabled = false,
  id,
  name,
  onBlur,
  onFocus,
}: MobileSwitchProps) => {
  const [hasShaken, setHasShaken] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'default'>('default')

  // Detectar plataforma
  useEffect(() => {
    if (isIOS()) {
      setPlatform('ios')
    } else if (isAndroid()) {
      setPlatform('android')
    } else {
      setPlatform('default')
    }
  }, [])

  // Shake animation cuando hay error
  useEffect(() => {
    if (error && !hasShaken) {
      setHasShaken(true)
      const timer = setTimeout(() => setHasShaken(false), 400)
      return () => clearTimeout(timer)
    }
  }, [error, hasShaken])

  const handleToggle = () => {
    if (disabled) return
    hapticFeedback('light')
    onChange(!value)
    onFocus?.()
  }

  const switchId = id || `mobile-switch-${name || Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="mobile-input-container">
      <div
        className={cn(
          'flex items-center justify-between p-4 rounded-xl border-2 transition-all',
          'hover:bg-accent',
          value ? 'border-primary bg-primary/5' : 'border-input bg-background',
          disabled && 'opacity-50 cursor-not-allowed',
          hasShaken && error && 'input-shake',
        )}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={switchId}
            className="flex-1 text-base font-medium cursor-pointer"
            onClick={handleToggle}
          >
            {label}
          </label>
        )}

        {/* Switch */}
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={value}
          aria-disabled={disabled}
          onClick={handleToggle}
          disabled={disabled}
          onBlur={onBlur}
          className={cn(
            'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            value
              ? platform === 'ios'
                ? 'bg-primary'
                : 'bg-primary'
              : 'bg-input',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-transform',
              value ? 'translate-x-5' : 'translate-x-0',
              platform === 'ios' && 'shadow-md',
            )}
          />
        </button>
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

export default MobileSwitch

