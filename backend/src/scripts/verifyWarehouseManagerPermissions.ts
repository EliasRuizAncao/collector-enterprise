import { PrismaClient, Permission } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script para verificar que el rol "Encargado de Bodega" tenga los permisos correctos
 * Ejecutar con: npx ts-node -r tsconfig-paths/register src/scripts/verifyWarehouseManagerPermissions.ts
 */
async function verifyWarehouseManagerPermissions() {
  try {
    console.log('🔍 Verificando permisos del rol "Encargado de Bodega"...\n')

    // Buscar el rol
    const role = await prisma.role.findUnique({
      where: { name: 'WAREHOUSE_MANAGER' },
      select: {
        id: true,
        name: true,
        displayName: true,
        permissions: true,
      },
    })

    if (!role) {
      console.error('❌ El rol WAREHOUSE_MANAGER no existe')
      console.log('💡 Ejecuta: npm run migrate:warehouse-roles')
      return
    }

    console.log(`✅ Rol encontrado: ${role.displayName} (${role.name})`)
    console.log(`📋 Permisos actuales (${role.permissions.length}):`)
    role.permissions.forEach((perm) => {
      console.log(`   - ${perm}`)
    })

    // Verificar permisos requeridos
    const requiredPermissions = [
      Permission.ACCESS_ADMIN_PANEL,
      Permission.ACCESS_MOBILE_APP,
      Permission.WAREHOUSE_MANAGE_STOCK,
      Permission.WAREHOUSE_VIEW_STOCK,
      Permission.WAREHOUSE_SCAN_QR,
    ]

    console.log('\n🔍 Verificando permisos requeridos:')
    const missingPermissions: Permission[] = []
    const hasPermissions: Permission[] = []

    requiredPermissions.forEach((perm) => {
      if (role.permissions.includes(perm)) {
        hasPermissions.push(perm)
        console.log(`   ✅ ${perm}`)
      } else {
        missingPermissions.push(perm)
        console.log(`   ❌ ${perm} - FALTANTE`)
      }
    })

    if (missingPermissions.length > 0) {
      console.log('\n⚠️  PERMISOS FALTANTES:')
      missingPermissions.forEach((perm) => {
        console.log(`   - ${perm}`)
      })
      console.log('\n💡 Ejecuta: npm run migrate:warehouse-roles para actualizar el rol')
    } else {
      console.log('\n✅ Todos los permisos requeridos están presentes')
    }

    // Verificar usuarios con este rol
    const users = await prisma.user.findMany({
      where: {
        roleId: role.id,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    console.log(`\n👥 Usuarios con este rol (${users.length}):`)
    if (users.length === 0) {
      console.log('   ⚠️  No hay usuarios activos con este rol')
    } else {
      users.forEach((user) => {
        console.log(`   - ${user.name} (${user.email})`)
      })
    }

    console.log('\n✨ Verificación completada')
  } catch (error) {
    console.error('❌ Error en la verificación:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifyWarehouseManagerPermissions()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error)
      process.exit(1)
    })
}

export default verifyWarehouseManagerPermissions

