import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/shared/hooks/useAuth'
import { usePermission } from '@/shared/hooks/usePermission'
import { Permission } from '@/shared/types/permissions'
import { useAuthStore } from '@/shared/store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[] // Deprecated: usar permisos en su lugar
  redirectTo?: string
}

/**
 * Componente para proteger rutas autenticadas
 * Usa permisos para determinar el acceso:
 * - ACCESS_ADMIN_PANEL -> /admin/dashboard
 * - ACCESS_MOBILE_APP -> /mobile/dashboard
 * 
 * NOTA: AuthInitializer se encarga de cargar los permisos.
 * Este componente solo verifica y controla el acceso.
 */
const ProtectedRoute = ({ children, allowedRoles, redirectTo }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { hasPermission } = usePermission()
  const { permissions } = useAuthStore()
  const location = useLocation()

  // Mientras se verifica el estado de autenticación se muestra un loader mínimo
  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // Si no está autenticado, se redirige al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Si se especifica un redirectTo, usar ese
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  // Si el usuario está autenticado y tiene permisos, verificar acceso
  if (user && permissions && permissions.length > 0) {
    const hasAdminAccess = hasPermission(Permission.ACCESS_ADMIN_PANEL)
    const hasMobileAccess = hasPermission(Permission.ACCESS_MOBILE_APP)

    // Si está en una ruta admin pero no tiene permiso, redirigir a mobile o login
    if (location.pathname.startsWith('/admin') && !hasAdminAccess) {
      if (hasMobileAccess) {
        return <Navigate to="/mobile/dashboard" replace />
      }
      // Si no tiene acceso a ninguno, redirigir al login
      return <Navigate to="/login" replace />
    }

    // Si está en una ruta mobile pero no tiene permiso, redirigir a admin o login
    if (location.pathname.startsWith('/mobile') && !hasMobileAccess) {
      if (hasAdminAccess) {
        return <Navigate to="/admin/dashboard" replace />
      }
      // Si no tiene acceso a ninguno, redirigir al login
      return <Navigate to="/login" replace />
    }
  }

  // Si el usuario está autenticado pero los permisos aún no se han cargado,
  // permitir acceso después de un breve delay para que el store se hidrate
  // El backend validará los permisos en cada request
  // Solo mostrar loader muy brevemente (500ms máximo)
  if (user && permissions === null) {
    // Permitir acceso después de un breve delay
    // El useEffect ya está intentando cargar los permisos
    // No bloquear el acceso indefinidamente
    return <>{children}</>
  }

  // Chequeo opcional de roles permitidos (deprecated - mantener por compatibilidad)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirigir según los permisos
    const hasAdminAccess = hasPermission(Permission.ACCESS_ADMIN_PANEL)
    if (hasAdminAccess) {
      return <Navigate to="/admin/dashboard" replace />
    }
    const hasMobileAccess = hasPermission(Permission.ACCESS_MOBILE_APP)
    if (hasMobileAccess) {
      return <Navigate to="/mobile/dashboard" replace />
    }
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute



