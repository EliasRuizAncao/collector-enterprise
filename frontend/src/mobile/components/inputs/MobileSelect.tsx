/**
 * MobileSelect - Select con sheet bottom y search
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, X, Check, AlertCircle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { Badge } from '@/shared/components/ui/badge'
import { inputBaseClasses, getInputStateClasses } from './inputUtils'
import './inputStyles.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface MobileSelectProps {
  /** Valor seleccionado (string para single, string[] para multiple) */
  value: string | string[] | null
  /** Callback cuando cambia el valor */
  onChange: (value: string | string[]) => void
  /** Opciones disponibles */
  options: SelectOption[]
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
  /** Si permite selección múltiple */
  multiple?: boolean
  /** Si mostrar búsqueda (cuando hay >10 opciones) */
  showSearch?: boolean
  /** ID del campo */
  id?: string
  /** Name del campo */
  name?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileSelect = ({
  value,
  onChange,
  options,
  label,
  placeholder = 'Selecciona una opción',
  helperText,
  error,
  required = false,
  disabled = false,
  multiple = false,
  showSearch,
  id,
  name,
  onBlur,
  onFocus,
}: MobileSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasShaken, setHasShaken] = useState(false)
  const inputRef = useRef<HTMLButtonElement>(null)
  const justSelectedRef = useRef(false)

  // Determinar si mostrar search
  const shouldShowSearch = showSearch !== undefined ? showSearch : options.length > 10

  // Filtrar opciones según búsqueda
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options
    const query = searchQuery.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query),
    )
  }, [options, searchQuery])

  // Shake animation cuando hay error
  useEffect(() => {
    if (error && !hasShaken) {
      setHasShaken(true)
      const timer = setTimeout(() => setHasShaken(false), 400)
      return () => clearTimeout(timer)
    }
  }, [error, hasShaken])

  // Obtener valores seleccionados
  const selectedValues = useMemo(() => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  }, [value])

  // Obtener labels de opciones seleccionadas
  const selectedLabels = useMemo(() => {
    return selectedValues
      .map((val) => options.find((opt) => opt.value === val)?.label)
      .filter(Boolean) as string[]
  }, [selectedValues, options])

  // Display value
  const displayValue = useMemo(() => {
    if (multiple) {
      if (selectedLabels.length === 0) return placeholder
      if (selectedLabels.length === 1) return selectedLabels[0]
      return `${selectedLabels.length} opciones seleccionadas`
    } else {
      return selectedLabels[0] || placeholder
    }
  }, [multiple, selectedLabels, placeholder])

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      onFocus?.()
    } else {
      onBlur?.()
    }
  }

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : value ? [value] : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue]
      onChange(newValues)
    } else {
      // Marcar que se acaba de seleccionar un valor
      justSelectedRef.current = true
      // Cambiar el valor - esto limpiará el error automáticamente en handleFieldChange
      onChange(optionValue)
      setIsOpen(false)
      // Validar después de que el estado se haya actualizado
      setTimeout(() => {
        justSelectedRef.current = false
        onBlur?.()
      }, 200)
    }
  }

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange('')
    }
  }

  const handleClear = () => {
    onChange(multiple ? [] : '')
    setSearchQuery('')
  }

  const isSelected = (optionValue: string): boolean => {
    return selectedValues.includes(optionValue)
  }

  const inputId = id || `mobile-select-${name || Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="mobile-input-container">
      {label && (
        <label htmlFor={inputId} className="mobile-input-label">
          {label}
          {required && <span className="mobile-input-label-required">*</span>}
        </label>
      )}

      <button
        ref={inputRef}
        id={inputId}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${inputId}-error`
            : helperText
              ? `${inputId}-helper`
              : undefined
        }
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          inputBaseClasses,
          getInputStateClasses(error, false, false, false),
          hasShaken && error && 'input-shake',
          'flex items-center justify-between text-left cursor-pointer',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span className={cn('flex-1 truncate', !value && 'text-muted-foreground')}>
          {displayValue}
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Chips de selección múltiple */}
      {multiple && selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedLabels.map((label, index) => {
            const optionValue = selectedValues[index]
            return (
              <Badge
                key={optionValue}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span className="text-sm">{label}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(optionValue, e)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                    aria-label={`Eliminar ${label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Sheet con opciones */}
      <Sheet 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open)
          // Cuando se cierra el sheet sin seleccionar, llamar onBlur para validar
          // Solo si no es múltiple y no se acaba de seleccionar un valor
          if (!open && !multiple && !justSelectedRef.current) {
            // Delay para asegurar que cualquier cambio de estado se haya procesado
            setTimeout(() => {
              onBlur?.()
            }, 100)
          }
        }}
      >
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{label || 'Seleccionar opción'}</SheetTitle>
            {multiple && (
              <SheetDescription>
                {selectedValues.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="text-destructive"
                  >
                    Limpiar selección
                  </Button>
                )}
              </SheetDescription>
            )}
          </SheetHeader>

          {/* Search */}
          {shouldShowSearch && (
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {/* Lista de opciones */}
          <div className="mt-4 space-y-1 overflow-y-auto max-h-[60vh]">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((option) => {
                const selected = isSelected(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-lg text-left transition-colors',
                      'hover:bg-accent',
                      selected && 'bg-primary/10 border border-primary',
                      option.disabled && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <span className="flex-1">{option.label}</span>
                    {selected && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

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

export default MobileSelect

