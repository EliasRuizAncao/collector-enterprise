/**
 * TagSystem - Componente para mostrar tags como chips
 * Soporta visualización, interacción y límite de tags visibles
 */

import { useState } from 'react'
import { X, MoreHorizontal } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import type { Tag } from '../types/tags'
import { TAG_COLORS } from '../types/tags'
import * as LucideIcons from 'lucide-react'

/**
 * Props del componente TagSystem
 */
export interface TagSystemProps {
  /** Tags a mostrar */
  tags: Tag[]
  /** Máximo número de tags visibles (default: 3) */
  maxVisible?: number
  /** Callback cuando se hace tap en un tag (para filtrar) */
  onTagTap?: (tag: Tag) => void
  /** Callback cuando se hace long press (para opciones) */
  onTagLongPress?: (tag: Tag) => void
  /** Callback para eliminar tag */
  onTagRemove?: (tagId: string) => void
  /** Callback para editar tag */
  onTagEdit?: (tag: Tag) => void
  /** Si se pueden eliminar tags */
  removable?: boolean
  /** Tamaño de los chips */
  size?: 'sm' | 'md' | 'lg'
  /** Clase CSS adicional */
  className?: string
}

/**
 * Obtener icono por nombre
 */
const getIcon = (iconName?: string) => {
  if (!iconName) return null
  const IconComponent = (LucideIcons as any)[iconName]
  return IconComponent ? <IconComponent className="h-3 w-3" /> : null
}

/**
 * Componente TagSystem
 */
const TagSystem = ({
  tags,
  maxVisible = 3,
  onTagTap,
  onTagLongPress,
  onTagRemove,
  onTagEdit,
  removable = false,
  size = 'sm',
  className,
}: TagSystemProps) => {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  if (tags.length === 0) {
    return null
  }

  const visibleTags = tags.slice(0, maxVisible)
  const hiddenCount = tags.length - maxVisible

  const sizeClasses = {
    sm: 'h-5 px-2 text-xs',
    md: 'h-6 px-2.5 text-sm',
    lg: 'h-7 px-3 text-base',
  }

  const handleTagPress = (tag: Tag, event: React.MouseEvent | React.TouchEvent) => {
    // Detectar long press (500ms)
    const timer = setTimeout(() => {
      if (onTagLongPress) {
        onTagLongPress(tag)
      }
    }, 500)

    setLongPressTimer(timer)

    // Limpiar timer si se suelta antes
    const cleanup = () => {
      if (timer) {
        clearTimeout(timer)
        setLongPressTimer(null)
      }
    }

    if (event.type === 'mousedown' || event.type === 'touchstart') {
      window.addEventListener('mouseup', cleanup, { once: true })
      window.addEventListener('touchend', cleanup, { once: true })
    }
  }

  const handleTagClick = (tag: Tag, event: React.MouseEvent) => {
    // Limpiar timer de long press
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }

    // Si no fue long press, ejecutar tap normal
    if (onTagTap) {
      onTagTap(tag)
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {visibleTags.map((tag) => {
        const colorConfig = TAG_COLORS[tag.color]
        const icon = getIcon(tag.icon)

        return (
          <Badge
            key={tag.id}
            variant="outline"
            className={cn(
              'inline-flex items-center gap-1 border font-medium transition-colors touch-manipulation',
              sizeClasses[size],
              colorConfig.bg,
              colorConfig.text,
              colorConfig.border,
              onTagTap && 'cursor-pointer hover:opacity-80 active:scale-95',
            )}
            onClick={(e) => handleTagClick(tag, e)}
            onMouseDown={(e) => handleTagPress(tag, e)}
            onTouchStart={(e) => handleTagPress(tag, e)}
          >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span className="truncate max-w-[100px]">{tag.name}</span>
            {removable && onTagRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTagRemove(tag.id)
                }}
                className="ml-1 -mr-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                aria-label={`Eliminar tag ${tag.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        )
      })}

      {hiddenCount > 0 && (
        <Badge
          variant="outline"
          className={cn(
            'inline-flex items-center gap-1 border font-medium',
            sizeClasses[size],
            'bg-muted text-muted-foreground',
          )}
        >
          +{hiddenCount}
        </Badge>
      )}

      {/* Dropdown para tags ocultos (si hay más de maxVisible) */}
      {hiddenCount > 0 && (onTagEdit || onTagRemove) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-5 w-5', size === 'md' && 'h-6 w-6', size === 'lg' && 'h-7 w-7')}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {tags.slice(maxVisible).map((tag) => (
              <DropdownMenuItem
                key={tag.id}
                onClick={() => onTagTap?.(tag)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {getIcon(tag.icon) && <span>{getIcon(tag.icon)}</span>}
                  <span>{tag.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {onTagEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        onTagEdit(tag)
                      }}
                    >
                      Editar
                    </Button>
                  )}
                  {removable && onTagRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        onTagRemove(tag.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export default TagSystem

