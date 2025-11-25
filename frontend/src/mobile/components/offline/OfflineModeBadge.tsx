/**
 * OfflineModeBadge - Badge para indicar que un item está offline
 */

import { CloudOff } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'

export interface OfflineModeBadgeProps {
  /** Texto del badge */
  label?: string
  /** Variante del badge */
  variant?: 'default' | 'secondary' | 'outline'
  /** Tamaño */
  size?: 'sm' | 'md'
  /** Si mostrar icono */
  showIcon?: boolean
  /** Clase adicional */
  className?: string
}

const OfflineModeBadge = ({
  label = 'Local',
  variant = 'secondary',
  size = 'sm',
  showIcon = true,
  className,
}: OfflineModeBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        'bg-gray-500 text-white border-0',
        sizeClasses[size],
        className,
      )}
    >
      {showIcon && <CloudOff className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  )
}

export default OfflineModeBadge

