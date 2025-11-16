import { ClipboardList } from 'lucide-react'
import { EmptyState, EmptyStateProps } from '../EmptyState'

interface NoAssignmentsProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  /**
   * Si mostrar botón de acción
   */
  showAction?: boolean
  /**
   * Callback cuando se hace click en acción
   */
  onAction?: () => void
}

/**
 * NoAssignments - Empty state para cuando no hay tareas
 * Icon: ClipboardIcon
 * Título: "No tienes tareas"
 * Descripción: "Cuando te asignen tareas aparecerán aquí"
 * Sin acción por defecto
 */
export const NoAssignments = ({
  showAction = false,
  onAction,
  variant = 'full',
  title,
  description,
  ...props
}: NoAssignmentsProps) => {
  return (
    <EmptyState
      icon={<ClipboardList className="h-full w-full text-muted-foreground" />}
      title={title || 'No tienes tareas'}
      description={description || 'Cuando te asignen tareas aparecerán aquí'}
      action={
        showAction && onAction
          ? {
              label: 'Ver todas',
              onClick: onAction,
              variant: 'outline',
            }
          : undefined
      }
      variant={variant}
      {...props}
    />
  )
}

