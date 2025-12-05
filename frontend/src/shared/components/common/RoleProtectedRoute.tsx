import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/store/authStore'
import { usePermission } from '@/shared/hooks/usePermission'
import { Permission } from '@/shared/types/permissions'

type Role = 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: Role[] // Deprecated: usar PermissionGate con permisos específicos
  fallbackPath?: string
  /**
   * Permisos requeridos (preferido sobre allowedRoles)
   */
  permissions?: Permission[]
  /**
   * Cualquiera de estos permisos (OR)
   */
  anyPermission?: Permission[]
}

/**
 * Componente que protege rutas basándose en permisos o roles del usuario
 * @deprecated Usar PermissionGate directamente es preferible
 */
const RoleProtectedRoute = ({
  children,
  allowedRoles,
  fallbackPath = '/admin/dashboard',
  permissions,
  anyPermission,
}: RoleProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user)
  const { hasPermission, hasAnyPermission } = usePermission()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Priorizar permisos sobre roles
  if (permissions && permissions.length > 0) {
    const hasAll = permissions.every((p) => hasPermission(p))
    if (!hasAll) {
      return <Navigate to={fallbackPath} replace />
    }
  } else if (anyPermission && anyPermission.length > 0) {
    if (!hasAnyPermission(anyPermission)) {
      return <Navigate to={fallbackPath} replace />
    }
  } else if (allowedRoles && !allowedRoles.includes(user.role as Role)) {
    // Fallback a roles si no se especifican permisos (deprecated)
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}

export default RoleProtectedRoute

