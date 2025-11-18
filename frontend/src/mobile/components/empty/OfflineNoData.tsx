import { WifiOff, RefreshCw } from 'lucide-react'
import { EmptyState, type EmptyStateProps } from '../EmptyState'

interface OfflineNoDataProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  /**
   * Callback para reintentar
   */
  onRetry: () => void
  /**
   * Si mostrar botón de acción
   */
  showAction?: boolean
}

/**
 * OfflineNoData - Empty state para cuando no hay datos en cache offline
 * Icon: WifiOffIcon
 * Título: "Sin conexión"
 * Descripción: "No hay datos en cache para mostrar offline"
 * Action: "Reintentar"
 */
export const OfflineNoData = ({
  onRetry,
  showAction = true,
  variant = 'full',
  ...props
}: OfflineNoDataProps) => {
  return (
    <EmptyState
      icon={<WifiOff className="h-full w-full text-muted-foreground" />}
      title="Sin conexión"
      description="No hay datos en cache para mostrar offline. Conéctate a internet para ver contenido."
      action={
        showAction
          ? {
              label: 'Reintentar',
              onClick: onRetry,
              variant: 'outline',
            }
          : undefined
      }
      variant={variant}
      {...props}
    />
  )
}

