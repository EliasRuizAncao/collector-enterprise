import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/shared/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

/**
 * Componente para proteger rutas autenticadas
 * Detecta el rol del usuario y redirige automáticamente:
 * - ADMIN/MANAGER -> /admin/dashboard
 * - OPERATOR/SUPERVISOR -> /mobile/dashboard
 */
const ProtectedRoute = ({ children, allowedRoles, redirectTo }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth()
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

  // Redirigir según el rol del usuario si no hay una ruta específica
  if (user) {
    const userRole = user.role as 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR'
    const adminRoles = ['ADMIN', 'MANAGER']
    const mobileRoles = ['OPERATOR', 'SUPERVISOR']

    // Si está en una ruta admin pero es mobile role, redirigir a mobile
    if (location.pathname.startsWith('/admin') && mobileRoles.includes(userRole)) {
      return <Navigate to="/mobile/dashboard" replace />
    }

    // Si está en una ruta mobile pero es admin role, redirigir a admin
    if (location.pathname.startsWith('/mobile') && adminRoles.includes(userRole)) {
      return <Navigate to="/admin/dashboard" replace />
    }
  }

  // Chequeo opcional de roles permitidos
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirigir según el rol por defecto
    const userRole = user.role as 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR'
    const adminRoles = ['ADMIN', 'MANAGER']
    if (adminRoles.includes(userRole)) {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <Navigate to="/mobile/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

