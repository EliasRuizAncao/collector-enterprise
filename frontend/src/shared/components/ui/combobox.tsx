import { Check } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

/**
 * Props para el componente Combobox
 */
interface ComboboxProps<T> {
  options: Array<{ value: T; label: string }>
  value?: T
  onValueChange: (value: T) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
}

/**
 * Componente Combobox para búsqueda y selección de opciones
 * Usa Select de Radix UI para mejor compatibilidad con Dialogs
 */
export function Combobox<T extends string>({
  options,
  value,
  onValueChange,
  placeholder = 'Selecciona una opción...',
  searchPlaceholder: _searchPlaceholder,
  emptyText,
  disabled = false,
}: ComboboxProps<T>) {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Select
      value={value}
      onValueChange={(val: string) => onValueChange(val as T)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {emptyText || 'No hay opciones disponibles'}
          </div>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center">
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === option.value ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {option.label}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

