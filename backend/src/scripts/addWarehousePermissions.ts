import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script para agregar los nuevos permisos de bodega al enum Permission
 * Ejecutar con: npm run add:warehouse-permissions
 */
async function addWarehousePermissions() {
  try {
    console.log('🚀 Agregando permisos de bodega al enum Permission...')

    const permissions = [
      'WAREHOUSE_REQUEST_MATERIALS',
      'WAREHOUSE_AUTHORIZE_REQUESTS',
      'WAREHOUSE_SCAN_QR',
      'WAREHOUSE_MANAGE_STOCK',
      'WAREHOUSE_VIEW_STOCK',
    ]

    for (const permission of permissions) {
      try {
        // Intentar agregar el valor al enum
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS '${permission}';`,
        )
        console.log(`  ✅ ${permission} agregado`)
      } catch (error: any) {
        // Si el error es que ya existe, continuar
        if (
          error.message?.includes('already exists') ||
          error.message?.includes('IF NOT EXISTS') ||
          error.code === 'P2010'
        ) {
          console.log(`  ⚠️  ${permission} ya existe, continuando...`)
          continue
        }
        console.error(`  ❌ Error al agregar ${permission}:`, error.message)
        throw error
      }
    }

    console.log('✅ Permisos agregados exitosamente!')
  } catch (error) {
    console.error('❌ Error al agregar permisos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addWarehousePermissions()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error)
      process.exit(1)
    })
}

export default addWarehousePermissions

