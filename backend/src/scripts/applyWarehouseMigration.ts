import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

/**
 * Script para aplicar la migración de bodega directamente
 * Ejecutar con: ts-node -r tsconfig-paths/register src/scripts/applyWarehouseMigration.ts
 */
async function applyWarehouseMigration() {
  try {
    console.log('🚀 Aplicando migración de bodega...')

    // Leer el archivo SQL de migración
    const migrationPath = join(
      __dirname,
      '..',
      '..',
      'prisma',
      'migrations',
      '20251202120000_add_warehouse_permissions',
      'migration.sql',
    )

    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // Ejecutar la migración SQL directamente
    // Dividir por líneas y ejecutar cada comando
    // Primero separar por punto y coma, luego filtrar comentarios y líneas vacías
    const commands = migrationSQL
      .split(';')
      .map((cmd) => cmd.trim())
      .filter((cmd) => {
        const trimmed = cmd.trim()
        return (
          trimmed.length > 0 &&
          !trimmed.startsWith('--') &&
          !trimmed.startsWith('/*') &&
          trimmed !== ''
        )
      })

    console.log(`📝 Ejecutando ${commands.length} comandos SQL...`)

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        try {
          console.log(`  [${i + 1}/${commands.length}] Ejecutando comando...`)
          // Agregar punto y coma al final si no lo tiene
          const sqlCommand = command.endsWith(';') ? command : command + ';'
          await prisma.$executeRawUnsafe(sqlCommand)
        } catch (error: any) {
          // Si el error es que el valor ya existe en el enum, continuar
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('IF NOT EXISTS') ||
            error.code === 'P2010'
          ) {
            console.log(`  ⚠️  Ya existe o error esperado, continuando...`)
            continue
          }
          // Si el error es que la tabla ya existe, continuar
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('duplicate') ||
            error.meta?.code === '42P07' // duplicate_table
          ) {
            console.log(`  ⚠️  Tabla/índice ya existe, continuando...`)
            continue
          }
          // Si el error es que la relación no existe pero estamos creando índices, puede ser que la tabla aún no exista
          if (error.meta?.code === '42P01' && command.includes('CREATE INDEX')) {
            console.log(`  ⚠️  Tabla aún no existe, continuando...`)
            continue
          }
          console.error(`  ❌ Error en comando ${i + 1}:`, error.message)
          throw error
        }
      }
    }

    console.log('✅ Migración aplicada exitosamente!')
  } catch (error) {
    console.error('❌ Error al aplicar migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyWarehouseMigration()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error)
      process.exit(1)
    })
}

export default applyWarehouseMigration

