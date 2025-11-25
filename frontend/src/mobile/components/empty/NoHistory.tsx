import { Clock } from 'lucide-react'
import { EmptyState, type EmptyStateProps } from '../EmptyState'

interface NoHistoryProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  /**
   * Tipo de historial
   */
  type?: 'activity' | 'responses' | 'sync' | 'general'
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
 * NoHistory - Empty state para cuando no hay historial
 * Icon: ClockIcon
 * Título: "Sin historial"
 * Descripción: "Tu actividad aparecerá aquí"
 */
export const NoHistory = ({
  type = 'general',
  showAction = false,
  onAction,
  variant = 'full',
  ...props
}: NoHistoryProps) => {
  const descriptions = {
    activity: 'Tu actividad reciente aparecerá aquí',
    responses: 'Las respuestas que hayas enviado aparecerán aquí',
    sync: 'Tu historial de sincronización aparecerá aquí',
    general: 'Tu historial aparecerá aquí',
  }

  const titles = {
    activity: 'Sin actividad reciente',
    responses: 'Sin respuestas',
    sync: 'Sin historial de sincronización',
    general: 'Sin historial',
  }

  return (
    <EmptyState
      icon={<Clock className="h-full w-full text-muted-foreground" />}
      title={titles[type]}
      description={descriptions[type]}
      action={
        showAction && onAction
          ? {
              label: 'Ver actividad',
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

