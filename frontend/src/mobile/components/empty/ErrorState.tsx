import { AlertCircle, RefreshCw } from 'lucide-react'
import { EmptyState, type EmptyStateProps } from '../EmptyState'

interface ErrorStateProps extends Omit<EmptyStateProps, 'icon' | 'title'> {
  /**
   * Mensaje de error
   */
  error?: string | Error | null
  /**
   * Título personalizado
   */
  title?: string
  /**
   * Callback para reintentar
   */
  onRetry?: () => void
  /**
   * Si mostrar botón de acción
   */
  showAction?: boolean
}

/**
 * ErrorState - Empty state para errores
 * Icon: AlertCircleIcon
 * Título: "Algo salió mal"
 * Descripción: mensaje de error
 * Action: "Reintentar"
 */
export const ErrorState = ({
  error,
  title = 'Algo salió mal',
  onRetry,
  showAction = true,
  variant = 'full',
  ...props
}: ErrorStateProps) => {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'

  return (
    <EmptyState
      icon={<AlertCircle className="h-full w-full text-destructive" />}
      title={title}
      description={errorMessage}
      action={
        showAction && onRetry
          ? {
              label: 'Reintentar',
              onClick: onRetry,
              variant: 'outline',
            }
          : undefined
      }
      variant={variant}
      className={props.className}
      {...props}
    />
  )
}

