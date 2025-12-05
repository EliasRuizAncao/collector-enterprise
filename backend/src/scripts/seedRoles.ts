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
 * Script para crear los roles del sistema con sus permisos por defecto
 * Este script debe ejecutarse después de la migración inicial
 */
async function seedRoles() {
  console.log('🌱 Iniciando seeding de roles del sistema...')

  try {
    // Definir roles del sistema con sus permisos
    const systemRoles = [
      {
        name: 'ADMIN',
        displayName: 'Administrador',
        description: 'Acceso completo al sistema. Puede gestionar usuarios, roles, permisos y todas las funcionalidades.',
        isSystem: true,
        permissions: [
          // Todos los permisos
          'FORMS_VIEW', 'FORMS_CREATE', 'FORMS_EDIT', 'FORMS_DELETE', 'FORMS_PUBLISH', 'FORMS_ARCHIVE', 'FORMS_VIEW_RESPONSES',
          'USERS_VIEW', 'USERS_CREATE', 'USERS_EDIT', 'USERS_DELETE', 'USERS_CHANGE_ROLE', 'USERS_DEACTIVATE',
          'ASSIGNMENTS_VIEW', 'ASSIGNMENTS_CREATE', 'ASSIGNMENTS_EDIT', 'ASSIGNMENTS_DELETE',
          'REPORTS_VIEW', 'REPORTS_EXPORT',
          'EPP_MONITOR_VIEW', 'EPP_MONITOR_MANAGE',
          'STRUCTURE_MONITOR_VIEW', 'STRUCTURE_MONITOR_MANAGE',
          'ACCESS_ADMIN_PANEL', 'ACCESS_MOBILE_APP', 'ACCESS_SETTINGS',
          'ROLES_VIEW', 'ROLES_CREATE', 'ROLES_EDIT', 'ROLES_DELETE', 'PERMISSIONS_MANAGE',
        ] as Permission[],
      },
      {
        name: 'MANAGER',
        displayName: 'Gerente',
        description: 'Puede gestionar formularios, asignaciones, reportes y monitoreo. No puede gestionar usuarios ni roles.',
        isSystem: true,
        permissions: [
          // Formularios
          'FORMS_VIEW', 'FORMS_CREATE', 'FORMS_EDIT', 'FORMS_DELETE', 'FORMS_PUBLISH', 'FORMS_ARCHIVE', 'FORMS_VIEW_RESPONSES',
          // Asignaciones
          'ASSIGNMENTS_VIEW', 'ASSIGNMENTS_CREATE', 'ASSIGNMENTS_EDIT', 'ASSIGNMENTS_DELETE',
          // Reportes
          'REPORTS_VIEW', 'REPORTS_EXPORT',
          // Monitoreo
          'EPP_MONITOR_VIEW', 'EPP_MONITOR_MANAGE',
          'STRUCTURE_MONITOR_VIEW', 'STRUCTURE_MONITOR_MANAGE',
          // Acceso
          'ACCESS_ADMIN_PANEL',
        ] as Permission[],
      },
      {
        name: 'SUPERVISOR',
        displayName: 'Supervisor',
        description: 'Puede ver formularios, asignaciones, reportes y monitoreo. Puede crear y editar formularios pero no publicarlos.',
        isSystem: true,
        permissions: [
          // Formularios (sin publicar ni eliminar)
          'FORMS_VIEW', 'FORMS_CREATE', 'FORMS_EDIT', 'FORMS_VIEW_RESPONSES',
          // Asignaciones (solo ver)
          'ASSIGNMENTS_VIEW',
          // Reportes (solo ver)
          'REPORTS_VIEW',
          // Monitoreo
          'EPP_MONITOR_VIEW', 'STRUCTURE_MONITOR_VIEW',
          // Acceso
          'ACCESS_ADMIN_PANEL', 'ACCESS_MOBILE_APP',
        ] as Permission[],
      },
      {
        name: 'OPERATOR',
        displayName: 'Operador',
        description: 'Puede ver y responder formularios asignados. Acceso solo a la aplicación móvil.',
        isSystem: true,
        permissions: [
          // Formularios (solo ver y responder)
          'FORMS_VIEW',
          // Acceso
          'ACCESS_MOBILE_APP',
        ] as Permission[],
      },
    ]

    // Crear o actualizar cada rol
    for (const roleData of systemRoles) {
      // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name },
      })

      if (existingRole) {
        // Actualizar rol existente
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        await prisma.role.update({
          where: { id: existingRole.id },
          data: {
            displayName: roleData.displayName,
            description: roleData.description,
            permissions: {
              set: roleData.permissions,
            },
            isSystem: true, // Asegurar que sea del sistema
          },
        })
        console.log(`✅ Rol actualizado: ${roleData.displayName}`)
      } else {
        // Crear nuevo rol
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        await prisma.role.create({
          data: {
            name: roleData.name,
            displayName: roleData.displayName,
            description: roleData.description,
            permissions: {
              set: roleData.permissions,
            },
            isSystem: true,
          },
        })
        console.log(`✅ Rol creado: ${roleData.displayName}`)
      }
    }

    console.log('✨ Seeding de roles completado exitosamente')
  } catch (error) {
    console.error('❌ Error en seeding de roles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedRoles()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error)
      process.exit(1)
    })
}

export default seedRoles
