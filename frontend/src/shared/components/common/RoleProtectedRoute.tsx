import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/store/authStore'

type Role = 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: Role[]
  fallbackPath?: string
}

/**
 * Componente que protege rutas basándose en el rol del usuario
 */
const RoleProtectedRoute = ({
  children,
  allowedRoles,
  fallbackPath = '/admin/dashboard',
}: RoleProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role as Role)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}

export default RoleProtectedRoute

