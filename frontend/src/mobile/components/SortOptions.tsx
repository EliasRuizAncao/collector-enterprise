/**
 * SortOptions - Sistema de ordenamiento
 * Componente reutilizable para ordenar listas con múltiples criterios
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sparkles,
  History,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Switch } from '@/shared/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'

/**
 * Dirección de ordenamiento
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Criterio de ordenamiento común
 */
export type CommonSortCriteria =
  | 'date_recent'
  | 'date_oldest'
  | 'name_asc'
  | 'name_desc'
  | 'priority_high'
  | 'status_pending'
  | 'progress_low'

/**
 * Criterio de ordenamiento para tareas
 */
export type AssignmentSortCriteria =
  | 'dueDate'
  | 'priority'
  | 'progress'
  | 'status'
  | 'date_recent'
  | 'date_oldest'
  | 'name_asc'
  | 'name_desc'

/**
 * Criterio de ordenamiento para historial
 */
export type HistorySortCriteria =
  | 'date_recent'
  | 'date_oldest'
  | 'type'
  | 'name_asc'
  | 'name_desc'

/**
 * Criterio de ordenamiento para formularios
 */
export type FormSortCriteria = 'name_asc' | 'name_desc' | 'date_created' | 'usage_count'

/**
 * Opción de ordenamiento
 */
export interface SortOption {
  /** Valor del criterio */
  value: string
  /** Etiqueta visible */
  label: string
  /** Icono del criterio */
  icon?: React.ReactNode
  /** Descripción opcional */
  description?: string
}

/**
 * Props del componente SortOptions
 */
export interface SortOptionsProps {
  /** Criterios de ordenamiento disponibles */
  options: SortOption[]
  /** Criterio actual seleccionado */
  currentSort: string
  /** Dirección actual (asc/desc) */
  currentDirection: SortDirection
  /** Callback cuando cambia el ordenamiento */
  onChange: (sort: string, direction: SortDirection) => void
  /** Si true, el sheet está abierto */
  open: boolean
  /** Callback para abrir el sheet */
  onOpen: () => void
  /** Callback para cerrar el sheet */
  onClose: () => void
  /** Clave para persistencia en localStorage */
  storageKey?: string
  /** Label del botón */
  buttonLabel?: string
  /** Si true, muestra el botón trigger */
  showButton?: boolean
}

/**
 * Obtener icono según criterio
 */
const getSortIcon = (value: string) => {
  if (value.includes('date') || value.includes('Date')) {
    return <Calendar className="h-4 w-4" />
  }
  if (value.includes('priority')) {
    return <AlertCircle className="h-4 w-4" />
  }
  if (value.includes('progress')) {
    return <TrendingUp className="h-4 w-4" />
  }
  if (value.includes('status')) {
    return <CheckCircle2 className="h-4 w-4" />
  }
  if (value.includes('name') || value.includes('Name')) {
    return <FileText className="h-4 w-4" />
  }
  if (value.includes('type')) {
    return <Hash className="h-4 w-4" />
  }
  if (value.includes('usage') || value.includes('count')) {
    return <Sparkles className="h-4 w-4" />
  }
  return <ArrowUpDown className="h-4 w-4" />
}

/**
 * Obtener label del criterio actual
 */
const getCurrentSortLabel = (sort: string, direction: SortDirection, options: SortOption[]): string => {
  const option = options.find((opt) => opt.value === sort)
  if (!option) return 'Sin ordenar'

  const directionLabel = direction === 'asc' ? ' (Asc)' : ' (Desc)'
  
  // Algunos criterios tienen dirección implícita
  if (sort.includes('recent') || sort.includes('high') || sort.includes('pending') || sort.includes('low')) {
    return option.label
  }

  return `${option.label}${directionLabel}`
}

/**
 * Componente SortOptions
 */
