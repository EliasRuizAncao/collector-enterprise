/**
 * FilterSystem - Sistema de filtros multi-criterio
 * Componente reutilizable para filtros avanzados con múltiples tipos
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  X,
  Search,
  RotateCcw,
} from 'lucide-react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter } from 'date-fns'
import { es } from 'date-fns/locale'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { Slider } from '@/shared/components/ui/slider'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { Separator } from '@/shared/components/ui/separator'

/**
 * Configuración de un filtro
 */
export interface FilterConfig {
  /** ID único del filtro */
  id: string
  /** Tipo de filtro */
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'toggle' | 'slider' | 'search-select'
  /** Etiqueta del filtro */
  label: string
  /** Descripción opcional */
  description?: string
  /** Opciones para select/multiselect/search-select */
  options?: Array<{ value: string; label: string; count?: number }>
  /** Valor mínimo para slider */
  min?: number
  /** Valor máximo para slider */
  max?: number
  /** Paso para slider */
  step?: number
  /** Valor por defecto */
  defaultValue?: any
  /** Si true, el filtro es requerido */
  required?: boolean
  /** Validación personalizada */
  validate?: (value: any) => string | null
  /** Dependencias: otros filtros que deben tener valor */
  dependsOn?: string[]
  /** Si true, oculta opciones sin resultados (smart filter) */
  hideEmptyOptions?: boolean
  /** Categoría para agrupar filtros */
  category?: string
}

/**
 * Props del componente FilterSystem
 */
export interface FilterSystemProps {
  /** Configuración de filtros */
  filters: FilterConfig[]
  /** Valores actuales de los filtros */
  values: Record<string, any>
  /** Callback cuando cambian los valores */
  onChange: (values: Record<string, any>) => void
  /** Callback cuando se aplican los filtros */
  onApply: () => void
  /** Callback para resetear filtros */
  onReset: () => void
  /** Si true, el sheet está abierto */
  open: boolean
  /** Callback para cerrar el sheet */
  onClose: () => void
  /** Clave para persistencia en localStorage */
  storageKey?: string
  /** Si true, persiste en URL params */
  persistInUrl?: boolean
  /** Número de resultados con los filtros actuales */
  resultCount?: number
}

/**
 * Presets de fecha rápidos
 */
const DATE_PRESETS = [
  { label: 'Hoy', value: 'today' },
  { label: 'Esta semana', value: 'thisWeek' },
  { label: 'Este mes', value: 'thisMonth' },
] as const

/**
 * Obtener fechas de un preset
 */
const getDatePreset = (preset: string): { start: Date; end: Date } | null => {
  const now = new Date()
  switch (preset) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      }
    case 'thisWeek':
      return {
        start: startOfWeek(now, { locale: es }),
        end: endOfWeek(now, { locale: es }),
      }
    case 'thisMonth':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      }
    default:
      return null
  }
}

/**
 * Componente FilterSystem
 */
