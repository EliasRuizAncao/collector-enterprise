import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script de migración para convertir usuarios del sistema antiguo (enum Role) al nuevo (model Role)
 * 
 * IMPORTANTE: Este script debe ejecutarse DESPUÉS de:
 * 1. Crear la migración de Prisma
 * 2. Ejecutar npx prisma migrate deploy
 * 3. Ejecutar el script seedRoles.ts para crear los roles del sistema
 * 
 * Este script:
 * - Busca usuarios que aún no tienen roleId asignado
 * - Asigna el roleId correspondiente según el nombre del rol antiguo
 * - Mantiene compatibilidad durante la transición
 */
async function migrateRoles() {
  console.log('🔄 Iniciando migración de roles...')

  try {
    // Obtener todos los roles del sistema
    // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
    const systemRoles = await prisma.role.findMany({
      where: { isSystem: true },
    })

    const roleMap = new Map(systemRoles.map((r: { name: string; id: string }) => [r.name, r.id]))

    console.log('📋 Roles del sistema encontrados:', systemRoles.map((r: { name: string }) => r.name).join(', '))

    // Buscar usuarios sin roleId (esto no debería pasar si la migración SQL se ejecutó correctamente)
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
    })

    let migratedCount = 0
    let skippedCount = 0

    for (const user of users) {
      // Si el usuario ya tiene un rol asignado, saltarlo
      if (user.role) {
        skippedCount++
        continue
      }

      // Intentar asignar un rol por defecto (OPERATOR)
      const defaultRoleId = roleMap.get('OPERATOR')
      if (!defaultRoleId) {
        console.error('❌ Error: No se encontró el rol OPERATOR. Ejecuta seedRoles.ts primero.')
        continue
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          roleId: defaultRoleId,
        } as any,
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
      }) as any

      migratedCount++
      console.log(`✅ Usuario ${user.email} migrado a rol OPERATOR`)
    }

    console.log(`\n✨ Migración completada:`)
    console.log(`   - Usuarios migrados: ${migratedCount}`)
    console.log(`   - Usuarios ya migrados: ${skippedCount}`)
  } catch (error) {
    console.error('❌ Error en migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateRoles()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error)
      process.exit(1)
    })
}

export default migrateRoles