const SortOptions = ({
  options,
  currentSort,
  currentDirection,
  onChange,
  open,
  onOpen,
  onClose,
  storageKey = 'sort-options',
  buttonLabel,
  showButton = true,
}: SortOptionsProps) => {
  const [localSort, setLocalSort] = useState(currentSort)
  const [localDirection, setLocalDirection] = useState<SortDirection>(currentDirection)

  // Cargar preferencias al abrir
  useEffect(() => {
    if (open) {
      // Intentar cargar desde localStorage
      try {
        const stored = localStorage.getItem(`${storageKey}-sort`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.sort && parsed.direction) {
            setLocalSort(parsed.sort)
            setLocalDirection(parsed.direction)
            return
          }
        }
      } catch {
        // Ignorar errores
      }

      // Usar valores actuales
      setLocalSort(currentSort)
      setLocalDirection(currentDirection)
    }
  }, [open, currentSort, currentDirection, storageKey])

  // Guardar preferencias
  const savePreferences = useCallback(
    (sort: string, direction: SortDirection) => {
      try {
        localStorage.setItem(
          `${storageKey}-sort`,
          JSON.stringify({ sort, direction }),
        )
      } catch {
        // Ignorar errores de localStorage
      }
    },
    [storageKey],
  )

  // Aplicar ordenamiento
  const handleApply = useCallback(() => {
    onChange(localSort, localDirection)
    savePreferences(localSort, localDirection)
    onClose()
  }, [localSort, localDirection, onChange, savePreferences, onClose])

  // Cambiar criterio
  const handleSortChange = useCallback(
    (value: string) => {
      setLocalSort(value)
      // Aplicar automáticamente
      onChange(value, localDirection)
      savePreferences(value, localDirection)
      onClose()
    },
    [localDirection, onChange, savePreferences, onClose],
  )

  // Cambiar dirección
  const handleDirectionChange = useCallback(
    (checked: boolean) => {
      const newDirection: SortDirection = checked ? 'desc' : 'asc'
      setLocalDirection(newDirection)
      // Aplicar automáticamente
      onChange(localSort, newDirection)
      savePreferences(localSort, newDirection)
    },
    [localSort, onChange, savePreferences],
  )

  // Determinar si la dirección es relevante para el criterio
  const isDirectionRelevant = useMemo(() => {
    return !(
      localSort.includes('recent') ||
      localSort.includes('oldest') ||
      localSort.includes('high') ||
      localSort.includes('low') ||
      localSort.includes('pending')
    )
  }, [localSort])

  // Label del botón
  const displayLabel = useMemo(() => {
    if (buttonLabel) return buttonLabel
    return getCurrentSortLabel(localSort, localDirection, options)
  }, [buttonLabel, localSort, localDirection, options])

  return (
    <>
      {/* Button Trigger - Se renderiza fuera del Sheet */}
      {showButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpen}
          className="gap-2 touch-manipulation"
        >
          <ArrowUpDown className="h-4 w-4" />
          <span className="text-xs font-medium">Ordenar por: {displayLabel}</span>
        </Button>
      )}

      {/* Sort Sheet */}
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent side="bottom" className="h-[60vh] max-h-[500px] p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <SheetHeader className="border-b border-border/60 px-4 py-3">
              <SheetTitle className="text-mobile-h3 font-semibold">Ordenar por</SheetTitle>
            </SheetHeader>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <RadioGroup
                value={localSort}
                onValueChange={handleSortChange}
                className="space-y-2"
              >
                {options.map((option) => {
                  const isSelected = localSort === option.value
                  const icon = option.icon || getSortIcon(option.value)

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer transition-colors duration-200 touch-manipulation hover:bg-accent active:bg-accent/50',
                        isSelected && 'border-primary bg-primary/5',
                      )}
                    >
                      <RadioGroupItem value={option.value} id={`sort-${option.value}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={cn('text-muted-foreground', isSelected && 'text-primary')}>
                            {icon}
                          </div>
                          <span className="text-sm font-medium">{option.label}</span>
                        </div>
                        {option.description && (
                          <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-primary">
                          {localDirection === 'asc' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </label>
                  )
                })}
              </RadioGroup>

              {/* Direction Toggle (solo si es relevante) */}
              {isDirectionRelevant && (
                <div className="mt-6 pt-6 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-sm font-semibold">Dirección</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {localDirection === 'asc' ? 'Ascendente (A-Z, 1-9)' : 'Descendente (Z-A, 9-1)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowUp
                        className={cn(
                          'h-4 w-4 transition-opacity',
                          localDirection === 'asc' ? 'text-primary opacity-100' : 'text-muted-foreground opacity-50',
                        )}
                      />
                      <Switch
                        checked={localDirection === 'desc'}
                        onCheckedChange={handleDirectionChange}
                      />
                      <ArrowDown
                        className={cn(
                          'h-4 w-4 transition-opacity',
                          localDirection === 'desc' ? 'text-primary opacity-100' : 'text-muted-foreground opacity-50',
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default SortOptions

