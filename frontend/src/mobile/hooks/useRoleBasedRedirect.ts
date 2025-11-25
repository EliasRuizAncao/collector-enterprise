import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/shared/hooks/useAuth'
import { useDeviceDetection } from './useDeviceDetection'
import {
  getAdminMobilePreference,
  getOperatorDesktopPreference,
  setAdminMobilePreference,
  setOperatorDesktopPreference,
} from '../utils/deviceDetector'

/**
 * Opciones para el hook de redirección basada en rol
 */
interface UseRoleBasedRedirectOptions {
  /**
   * Si true, solo muestra avisos sin redirigir automáticamente
   */
  warningOnly?: boolean
  /**
   * Callback cuando se muestra una advertencia
   */
  onWarning?: (message: string) => void
}

/**
 * Hook para redirección automática basada en rol y dispositivo
 * Redirige según:
 * - OPERATOR/SUPERVISOR + mobile -> /mobile/dashboard
 * - ADMIN/MANAGER + mobile -> /admin/dashboard (con advertencia)
 * - OPERATOR en desktop -> sugerir usar mobile
 * 
 * Respeta preferencias del usuario guardadas en localStorage
 */
export const useRoleBasedRedirect = (options: UseRoleBasedRedirectOptions = {}) => {
  const { warningOnly = false, onWarning } = options
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const { isMobile, isTablet } = useDeviceDetection()
  const [hasRedirected, setHasRedirected] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  // Determinar si debe usar versión mobile o desktop
  const shouldUseMobile = useCallback(() => {
    if (!user) return false

    const userRole = user.role as 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR'
    const adminRoles = ['ADMIN', 'MANAGER']
    const mobileRoles = ['OPERATOR', 'SUPERVISOR']

    // Verificar preferencias del usuario
    const adminPrefersMobile = getAdminMobilePreference()
    const operatorPrefersDesktop = getOperatorDesktopPreference()

    // Si es admin y prefiere usar mobile, permitir
    if (adminRoles.includes(userRole) && adminPrefersMobile) {
      return true
    }

    // Si es operador y prefiere usar desktop, no usar mobile
    if (mobileRoles.includes(userRole) && operatorPrefersDesktop) {
      return false
    }

    // Lógica por defecto: mobile roles usan mobile, admin roles usan desktop
    return mobileRoles.includes(userRole) && (isMobile || isTablet)
  }, [user, isMobile, isTablet])

  // Redirigir según rol y dispositivo
  useEffect(() => {
    // Solo redirigir si está autenticado y no se ha redirigido ya
    if (!isAuthenticated || !user || hasRedirected) return

    // No redirigir si ya está en la ruta correcta
    const currentPath = location.pathname

    const userRole = user.role as 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR'
    const adminRoles = ['ADMIN', 'MANAGER']
    const mobileRoles = ['OPERATOR', 'SUPERVISOR']
    const shouldUseMobileVersion = shouldUseMobile()

    // Caso 1: OPERATOR/SUPERVISOR en mobile -> /mobile/dashboard
    if (mobileRoles.includes(userRole) && shouldUseMobileVersion) {
      if (!currentPath.startsWith('/mobile')) {
        if (!warningOnly) {
          navigate('/mobile/dashboard', { replace: true })
          setHasRedirected(true)
        }
        return
      }
    }

    // Caso 2: ADMIN/MANAGER en mobile -> /admin/dashboard (con advertencia)
    if (adminRoles.includes(userRole) && (isMobile || isTablet) && !shouldUseMobileVersion) {
      if (currentPath.startsWith('/mobile')) {
        if (!warningOnly) {
          navigate('/admin/dashboard', { replace: true })
          setHasRedirected(true)
        }
        // Mostrar advertencia de versión no optimizada
        const message = 'Estás usando la versión admin en un dispositivo móvil. La experiencia puede no estar optimizada.'
        setShowWarning(true)
        onWarning?.(message)
        return
      }
    }

    // Caso 3: OPERATOR en desktop -> sugerir usar mobile (pero permitir si prefiere desktop)
    if (mobileRoles.includes(userRole) && !isMobile && !isTablet && !shouldUseMobileVersion) {
      if (currentPath.startsWith('/admin')) {
        // Solo mostrar sugerencia si no tiene preferencia guardada
        if (!getOperatorDesktopPreference()) {
          const message = 'Para operadores, recomendamos usar la versión móvil optimizada para campo. ¿Deseas continuar en desktop?'
          setShowWarning(true)
          onWarning?.(message)
        }
      }
    }
  }, [isAuthenticated, user, location.pathname, isMobile, isTablet, shouldUseMobile, hasRedirected, navigate, warningOnly, onWarning])

  /**
   * Guarda preferencia del admin de usar mobile
   */
  const saveAdminMobilePreference = useCallback((preferMobile: boolean) => {
    setAdminMobilePreference(preferMobile)
    // Recargar para aplicar cambios
    window.location.reload()
  }, [])

  /**
   * Guarda preferencia del operador de usar desktop
   */
  const saveOperatorDesktopPreference = useCallback((preferDesktop: boolean) => {
    setOperatorDesktopPreference(preferDesktop)
    // Recargar para aplicar cambios
    window.location.reload()
  }, [])

  return {
    shouldUseMobile: shouldUseMobile(),
    showWarning,
    setShowWarning,
    saveAdminMobilePreference,
    saveOperatorDesktopPreference,
    isMobile,
    isTablet,
  }
}

