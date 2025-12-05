import { useCallback, useEffect } from 'react'
import { useAuthStore } from '@/shared/store/authStore'
import { Permission } from '@/shared/types/permissions'

/**
 * Hook para verificar permisos del usuario actual
 */
export const usePermission = () => {
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)

  // Log de debug cuando se cargan los permisos
  useEffect(() => {
    if (permissions && permissions.length > 0) {
      const normalizedPerms = permissions.map((p) => String(p))
      console.log('[usePermission] Permisos disponibles:', {
        count: permissions.length,
        permissions: normalizedPerms.slice(0, 10), // Primeros 10
        hasAdminAccess: normalizedPerms.includes(String(Permission.ACCESS_ADMIN_PANEL)),
        hasMobileAccess: normalizedPerms.includes(String(Permission.ACCESS_MOBILE_APP)),
        allPermissions: normalizedPerms,
      })
    } else if (permissions === null) {
      console.log('[usePermission] Permisos: null (aún no cargados)')
    } else if (permissions && permissions.length === 0) {
      console.log('[usePermission] Permisos: array vacío')
    }
  }, [permissions])

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user || !permissions) {
        console.log('[usePermission] hasPermission: false - no user or permissions', {
          hasUser: !!user,
          permissions: permissions,
          permissionRequested: permission,
        })
        return false
      }

      // Normalizar para comparar: convertir a string si es necesario
      const normalizedPermissions = permissions.map((p) => String(p))
      const normalizedPermission = String(permission)
      
      const hasAccess = normalizedPermissions.includes(normalizedPermission)
      
      if (!hasAccess) {
        console.log('[usePermission] hasPermission: false', {
          permissionRequested: normalizedPermission,
          availablePermissions: normalizedPermissions.slice(0, 5), // Primeros 5 para no saturar
          totalPermissions: normalizedPermissions.length,
        })
      }

      return hasAccess
    },
    [user, permissions],
  )

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  const hasAnyPermission = useCallback(
    (permissionList: Permission[]): boolean => {
      if (!user || !permissions) {
        console.log('[usePermission] hasAnyPermission: false - no user or permissions', {
          hasUser: !!user,
          hasPermissions: !!permissions,
          permissionListRequested: permissionList,
        })
        return false
      }

      // Normalizar para comparar: convertir a string si es necesario
      const normalizedPermissions = permissions.map((p) => String(p))
      const normalizedPermissionList = permissionList.map((p) => String(p))
      
      const hasAccess = normalizedPermissionList.some((permission) =>
        normalizedPermissions.includes(permission)
      )
      
      if (!hasAccess) {
        console.log('[usePermission] hasAnyPermission: false', {
          permissionListRequested: normalizedPermissionList,
          availablePermissions: normalizedPermissions.slice(0, 10),
          totalPermissions: normalizedPermissions.length,
        })
      }

      return hasAccess
    },
    [user, permissions],
  )

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  const hasAllPermissions = useCallback(
    (permissionList: Permission[]): boolean => {
      if (!user || !permissions) {
        return false
      }

      return permissionList.every((permission) => permissions.includes(permission))
    },
    [user, permissions],
  )

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: permissions || [],
    // Helper para verificar si tiene permisos de admin (basado en permisos, no roles)
    isAdmin: hasPermission(Permission.ROLES_VIEW) || hasPermission(Permission.ROLES_CREATE),
  }
}

