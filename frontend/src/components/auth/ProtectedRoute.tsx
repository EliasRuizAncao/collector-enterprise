import { Navigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

// Componente reusable para proteger rutas del panel administrativo
const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth()

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
    return <Navigate to="/login" replace />
  }

  // Chequeo opcional de roles para futuro
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

