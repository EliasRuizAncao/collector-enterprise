import * as React from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

// Checkbox accesible inspirado en shadcn/ui, sin dependencias adicionales
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
    <label className="inline-flex items-center">
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          'peer sr-only',
          className,
        )}
        checked={checked}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        disabled={disabled}
        {...props}
      />
      <span
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border border-slate-600 bg-white transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'bg-white text-transparent',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )}
        aria-hidden="true"
      >
        <Check className="h-3 w-3" />
      </span>
    </label>
  ),
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }


