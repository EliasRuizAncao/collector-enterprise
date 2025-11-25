/**
 * FilterChips - Chips de filtros activos
 * Muestra filtros activos fuera del modal con opción de remover
 */

import { useMemo } from 'react'
import { X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import type { FilterConfig } from './FilterSystem'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Props del componente FilterChips
 */
export interface FilterChipsProps {
  /** Configuración de filtros */
  filters: FilterConfig[]
  /** Valores actuales de los filtros */
  values: Record<string, any>
  /** Callback para remover un filtro */
  onRemove: (filterId: string) => void
  /** Callback para limpiar todos los filtros */
  onClearAll: () => void
  /** Clase CSS adicional */
  className?: string
}

/**
 * Obtener etiqueta de un valor de filtro
 */
const getFilterLabel = (filter: FilterConfig, value: any): string | null => {
  if (value === undefined || value === null || value === '') return null

  switch (filter.type) {
    case 'select':
      const option = filter.options?.find((opt) => opt.value === value)
      return option ? option.label : String(value)

    case 'multiselect':
    case 'search-select':
      if (!Array.isArray(value) || value.length === 0) return null
      if (value.length === 1) {
        const opt = filter.options?.find((o) => o.value === value[0])
        return opt ? opt.label : String(value[0])
      }
      return `${value.length} seleccionados`

    case 'date':
      try {
        return format(new Date(value), 'dd MMM yyyy', { locale: es })
      } catch {
        return String(value)
      }

    case 'daterange':
      const { start, end } = value
      if (!start && !end) return null
      if (start && end) {
        try {
          return `${format(new Date(start), 'dd MMM', { locale: es })} - ${format(new Date(end), 'dd MMM yyyy', { locale: es })}`
        } catch {
          return 'Rango de fechas'
        }
      }
      if (start) {
        try {
          return `Desde ${format(new Date(start), 'dd MMM yyyy', { locale: es })}`
        } catch {
          return 'Desde fecha'
        }
      }
      if (end) {
        try {
          return `Hasta ${format(new Date(end), 'dd MMM yyyy', { locale: es })}`
        } catch {
          return 'Hasta fecha'
        }
      }
      return null

    case 'toggle':
      return value ? filter.label : null

    case 'slider':
      return `${filter.label}: ${value}`

    default:
      return String(value)
  }
}

/**
 * Componente FilterChips
 */
const FilterChips = ({
  filters,
  values,
  onRemove,
  onClearAll,
  className,
}: FilterChipsProps) => {
  // Obtener chips activos
  const activeChips = useMemo(() => {
    return filters
      .map((filter) => {
        const value = values[filter.id]
        const label = getFilterLabel(filter, value)

        if (!label) return null

        return {
          filterId: filter.id,
          filterLabel: filter.label,
          valueLabel: label,
          value,
        }
      })
      .filter((chip): chip is NonNullable<typeof chip> => chip !== null)
  }, [filters, values])

  if (activeChips.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto pb-2', className)}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {activeChips.map((chip) => (
          <Badge
            key={chip.filterId}
            variant="secondary"
            className="flex items-center gap-1.5 px-2 py-1 text-xs whitespace-nowrap touch-manipulation"
          >
            <span className="font-medium">{chip.filterLabel}:</span>
            <span className="text-muted-foreground">{chip.valueLabel}</span>
            <button
              type="button"
              onClick={() => onRemove(chip.filterId)}
              className="ml-1 rounded-full hover:bg-muted p-0.5 transition-colors"
              aria-label={`Remover filtro ${chip.filterLabel}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      {activeChips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs whitespace-nowrap touch-manipulation shrink-0"
        >
          Limpiar todo
        </Button>
      )}
    </div>
  )
}

export default FilterChips

