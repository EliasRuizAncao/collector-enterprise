-- Add new warehouse permissions to Permission enum
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'WAREHOUSE_REQUEST_MATERIALS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'WAREHOUSE_AUTHORIZE_REQUESTS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'WAREHOUSE_SCAN_QR';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'WAREHOUSE_MANAGE_STOCK';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'WAREHOUSE_VIEW_STOCK';

-- Add new notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATERIAL_REQUEST_PENDING';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATERIAL_REQUEST_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATERIAL_REQUEST_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MATERIAL_REQUEST_READY';

-- Create MaterialRequestStatus enum
CREATE TYPE "MaterialRequestStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'READY_FOR_PICKUP',
  'DELIVERED',
  'CANCELLED'
);

-- Create UserSupervisor table (many-to-many relationship)
CREATE TABLE "UserSupervisor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSupervisor_pkey" PRIMARY KEY ("id")
);

-- Create indexes for UserSupervisor
CREATE UNIQUE INDEX "UserSupervisor_userId_supervisorId_key" ON "UserSupervisor"("userId", "supervisorId");
CREATE INDEX "UserSupervisor_userId_idx" ON "UserSupervisor"("userId");
CREATE INDEX "UserSupervisor_supervisorId_idx" ON "UserSupervisor"("supervisorId");

-- Add foreign keys for UserSupervisor
ALTER TABLE "UserSupervisor" ADD CONSTRAINT "UserSupervisor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSupervisor" ADD CONSTRAINT "UserSupervisor_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create WarehouseProduct table
CREATE TABLE "WarehouseProduct" (
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

-- Create indexes for WarehouseProduct
CREATE INDEX "WarehouseProduct_isActive_stock_idx" ON "WarehouseProduct"("isActive", "stock");
CREATE INDEX "WarehouseProduct_name_idx" ON "WarehouseProduct"("name");

-- Create MaterialRequest table
CREATE TABLE "MaterialRequest" (
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

-- Create unique index for requestNumber
CREATE UNIQUE INDEX "MaterialRequest_requestNumber_key" ON "MaterialRequest"("requestNumber");

-- Create unique index for qrCode
CREATE UNIQUE INDEX "MaterialRequest_qrCode_key" ON "MaterialRequest"("qrCode");

-- Create indexes for MaterialRequest
CREATE INDEX "MaterialRequest_requesterId_status_idx" ON "MaterialRequest"("requesterId", "status");
CREATE INDEX "MaterialRequest_authorizerId_status_idx" ON "MaterialRequest"("authorizerId", "status");
CREATE INDEX "MaterialRequest_status_requestedAt_idx" ON "MaterialRequest"("status", "requestedAt");
CREATE INDEX "MaterialRequest_qrCode_idx" ON "MaterialRequest"("qrCode");

-- Add foreign keys for MaterialRequest
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_authorizerId_fkey" FOREIGN KEY ("authorizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_delivererId_fkey" FOREIGN KEY ("delivererId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create MaterialRequestItem table
CREATE TABLE "MaterialRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantityDelivered" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MaterialRequestItem_pkey" PRIMARY KEY ("id")
);

-- Create indexes for MaterialRequestItem
CREATE INDEX "MaterialRequestItem_requestId_idx" ON "MaterialRequestItem"("requestId");
CREATE INDEX "MaterialRequestItem_productId_idx" ON "MaterialRequestItem"("productId");

-- Add foreign keys for MaterialRequestItem
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaterialRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "WarehouseProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

