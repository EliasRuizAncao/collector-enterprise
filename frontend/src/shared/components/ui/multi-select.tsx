import * as React from 'react'
import { X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Checkbox } from '@/shared/components/ui/checkbox'

/**
 * Props para el componente MultiSelect
 */
interface MultiSelectProps<T extends string> {
  options: Array<{ value: T; label: string }>
  selected: T[]
  onSelectionChange: (selected: T[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  maxDisplay?: number
}

/**
 * Componente MultiSelect para seleccionar múltiples opciones
 * Usa Popover + Checkboxes para mejor compatibilidad con Dialogs
 */
export function MultiSelect<T extends string>({
  options,
  selected,
  onSelectionChange,
  placeholder = 'Selecciona opciones...',
  searchPlaceholder,
  emptyText = 'No se encontraron resultados.',
  disabled = false,
  maxDisplay = 3,
}: MultiSelectProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedOptions = options.filter((option) => selected.includes(option.value))
  
  // Filtrar opciones por búsqueda
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const handleToggle = React.useCallback((value: T) => {
    if (selected.includes(value)) {
      onSelectionChange(selected.filter((item) => item !== value))
    } else {
      onSelectionChange([...selected, value])
    }
  }, [selected, onSelectionChange])

  const handleRemove = React.useCallback((value: T, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(selected.filter((item) => item !== value))
  }, [selected, onSelectionChange])

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-10 h-auto py-2"
          disabled={disabled}
          type="button"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, maxDisplay).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="mr-1 mb-1"
                  >
                    {option.label}
                    <button
                      type="button"
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => handleRemove(option.value, e)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
                {selected.length > maxDisplay && (
                  <Badge variant="secondary" className="mr-1 mb-1">
                    +{selected.length - maxDisplay} más
                  </Badge>
                )}
              </>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        side="bottom"
        onOpenAutoFocus={(e: React.FocusEvent) => e.preventDefault()}
      >
        {searchPlaceholder && (
          <div className="border-b p-2">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <div className="max-h-[200px] overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            <div className="p-2">
              {filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <div
                    key={option.value}
                    className={cn(
                      'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm outline-none cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent'
                    )}
                    onClick={() => handleToggle(option.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(option.value)}
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="flex-1">{option.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

