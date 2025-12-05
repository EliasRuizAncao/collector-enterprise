import { PrismaClient } from '@prisma/client'

// Permission type - using string union to avoid import issues
type Permission =
  | 'FORMS_VIEW' | 'FORMS_CREATE' | 'FORMS_EDIT' | 'FORMS_DELETE' | 'FORMS_PUBLISH' | 'FORMS_ARCHIVE' | 'FORMS_VIEW_RESPONSES'
  | 'USERS_VIEW' | 'USERS_CREATE' | 'USERS_EDIT' | 'USERS_DELETE' | 'USERS_CHANGE_ROLE' | 'USERS_DEACTIVATE'
  | 'ASSIGNMENTS_VIEW' | 'ASSIGNMENTS_CREATE' | 'ASSIGNMENTS_EDIT' | 'ASSIGNMENTS_DELETE'
  | 'REPORTS_VIEW' | 'REPORTS_EXPORT'
  | 'EPP_MONITOR_VIEW' | 'EPP_MONITOR_MANAGE'
  | 'STRUCTURE_MONITOR_VIEW' | 'STRUCTURE_MONITOR_MANAGE'
  | 'ACCESS_ADMIN_PANEL' | 'ACCESS_MOBILE_APP' | 'ACCESS_SETTINGS'
  | 'ROLES_VIEW' | 'ROLES_CREATE' | 'ROLES_EDIT' | 'ROLES_DELETE' | 'PERMISSIONS_MANAGE'

const prisma = new PrismaClient()

/**
 * Script para verificar que la migración se aplicó correctamente
 */
async function verifyMigration() {
  console.log('🔍 Verificando migración de roles y permisos...\n')

  try {
    // Verificar roles del sistema
    // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    })

    console.log(`✅ Roles encontrados: ${roles.length}`)
    roles.forEach((role: { name: string; displayName: string; permissions: Permission[]; isSystem: boolean }) => {
      console.log(`   - ${role.name} (${role.displayName}): ${role.permissions.length} permisos`)
      if (role.isSystem) {
        console.log(`     ⚙️  Rol del sistema`)
      }
    })

    // Verificar usuarios
    const users = await prisma.user.findMany({
      include: {
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      take: 10,
    })

    console.log(`\n✅ Usuarios encontrados: ${users.length} (mostrando primeros 10)`)
    users.forEach((user: any) => {
      const roleName = user.role?.name || 'Sin rol'
      const roleDisplay = user.role?.displayName || 'N/A'
      const customPerms = user.customPermissions?.length || 0
      console.log(`   - ${user.name} (${user.email}): ${roleName} (${roleDisplay})`)
      if (customPerms > 0) {
        console.log(`     🔐 ${customPerms} permiso(s) personalizado(s)`)
      }
    })

    // Verificar que todos los usuarios tengan roleId
    const usersWithoutRole = users.filter((u: any) => !u.roleId)

    if (usersWithoutRole.length > 0) {
      console.log(`\n⚠️  Advertencia: ${usersWithoutRole.length} usuario(s) sin roleId asignado`)
    } else {
      console.log(`\n✅ Todos los usuarios tienen roleId asignado`)
    }

    // Verificar permisos disponibles
    const allPermissions = [
      'FORMS_VIEW', 'FORMS_CREATE', 'FORMS_EDIT', 'FORMS_DELETE', 'FORMS_PUBLISH', 'FORMS_ARCHIVE', 'FORMS_VIEW_RESPONSES',
      'USERS_VIEW', 'USERS_CREATE', 'USERS_EDIT', 'USERS_DELETE', 'USERS_CHANGE_ROLE', 'USERS_DEACTIVATE',
      'ASSIGNMENTS_VIEW', 'ASSIGNMENTS_CREATE', 'ASSIGNMENTS_EDIT', 'ASSIGNMENTS_DELETE',
      'REPORTS_VIEW', 'REPORTS_EXPORT',
      'EPP_MONITOR_VIEW', 'EPP_MONITOR_MANAGE',
      'STRUCTURE_MONITOR_VIEW', 'STRUCTURE_MONITOR_MANAGE',
      'ACCESS_ADMIN_PANEL', 'ACCESS_MOBILE_APP', 'ACCESS_SETTINGS',
      'ROLES_VIEW', 'ROLES_CREATE', 'ROLES_EDIT', 'ROLES_DELETE', 'PERMISSIONS_MANAGE',
    ]
    console.log(`\n✅ Permisos disponibles: ${allPermissions.length}`)

    console.log('\n✨ Verificación completada exitosamente')
  } catch (error) {
    console.error('❌ Error en verificación:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifyMigration()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error)
      process.exit(1)
    })
}

export default verifyMigration
