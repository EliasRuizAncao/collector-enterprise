import { Lock, Unlock } from 'lucide-react'
import { EmptyState, type EmptyStateProps } from '../EmptyState'

interface PermissionDeniedProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  /**
   * Tipo de permiso requerido
   */
  permission: 'camera' | 'location' | 'notifications' | 'storage' | 'microphone' | string
  /**
   * Callback para dar permiso
   */
  onGrantPermission: () => void
  /**
   * Si mostrar botón de acción
   */
  showAction?: boolean
}

/**
 * PermissionDenied - Empty state para permisos denegados
 * Icon: LockIcon
 * Título: "Permiso denegado"
 * Descripción: "Necesitamos permiso para [X]"
 * Action: "Dar permiso"
 */
export const PermissionDenied = ({
  permission,
  onGrantPermission,
  showAction = true,
  variant = 'full',
  ...props
}: PermissionDeniedProps) => {
  const permissionNames: Record<string, string> = {
    camera: 'acceder a la cámara',
    location: 'acceder a tu ubicación',
    notifications: 'enviarte notificaciones',
    storage: 'acceder al almacenamiento',
    microphone: 'acceder al micrófono',
  }

  const permissionName = permissionNames[permission.toLowerCase()] || `permiso para ${permission}`

  return (
    <EmptyState
      icon={<Lock className="h-full w-full text-muted-foreground" />}
      title="Permiso denegado"
      description={`Necesitamos ${permissionName} para que puedas usar esta función.`}
      action={
        showAction
          ? {
              label: 'Dar permiso',
              onClick: onGrantPermission,
              variant: 'default',
            }
          : undefined
      }
      variant={variant}
      {...props}
    />
  )
}

