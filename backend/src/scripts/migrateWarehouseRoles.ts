import { PrismaClient, Permission } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script para crear los roles de bodega y asignar permisos
 * Ejecutar con: npm run migrate:warehouse-roles
 */
async function migrateWarehouseRoles() {
  try {
    console.log('🚀 Iniciando migración de roles de bodega...')

    // Crear rol de Recepcionista de Bodega
    const recepcionistaRole = await prisma.role.upsert({
      where: { name: 'WAREHOUSE_RECEPTIONIST' },
      update: {
        displayName: 'Recepcionista de Bodega',
        description: 'Encargado de recibir y entregar materiales en bodega',
        permissions: [
          Permission.WAREHOUSE_SCAN_QR,
          Permission.WAREHOUSE_VIEW_STOCK,
          Permission.ACCESS_MOBILE_APP,
        ],
      },
      create: {
        name: 'WAREHOUSE_RECEPTIONIST',
        displayName: 'Recepcionista de Bodega',
        description: 'Encargado de recibir y entregar materiales en bodega',
        isSystem: false,
        permissions: [
          Permission.WAREHOUSE_SCAN_QR,
          Permission.WAREHOUSE_VIEW_STOCK,
          Permission.ACCESS_MOBILE_APP,
        ],
      },
    })

    console.log('✅ Rol Recepcionista de Bodega creado/actualizado:', recepcionistaRole.id)

    // Crear rol de Encargado de Bodega
    const encargadoRole = await prisma.role.upsert({
      where: { name: 'WAREHOUSE_MANAGER' },
      update: {
        displayName: 'Encargado de Bodega',
        description: 'Encargado de gestionar el stock y las operaciones de bodega',
        permissions: [
          Permission.WAREHOUSE_MANAGE_STOCK,
          Permission.WAREHOUSE_VIEW_STOCK,
          Permission.WAREHOUSE_SCAN_QR,
          Permission.ACCESS_ADMIN_PANEL,
          Permission.ACCESS_MOBILE_APP,
        ],
      },
      create: {
        name: 'WAREHOUSE_MANAGER',
        displayName: 'Encargado de Bodega',
        description: 'Encargado de gestionar el stock y las operaciones de bodega',
        isSystem: false,
        permissions: [
          Permission.WAREHOUSE_MANAGE_STOCK,
          Permission.WAREHOUSE_VIEW_STOCK,
          Permission.WAREHOUSE_SCAN_QR,
          Permission.ACCESS_ADMIN_PANEL,
          Permission.ACCESS_MOBILE_APP,
        ],
      },
    })

    console.log('✅ Rol Encargado de Bodega creado/actualizado:', encargadoRole.id)

    // Verificar que los permisos existen en el enum
    const allPermissions = Object.values(Permission)
    const warehousePermissions = [
      Permission.WAREHOUSE_REQUEST_MATERIALS,
      Permission.WAREHOUSE_AUTHORIZE_REQUESTS,
      Permission.WAREHOUSE_SCAN_QR,
      Permission.WAREHOUSE_MANAGE_STOCK,
      Permission.WAREHOUSE_VIEW_STOCK,
    ]

    console.log('\n📋 Permisos de bodega disponibles:')
    warehousePermissions.forEach((perm) => {
      if (allPermissions.includes(perm)) {
        console.log(`  ✅ ${perm}`)
      } else {
        console.log(`  ❌ ${perm} (NO EXISTE EN EL ENUM)`)
      }
    })

    console.log('\n✨ Migración de roles de bodega completada exitosamente!')
  } catch (error) {
    console.error('❌ Error en la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateWarehouseRoles()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error)
      process.exit(1)
    })
}

export default migrateWarehouseRoles

