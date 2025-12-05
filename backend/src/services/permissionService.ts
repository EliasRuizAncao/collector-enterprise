import { PrismaClient, Permission } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Servicio para gestión de permisos
 */
export class PermissionService {
  /**
   * Verifica si un usuario tiene un permiso específico
   * Combina permisos del rol + permisos personalizados del usuario
   */
  static async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              permissions: true,
            },
          },
        },
      })

      if (!user || !user.isActive) {
        return false
      }

      // Obtener permisos del rol
      const rolePermissions = user.role.permissions || []

      // Obtener permisos personalizados del usuario
      const customPermissions = user.customPermissions || []

      // Combinar: permisos del rol + permisos personalizados
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])]

      return allPermissions.includes(permission)
    } catch (error) {
      console.error('PermissionService.hasPermission error:', error)
      return false
    }
  }

  /**
   * Verifica si un usuario tiene al menos uno de los permisos especificados
   */
  static async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true
      }
    }
    return false
  }

  /**
   * Verifica si un usuario tiene todos los permisos especificados
   */
  static async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false
      }
    }
    return true
  }

  /**
   * Obtiene todos los permisos de un usuario (rol + personalizados)
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              permissions: true,
            },
          },
        },
      })

      if (!user || !user.isActive) {
        return []
      }

      const rolePermissions = user.role.permissions || []
      const customPermissions = user.customPermissions || []

      // Combinar y eliminar duplicados
      return [...new Set([...rolePermissions, ...customPermissions])]
    } catch (error) {
      console.error('PermissionService.getUserPermissions error:', error)
      return []
    }
  }

  /**
   * Obtiene todos los permisos disponibles en el sistema
   */
  static getAllAvailablePermissions(): Permission[] {
    return Object.values(Permission)
  }

  /**
   * Agrega permisos personalizados a un usuario
   */
  static async addCustomPermissions(
    userId: string,
    permissions: Permission[],
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { customPermissions: true },
      })

      if (!user) {
        throw new Error('Usuario no encontrado')
      }

      const currentPermissions = user.customPermissions || []
      const newPermissions = [...new Set([...currentPermissions, ...permissions])]

      await prisma.user.update({
        where: { id: userId },
        data: {
          customPermissions: {
            set: newPermissions,
          },
        },
      })
    } catch (error) {
      console.error('PermissionService.addCustomPermissions error:', error)
      throw error
    }
  }

  /**
   * Remueve permisos personalizados de un usuario
   */
  static async removeCustomPermissions(
    userId: string,
    permissions: Permission[],
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { customPermissions: true },
      })

      if (!user) {
        throw new Error('Usuario no encontrado')
      }

      const currentPermissions = user.customPermissions || []
      const newPermissions = currentPermissions.filter((p) => !permissions.includes(p))

      await prisma.user.update({
        where: { id: userId },
        data: {
          customPermissions: {
            set: newPermissions,
          },
        },
      })
    } catch (error) {
      console.error('PermissionService.removeCustomPermissions error:', error)
      throw error
    }
  }

  /**
   * Reemplaza todos los permisos personalizados de un usuario
   */
  static async setCustomPermissions(
    userId: string,
    permissions: Permission[],
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          customPermissions: {
            set: permissions,
          },
        },
      })
    } catch (error) {
      console.error('PermissionService.setCustomPermissions error:', error)
      throw error
    }
  }
}

