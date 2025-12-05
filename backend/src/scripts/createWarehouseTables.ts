import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script para crear las tablas de bodega directamente
 * Ejecutar con: npm run create:warehouse-tables
 */
async function createWarehouseTables() {
  try {
    console.log('🚀 Creando tablas de bodega...')

    // Crear MaterialRequestStatus enum si no existe
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "MaterialRequestStatus" AS ENUM (
            'PENDING',
            'APPROVED',
            'REJECTED',
            'READY_FOR_PICKUP',
            'DELIVERED',
            'CANCELLED'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('  ✅ MaterialRequestStatus enum creado/verificado')
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        console.error('  ❌ Error creando enum:', error.message)
        throw error
      }
      console.log('  ⚠️  Enum ya existe')
    }

    // Crear UserSupervisor table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "UserSupervisor" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "supervisorId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "UserSupervisor_pkey" PRIMARY KEY ("id")
        );
      `)
      console.log('  ✅ UserSupervisor table creada')
    } catch (error: any) {
      console.error('  ❌ Error creando UserSupervisor:', error.message)
      throw error
    }

    // Crear índices para UserSupervisor
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UserSupervisor_userId_supervisorId_key" 
        ON "UserSupervisor"("userId", "supervisorId");
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "UserSupervisor_userId_idx" 
        ON "UserSupervisor"("userId");
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "UserSupervisor_supervisorId_idx" 
        ON "UserSupervisor"("supervisorId");
      `)
      console.log('  ✅ Índices de UserSupervisor creados')
    } catch (error: any) {
      console.error('  ❌ Error creando índices UserSupervisor:', error.message)
    }

    // Agregar foreign keys para UserSupervisor
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "UserSupervisor" 
          ADD CONSTRAINT "UserSupervisor_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "UserSupervisor" 
          ADD CONSTRAINT "UserSupervisor_supervisorId_fkey" 
          FOREIGN KEY ("supervisorId") REFERENCES "User"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('  ✅ Foreign keys de UserSupervisor creados')
    } catch (error: any) {
      console.error('  ❌ Error creando foreign keys UserSupervisor:', error.message)
    }

    // Crear WarehouseProduct table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "WarehouseProduct" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "unit" TEXT NOT NULL,
          "stock" INTEGER NOT NULL DEFAULT 0,
          "minStock" INTEGER NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "WarehouseProduct_pkey" PRIMARY KEY ("id")
        );
      `)
      console.log('  ✅ WarehouseProduct table creada')
    } catch (error: any) {
      console.error('  ❌ Error creando WarehouseProduct:', error.message)
      throw error
    }

    // Crear índices para WarehouseProduct
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "WarehouseProduct_isActive_stock_idx" 
        ON "WarehouseProduct"("isActive", "stock");
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "WarehouseProduct_name_idx" 
        ON "WarehouseProduct"("name");
      `)
      console.log('  ✅ Índices de WarehouseProduct creados')
    } catch (error: any) {
      console.error('  ❌ Error creando índices WarehouseProduct:', error.message)
    }

    // Crear MaterialRequest table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MaterialRequest" (
          "id" TEXT NOT NULL,
          "requestNumber" TEXT NOT NULL,
          "requesterId" TEXT NOT NULL,
          "authorizerId" TEXT,
          "delivererId" TEXT,
          "receiverId" TEXT,
          "status" "MaterialRequestStatus" NOT NULL DEFAULT 'PENDING',
          "notes" TEXT,
          "rejectionReason" TEXT,
          "qrCode" TEXT,
          "signature" TEXT,
          "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "authorizedAt" TIMESTAMP(3),
          "rejectedAt" TIMESTAMP(3),
          "readyAt" TIMESTAMP(3),
          "deliveredAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MaterialRequest_pkey" PRIMARY KEY ("id")
        );
      `)
      console.log('  ✅ MaterialRequest table creada')
    } catch (error: any) {
      console.error('  ❌ Error creando MaterialRequest:', error.message)
      throw error
    }

    // Crear índices para MaterialRequest
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "MaterialRequest_requestNumber_key" 
        ON "MaterialRequest"("requestNumber");
      `)
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "MaterialRequest_qrCode_key" 
        ON "MaterialRequest"("qrCode");
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MaterialRequest_requesterId_status_idx" 
        ON "MaterialRequest"("requesterId", "status");
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MaterialRequest_authorizerId_status_idx" 
        ON "MaterialRequest"("authorizerId", "status");
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MaterialRequest_status_requestedAt_idx" 
        ON "MaterialRequest"("status", "requestedAt");
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MaterialRequest_qrCode_idx" 
        ON "MaterialRequest"("qrCode");
      `)
      console.log('  ✅ Índices de MaterialRequest creados')
    } catch (error: any) {
      console.error('  ❌ Error creando índices MaterialRequest:', error.message)
    }

    // Agregar foreign keys para MaterialRequest
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "MaterialRequest" 
          ADD CONSTRAINT "MaterialRequest_requesterId_fkey" 
          FOREIGN KEY ("requesterId") REFERENCES "User"("id") 
          ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "MaterialRequest" 
          ADD CONSTRAINT "MaterialRequest_authorizerId_fkey" 
          FOREIGN KEY ("authorizerId") REFERENCES "User"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "MaterialRequest" 
          ADD CONSTRAINT "MaterialRequest_delivererId_fkey" 
          FOREIGN KEY ("delivererId") REFERENCES "User"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "MaterialRequest" 
          ADD CONSTRAINT "MaterialRequest_receiverId_fkey" 
          FOREIGN KEY ("receiverId") REFERENCES "User"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('  ✅ Foreign keys de MaterialRequest creados')
    } catch (error: any) {
      console.error('  ❌ Error creando foreign keys MaterialRequest:', error.message)
    }

    // Crear MaterialRequestItem table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MaterialRequestItem" (
          "id" TEXT NOT NULL,
          "requestId" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL,
          "quantityDelivered" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT "MaterialRequestItem_pkey" PRIMARY KEY ("id")
        );
      `)
      console.log('  ✅ MaterialRequestItem table creada')
    } catch (error: any) {
      console.error('  ❌ Error creando MaterialRequestItem:', error.message)
      throw error
    }

    // Crear índices para MaterialRequestItem
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MaterialRequestItem_requestId_idx" 
        ON "MaterialRequestItem"("requestId");
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MaterialRequestItem_productId_idx" 
        ON "MaterialRequestItem"("productId");
      `)
      console.log('  ✅ Índices de MaterialRequestItem creados')
    } catch (error: any) {
      console.error('  ❌ Error creando índices MaterialRequestItem:', error.message)
    }

    // Agregar foreign keys para MaterialRequestItem
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "MaterialRequestItem" 
          ADD CONSTRAINT "MaterialRequestItem_requestId_fkey" 
          FOREIGN KEY ("requestId") REFERENCES "MaterialRequest"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "MaterialRequestItem" 
          ADD CONSTRAINT "MaterialRequestItem_productId_fkey" 
          FOREIGN KEY ("productId") REFERENCES "WarehouseProduct"("id") 
          ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
      console.log('  ✅ Foreign keys de MaterialRequestItem creados')
    } catch (error: any) {
      console.error('  ❌ Error creando foreign keys MaterialRequestItem:', error.message)
    }

    console.log('✅ Todas las tablas de bodega creadas exitosamente!')
  } catch (error) {
    console.error('❌ Error al crear tablas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createWarehouseTables()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error)
      process.exit(1)
    })
}

export default createWarehouseTables

