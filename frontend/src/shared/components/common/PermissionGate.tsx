import { type ReactNode } from 'react'
import { usePermission } from '@/shared/hooks/usePermission'
import { Permission } from '@/shared/types/permissions'

interface PermissionGateProps {
  /**
   * Permiso requerido (si se proporciona, el usuario debe tenerlo)
   */
  permission?: Permission
  /**
   * Lista de permisos (si se proporciona, el usuario debe tener al menos uno)
   */
  anyPermission?: Permission[]
  /**
   * Lista de permisos (si se proporciona, el usuario debe tener todos)
   */
  allPermissions?: Permission[]
  /**
   * Contenido a mostrar si el usuario tiene el permiso
   */
  children: ReactNode
  /**
   * Contenido a mostrar si el usuario NO tiene el permiso (opcional)
   */
  fallback?: ReactNode
  /**
   * Si true, oculta completamente el componente en lugar de mostrar fallback
   */
  hideIfNoPermission?: boolean
}

/**
 * Componente que muestra contenido solo si el usuario tiene los permisos requeridos
 */
const PermissionGate = ({
  permission,
  anyPermission,
  allPermissions,
  children,
  fallback = null,
  hideIfNoPermission = false,
}: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission(anyPermission)
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(allPermissions)
  } else {
    // Si no se especifica ningún permiso, mostrar siempre
    hasAccess = true
  }

  if (!hasAccess) {
    if (hideIfNoPermission) {
      return null
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default PermissionGate

