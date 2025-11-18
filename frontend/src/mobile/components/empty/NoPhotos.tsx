import { Camera } from 'lucide-react'
import { EmptyState, type EmptyStateProps } from '../EmptyState'

interface NoPhotosProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  /**
   * Callback para tomar foto
   */
  onTakePhoto: () => void
  /**
   * Si mostrar botón de acción
   */
  showAction?: boolean
}

/**
 * NoPhotos - Empty state para cuando no hay fotos
 * Icon: CameraIcon
 * Título: "Sin fotos"
 * Descripción: "Captura tu primera foto"
 * Action: "Tomar foto"
 */
export const NoPhotos = ({
  onTakePhoto,
  showAction = true,
  variant = 'full',
  ...props
}: NoPhotosProps) => {
  return (
    <EmptyState
      icon={<Camera className="h-full w-full text-muted-foreground" />}
      title="Sin fotos"
      description="Captura tu primera foto para comenzar"
      action={
        showAction
          ? {
              label: 'Tomar foto',
              onClick: onTakePhoto,
              variant: 'default',
            }
          : undefined
      }
      variant={variant}
      {...props}
    />
  )
}

