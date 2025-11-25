import { useState, useEffect, useCallback } from 'react'
import { X, Calendar, Clock } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'

/**
 * Tipo para filtros
 */
export interface AssignmentFilters {
  status?: 'all' | 'pending' | 'completed' | 'overdue'
  priority?: string[]
  formIds?: string[]
  dateFrom?: string
  dateTo?: string
  datePreset?: 'today' | 'thisWeek' | 'thisMonth' | 'custom'
}

/**
 * Props del componente AssignmentFilters
 */
interface AssignmentFiltersProps {
  /**
   * Si true, el sheet está abierto
   */
  open: boolean
  /**
   * Callback para cerrar el sheet
   */
  onClose: () => void
  /**
   * Filtros actuales
   */
  filters: AssignmentFilters
  /**
   * Callback cuando se aplican los filtros
   */
  onApply: (filters: AssignmentFilters) => void
  /**
   * Número de resultados con los filtros actuales
   */
  resultCount?: number
}

/**
 * Componente AssignmentFilters - Modal de filtros desde bottom
 * Sheet optimizado para touch con filtros por estado, fecha, formulario y prioridad
 */
const AssignmentFilters = ({
  open,
  onClose,
  filters,
  onApply,
  resultCount = 0,
}: AssignmentFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<AssignmentFilters>(filters)

  // Sincronizar filtros locales con props
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Resetear filtros
  const handleReset = useCallback(() => {
    const emptyFilters: AssignmentFilters = {
      status: 'all',
      priority: [],
      formIds: [],
      dateFrom: undefined,
      dateTo: undefined,
      datePreset: undefined,
    }
    setLocalFilters(emptyFilters)
  }, [])

  // Aplicar filtros
  const handleApply = useCallback(() => {
    onApply(localFilters)
    onClose()
  }, [localFilters, onApply, onClose])

  // Manejar cambio de estado
  const handleStatusChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      status: value as AssignmentFilters['status'],
    }))
  }

  // Manejar cambio de prioridad
  const handlePriorityChange = (priority: string, checked: boolean) => {
    setLocalFilters((prev) => {
      const current = prev.priority || []
      return {
        ...prev,
        priority: checked
          ? [...current, priority]
          : current.filter((p) => p !== priority),
      }
    })
  }

  // Manejar preset de fecha
  const handleDatePreset = (preset: 'today' | 'thisWeek' | 'thisMonth' | 'custom') => {
    const now = new Date()
    let dateFrom: string | undefined
    let dateTo: string | undefined

    switch (preset) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
        break
      case 'thisWeek':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        dateFrom = weekStart.toISOString()
        dateTo = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'thisMonth':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
        break
      case 'custom':
        // Mantener fechas existentes si hay
        return
    }

    setLocalFilters((prev) => ({
      ...prev,
      datePreset: preset,
      dateFrom,
      dateTo,
    }))
  }

  // Contar filtros activos
  const activeFiltersCount = useCallback(() => {
    let count = 0
    if (localFilters.status && localFilters.status !== 'all') count++
    if (localFilters.priority && localFilters.priority.length > 0) count++
    if (localFilters.formIds && localFilters.formIds.length > 0) count++
    if (localFilters.dateFrom || localFilters.dateTo) count++
    return count
  }, [localFilters])

  const priorities = [
    { id: 'urgent', label: 'Urgente', color: 'bg-destructive' },
    { id: 'high', label: 'Alta', color: 'bg-orange-500' },
    { id: 'medium', label: 'Media', color: 'bg-yellow-500' },
    { id: 'low', label: 'Baja', color: 'bg-muted-foreground' },
  ]

  return (
    <Sheet open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[70vh] max-h-[600px] p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3">
            <SheetTitle className="text-mobile-h3 font-semibold">Filtros</SheetTitle>
            <div className="flex items-center gap-2">
              {activeFiltersCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-mobile-caption text-muted-foreground hover:text-foreground"
                >
                  Resetear
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full touch-manipulation"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-6">
              {/* Sección Estado */}
              <div className="space-y-3">
                <Label className="text-mobile-h4 font-semibold">Estado</Label>
                <RadioGroup
                  value={localFilters.status || 'all'}
                  onValueChange={handleStatusChange}
                  className="grid grid-cols-2 gap-3"
                >
                  {[
                    { value: 'all', label: 'Todas' },
                    { value: 'pending', label: 'Pendientes' },
                    { value: 'completed', label: 'Completadas' },
                    { value: 'overdue', label: 'Vencidas' },
                  ].map((option) => {
                    const isSelected = localFilters.status === option.value || (!localFilters.status && option.value === 'all')
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          'tap-target flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors duration-200 touch-manipulation',
                          'active:bg-accent/50',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50',
                        )}
                      >
                        <RadioGroupItem value={option.value} id={`status-${option.value}`} />
                        <Label
                          htmlFor={`status-${option.value}`}
                          className="flex-1 cursor-pointer font-medium"
                        >
                          {option.label}
                        </Label>
                      </label>
                    )
                  })}
                </RadioGroup>
              </div>

              <Separator />

              {/* Sección Fecha */}
              <div className="space-y-3">
                <Label className="text-mobile-h4 font-semibold">Fecha</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'today', label: 'Hoy', icon: Clock },
                    { id: 'thisWeek', label: 'Esta semana', icon: Calendar },
                    { id: 'thisMonth', label: 'Este mes', icon: Calendar },
                    { id: 'custom', label: 'Personalizado', icon: Calendar },
                  ].map((preset) => {
                    const Icon = preset.icon
                    const isSelected = localFilters.datePreset === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleDatePreset(preset.id as any)}
                        className={cn(
                          'tap-target flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors duration-200 touch-manipulation',
                          'active:bg-accent/50',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{preset.label}</span>
                      </button>
                    )
                  })}
                </div>
                {localFilters.datePreset === 'custom' && (
                  <div className="mt-3 text-center text-sm text-muted-foreground">
                    Date range picker personalizado - TODO: Implementar
                  </div>
                )}
              </div>

              <Separator />

              {/* Sección Prioridad */}
              <div className="space-y-3">
                <Label className="text-mobile-h4 font-semibold">Prioridad</Label>
                <div className="grid grid-cols-2 gap-3">
                  {priorities.map((priority) => {
                    const isSelected = localFilters.priority?.includes(priority.id) || false
                    return (
                      <label
                        key={priority.id}
                        className={cn(
                          'tap-target flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors duration-200 touch-manipulation',
                          'active:bg-accent/50',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50',
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handlePriorityChange(priority.id, checked as boolean)
                          }
                        />
                        <div className="flex flex-1 items-center gap-2">
                          <div className={cn('h-3 w-3 rounded-full', priority.color)} />
                          <Label className="flex-1 cursor-pointer font-medium">{priority.label}</Label>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Sección Formulario */}
              <div className="space-y-3">
                <Label className="text-mobile-h4 font-semibold">Formulario</Label>
                <div className="text-center text-sm text-muted-foreground">
                  Multi-select de formularios - TODO: Implementar
                </div>
                {localFilters.formIds && localFilters.formIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {localFilters.formIds.map((formId) => (
                      <Badge key={formId} variant="secondary" className="gap-1 pr-1">
                        {formId}
                        <button
                          type="button"
                          onClick={() => {
                            setLocalFilters((prev) => ({
                              ...prev,
                              formIds: prev.formIds?.filter((id) => id !== formId),
                            }))
                          }}
                          className="ml-1 rounded-full hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Sticky */}
          <div className="sticky bottom-0 border-t border-border/60 bg-background p-4 safe-bottom">
            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                onClick={handleApply}
                disabled={activeFiltersCount() === 0}
              >
                Ver resultados ({resultCount > 0 ? resultCount : '0'} tareas)
              </Button>
              {activeFiltersCount() > 0 && (
                <Button variant="ghost" className="w-full" onClick={handleReset}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default AssignmentFilters