const FilterSystem = ({
  filters,
  values,
  onChange,
  onApply,
  onReset,
  open,
  onClose,
  storageKey = 'filter-system',
  persistInUrl = true,
  resultCount,
}: FilterSystemProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [localValues, setLocalValues] = useState<Record<string, any>>(values)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({})
  const datePresetRef = useRef<string | null>(null)

  // Cargar valores desde URL o localStorage al abrir
  useEffect(() => {
    if (open) {
      let initialValues: Record<string, any> = {}

      // Cargar desde URL params
      if (persistInUrl) {
        filters.forEach((filter) => {
          const paramValue = searchParams.get(filter.id)
          if (paramValue) {
            try {
              if (filter.type === 'multiselect' || filter.type === 'search-select') {
                initialValues[filter.id] = paramValue.split(',').filter(Boolean)
              } else if (filter.type === 'slider') {
                initialValues[filter.id] = Number(paramValue)
              } else if (filter.type === 'toggle') {
                initialValues[filter.id] = paramValue === 'true'
              } else {
                initialValues[filter.id] = paramValue
              }
            } catch {
              // Ignorar errores de parsing
            }
          }
        })
      }

      // Si no hay valores en URL, cargar desde localStorage
      if (Object.keys(initialValues).length === 0) {
        try {
          const stored = localStorage.getItem(`${storageKey}-values`)
          if (stored) {
            initialValues = JSON.parse(stored)
          }
        } catch {
          // Ignorar errores
        }
      }

      // Aplicar valores por defecto si no hay valores guardados
      filters.forEach((filter) => {
        if (initialValues[filter.id] === undefined && filter.defaultValue !== undefined) {
          initialValues[filter.id] = filter.defaultValue
        }
      })

      setLocalValues(initialValues)
      onChange(initialValues)
    }
  }, [open, filters, searchParams, persistInUrl, storageKey, onChange])

  // Guardar valores en URL y localStorage
  const saveValues = useCallback(
    (newValues: Record<string, any>) => {
      // Guardar en URL params
      if (persistInUrl) {
        const newParams = new URLSearchParams(searchParams)
        filters.forEach((filter) => {
          const value = newValues[filter.id]
          if (value !== undefined && value !== null && value !== '' && value !== false) {
            if (Array.isArray(value)) {
              if (value.length > 0) {
                newParams.set(filter.id, value.join(','))
              } else {
                newParams.delete(filter.id)
              }
            } else {
              newParams.set(filter.id, String(value))
            }
          } else {
            newParams.delete(filter.id)
          }
        })
        setSearchParams(newParams, { replace: true })
      }

      // Guardar en localStorage
      try {
        localStorage.setItem(`${storageKey}-values`, JSON.stringify(newValues))
      } catch {
        // Ignorar errores de localStorage
      }
    },
    [filters, persistInUrl, searchParams, setSearchParams, storageKey],
  )

  // Validar valores
  const validateValues = useCallback(
    (vals: Record<string, any>): Record<string, string> => {
      const newErrors: Record<string, string> = {}

      filters.forEach((filter) => {
        const value = vals[filter.id]

        // Validar requeridos
        if (filter.required && (value === undefined || value === null || value === '')) {
          newErrors[filter.id] = `${filter.label} es requerido`
          return
        }

        // Validar dependencias
        if (filter.dependsOn) {
          const hasDependency = filter.dependsOn.some((depId) => {
            const depValue = vals[depId]
            return depValue !== undefined && depValue !== null && depValue !== ''
          })
          if (!hasDependency && value !== undefined && value !== null && value !== '') {
            newErrors[filter.id] = `Requiere que otros filtros estén configurados`
            return
          }
        }

        // Validación personalizada
        if (filter.validate && value !== undefined && value !== null && value !== '') {
          const error = filter.validate(value)
          if (error) {
            newErrors[filter.id] = error
            return
          }
        }

        // Validar date range
        if (filter.type === 'daterange' && value) {
          const { start, end } = value
          if (start && end && isAfter(start, end)) {
            newErrors[filter.id] = 'La fecha de inicio debe ser anterior a la fecha de fin'
            return
          }
        }
      })

      return newErrors
    },
    [filters],
  )

  // Actualizar valor local
  const updateValue = useCallback(
    (filterId: string, value: any) => {
      const newValues = { ...localValues, [filterId]: value }
      setLocalValues(newValues)

      // Validar
      const newErrors = validateValues(newValues)
      setErrors(newErrors)

      // Actualizar callback
      onChange(newValues)
    },
    [localValues, onChange, validateValues],
  )

  // Aplicar filtros
  const handleApply = useCallback(() => {
    const newErrors = validateValues(localValues)
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    saveValues(localValues)
    onApply()
    onClose()
  }, [localValues, validateValues, saveValues, onApply, onClose])

  // Resetear filtros
  const handleReset = useCallback(() => {
    const defaultValues: Record<string, any> = {}
    filters.forEach((filter) => {
      if (filter.defaultValue !== undefined) {
        defaultValues[filter.id] = filter.defaultValue
      }
    })

    setLocalValues(defaultValues)
    setErrors({})
    setSearchQueries({})
    datePresetRef.current = null

    // Limpiar URL params
    if (persistInUrl) {
      const newParams = new URLSearchParams(searchParams)
      filters.forEach((filter) => {
        newParams.delete(filter.id)
      })
      setSearchParams(newParams, { replace: true })
    }

    // Limpiar localStorage
    try {
      localStorage.removeItem(`${storageKey}-values`)
    } catch {
      // Ignorar errores
    }

    onChange(defaultValues)
    onReset()
  }, [filters, persistInUrl, searchParams, setSearchParams, storageKey, onChange, onReset])

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    return filters.filter((filter) => {
      const value = localValues[filter.id]
      if (value === undefined || value === null || value === '') return false
      if (Array.isArray(value)) return value.length > 0
      if (filter.type === 'toggle') return value === true
      if (filter.type === 'daterange') return value.start || value.end
      return true
    }).length
  }, [filters, localValues])

  // Agrupar filtros por categoría
  const groupedFilters = useMemo(() => {
    const groups: Record<string, FilterConfig[]> = {}
    filters.forEach((filter) => {
      const category = filter.category || 'General'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(filter)
    })
    return groups
  }, [filters])

  // Renderizar filtro según tipo
  const renderFilter = useCallback(
    (filter: FilterConfig) => {
      const value = localValues[filter.id]
      const error = errors[filter.id]
      const searchQuery = searchQueries[filter.id] || ''

      // Filtrar opciones si es search-select
      const filteredOptions =
        filter.type === 'search-select' && filter.options
          ? filter.options.filter((opt) =>
              opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
            )
          : filter.options

      // Ocultar opciones sin resultados si está habilitado
      const visibleOptions =
        filter.hideEmptyOptions && filteredOptions
          ? filteredOptions.filter((opt) => opt.count === undefined || opt.count > 0)
          : filteredOptions

      switch (filter.type) {
        case 'select':
          return (
            <div key={filter.id} className="space-y-3">
              <Label className="text-sm font-semibold">{filter.label}</Label>
              {filter.description && (
                <p className="text-xs text-muted-foreground">{filter.description}</p>
              )}
              <RadioGroup
                value={value || ''}
                onValueChange={(newValue) => updateValue(filter.id, newValue)}
              >
                <div className="space-y-2">
                  {visibleOptions?.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-center space-x-3 rounded-lg border border-border p-3 cursor-pointer transition-colors touch-manipulation',
                        value === option.value && 'border-primary bg-primary/5',
                      )}
                    >
                      <RadioGroupItem value={option.value} id={`${filter.id}-${option.value}`} />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({option.count})
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )

        case 'multiselect':
          const selectedValues = Array.isArray(value) ? value : []
          const allSelected = visibleOptions?.every((opt) => selectedValues.includes(opt.value))

          return (
            <div key={filter.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">{filter.label}</Label>
                {visibleOptions && visibleOptions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (allSelected) {
                        updateValue(filter.id, [])
                      } else {
                        updateValue(
                          filter.id,
                          visibleOptions.map((opt) => opt.value),
                        )
                      }
                    }}
                  >
                    {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </Button>
                )}
              </div>
              {filter.description && (
                <p className="text-xs text-muted-foreground">{filter.description}</p>
              )}
              {selectedValues.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedValues.length} seleccionado{selectedValues.length > 1 ? 's' : ''}
                </Badge>
              )}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {visibleOptions?.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 rounded-lg border border-border p-3 cursor-pointer transition-colors touch-manipulation hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedValues.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateValue(filter.id, [...selectedValues, option.value])
                        } else {
                          updateValue(
                            filter.id,
                            selectedValues.filter((v) => v !== option.value),
                          )
                        }
                      }}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({option.count})
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )

        case 'search-select':
          return (
            <div key={filter.id} className="space-y-3">
              <Label className="text-sm font-semibold">{filter.label}</Label>
              {filter.description && (
                <p className="text-xs text-muted-foreground">{filter.description}</p>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQueries({ ...searchQueries, [filter.id]: e.target.value })}
                  className="pl-9"
                />
              </div>
              {visibleOptions && visibleOptions.length > 0 && (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {visibleOptions.map((option) => {
                    const isSelected = Array.isArray(value) && value.includes(option.value)
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          'flex items-center space-x-3 rounded-lg border border-border p-3 cursor-pointer transition-colors touch-manipulation hover:bg-accent',
                          isSelected && 'border-primary bg-primary/5',
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const currentValues = Array.isArray(value) ? value : []
                            if (checked) {
                              updateValue(filter.id, [...currentValues, option.value])
                            } else {
                              updateValue(
                                filter.id,
                                currentValues.filter((v) => v !== option.value),
                              )
                            }
                          }}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{option.label}</span>
                          {option.count !== undefined && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({option.count})
                            </span>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
              {visibleOptions?.length === 0 && searchQuery && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No se encontraron resultados
                </p>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )

        case 'date':
          return (
            <div key={filter.id} className="space-y-3">
              <Label className="text-sm font-semibold">{filter.label}</Label>
              {filter.description && (
                <p className="text-xs text-muted-foreground">{filter.description}</p>
              )}
              <Input
                type="date"
                value={value ? format(new Date(value), 'yyyy-MM-dd') : ''}
                onChange={(e) => updateValue(filter.id, e.target.value || null)}
                className="mobile-input"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )

        case 'daterange':
          const dateRange = value || { start: null, end: null }
          const startDate = dateRange.start
            ? format(new Date(dateRange.start), 'yyyy-MM-dd')
            : ''
          const endDate = dateRange.end ? format(new Date(dateRange.end), 'yyyy-MM-dd') : ''

          return (
            <div key={filter.id} className="space-y-3">
              <Label className="text-sm font-semibold">{filter.label}</Label>
              {filter.description && (
                <p className="text-xs text-muted-foreground">{filter.description}</p>
              )}
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  {DATE_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={datePresetRef.current === preset.value ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const dates = getDatePreset(preset.value)
                        if (dates) {
                          datePresetRef.current = preset.value
                          updateValue(filter.id, dates)
                        }
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`${filter.id}-start`} className="text-xs text-muted-foreground">
                      Desde
                    </Label>
                    <Input
                      id={`${filter.id}-start`}
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        datePresetRef.current = null
                        updateValue(filter.id, {
                          start: e.target.value ? new Date(e.target.value) : null,
                          end: dateRange.end,
                        })
                      }}
                      className="mobile-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${filter.id}-end`} className="text-xs text-muted-foreground">
                      Hasta
                    </Label>
                    <Input
                      id={`${filter.id}-end`}
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        datePresetRef.current = null
                        updateValue(filter.id, {
                          start: dateRange.start,
                          end: e.target.value ? new Date(e.target.value) : null,
                        })
                      }}
                      className="mobile-input"
                    />
                  </div>
                </div>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )

        case 'toggle':
          return (
            <div key={filter.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-semibold">{filter.label}</Label>
                  {filter.description && (
                    <p className="text-xs text-muted-foreground mt-1">{filter.description}</p>
                  )}
                </div>
                <Switch
                  checked={value || false}
                  onCheckedChange={(checked) => updateValue(filter.id, checked)}
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )

        case 'slider':
          const sliderValue = value !== undefined ? Number(value) : filter.min || 0

          return (
            <div key={filter.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">{filter.label}</Label>
                <Badge variant="secondary" className="text-sm font-mono">
                  {sliderValue}
                </Badge>
              </div>
              {filter.description && (
                <p className="text-xs text-muted-foreground">{filter.description}</p>
              )}
              <div className="px-2">
                <Slider
                  value={[sliderValue]}
                  onValueChange={([newValue]) => updateValue(filter.id, newValue)}
                  min={filter.min || 0}
                  max={filter.max || 100}
                  step={filter.step || 1}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{filter.min || 0}</span>
                <span>{filter.max || 100}</span>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )

        default:
          return null
      }
    },
    [localValues, errors, searchQueries, updateValue],
  )

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[70vh] max-h-[700px] p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="border-b border-border/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-mobile-h3 font-semibold">Filtros</SheetTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs touch-manipulation"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 touch-manipulation"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <div className="space-y-6">
              {Object.entries(groupedFilters).map(([category, categoryFilters]) => (
                <div key={category}>
                  {Object.keys(groupedFilters).length > 1 && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                        {category}
                      </h3>
                      <Separator className="mb-4" />
                    </>
                  )}
                  <div className="space-y-6">
                    {categoryFilters.map((filter) => renderFilter(filter))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="border-t border-border/60 bg-background px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  {activeFiltersCount > 0 ? (
                    <>
                      <span className="font-semibold text-foreground">{activeFiltersCount}</span>{' '}
                      filtro{activeFiltersCount > 1 ? 's' : ''} activo
                      {activeFiltersCount > 1 ? 's' : ''}
                    </>
                  ) : (
                    'Sin filtros activos'
                  )}
                  {resultCount !== undefined && (
                    <>
                      {' • '}
                      <span className="font-semibold text-foreground">{resultCount}</span>{' '}
                      resultado{resultCount !== 1 ? 's' : ''}
                    </>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="touch-manipulation"
                >
                  Limpiar
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="touch-manipulation"
                  disabled={Object.keys(errors).length > 0}
                >
                  Ver resultados
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default FilterSystem

