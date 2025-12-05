/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.

*/

-- Step 1: Create Permission enum
CREATE TYPE "Permission" AS ENUM (
  'FORMS_VIEW', 'FORMS_CREATE', 'FORMS_EDIT', 'FORMS_DELETE', 'FORMS_PUBLISH', 'FORMS_ARCHIVE', 'FORMS_VIEW_RESPONSES',
  'USERS_VIEW', 'USERS_CREATE', 'USERS_EDIT', 'USERS_DELETE', 'USERS_CHANGE_ROLE', 'USERS_DEACTIVATE',
  'ASSIGNMENTS_VIEW', 'ASSIGNMENTS_CREATE', 'ASSIGNMENTS_EDIT', 'ASSIGNMENTS_DELETE',
  'REPORTS_VIEW', 'REPORTS_EXPORT',
  'EPP_MONITOR_VIEW', 'EPP_MONITOR_MANAGE',
  'STRUCTURE_MONITOR_VIEW', 'STRUCTURE_MONITOR_MANAGE',
  'ACCESS_ADMIN_PANEL', 'ACCESS_MOBILE_APP', 'ACCESS_SETTINGS',
  'ROLES_VIEW', 'ROLES_CREATE', 'ROLES_EDIT', 'ROLES_DELETE', 'PERMISSIONS_MANAGE'
);

-- Step 2: Rename old Role enum to RoleOld temporarily to avoid conflict
ALTER TYPE "Role" RENAME TO "RoleOld";

-- Step 3: Create Role table (now we can use the name "Role" since enum is renamed)
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "permissions" "Permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create indexes for Role
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE INDEX "Role_name_idx" ON "Role"("name");

-- Step 5: Create system roles with their permissions
-- We'll use fixed UUIDs to ensure consistency
-- ADMIN role (all permissions)
INSERT INTO "Role" ("id", "name", "displayName", "description", "isSystem", "permissions", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ADMIN',
  'Administrador',
  'Acceso completo al sistema. Puede gestionar usuarios, roles, permisos y todas las funcionalidades.',
  true,
  ARRAY[
    'FORMS_VIEW', 'FORMS_CREATE', 'FORMS_EDIT', 'FORMS_DELETE', 'FORMS_PUBLISH', 'FORMS_ARCHIVE', 'FORMS_VIEW_RESPONSES',
    'USERS_VIEW', 'USERS_CREATE', 'USERS_EDIT', 'USERS_DELETE', 'USERS_CHANGE_ROLE', 'USERS_DEACTIVATE',
    'ASSIGNMENTS_VIEW', 'ASSIGNMENTS_CREATE', 'ASSIGNMENTS_EDIT', 'ASSIGNMENTS_DELETE',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
    'EPP_MONITOR_VIEW', 'EPP_MONITOR_MANAGE',
    'STRUCTURE_MONITOR_VIEW', 'STRUCTURE_MONITOR_MANAGE',
    'ACCESS_ADMIN_PANEL', 'ACCESS_MOBILE_APP', 'ACCESS_SETTINGS',
    'ROLES_VIEW', 'ROLES_CREATE', 'ROLES_EDIT', 'ROLES_DELETE', 'PERMISSIONS_MANAGE'
  ]::"Permission"[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- MANAGER role
INSERT INTO "Role" ("id", "name", "displayName", "description", "isSystem", "permissions", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'MANAGER',
  'Gerente',
  'Puede gestionar formularios, asignaciones, reportes y monitoreo. No puede gestionar usuarios ni roles.',
  true,
  ARRAY[
    'FORMS_VIEW', 'FORMS_CREATE', 'FORMS_EDIT', 'FORMS_DELETE', 'FORMS_PUBLISH', 'FORMS_ARCHIVE', 'FORMS_VIEW_RESPONSES',
    'ASSIGNMENTS_VIEW', 'ASSIGNMENTS_CREATE', 'ASSIGNMENTS_EDIT', 'ASSIGNMENTS_DELETE',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
    'EPP_MONITOR_VIEW', 'EPP_MONITOR_MANAGE',
    'STRUCTURE_MONITOR_VIEW', 'STRUCTURE_MONITOR_MANAGE',
    'ACCESS_ADMIN_PANEL'
  ]::"Permission"[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- SUPERVISOR role
INSERT INTO "Role" ("id", "name", "displayName", "description", "isSystem", "permissions", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'SUPERVISOR',
  'Supervisor',
  'Puede ver formularios, asignaciones, reportes y monitoreo. Puede crear y editar formularios pero no publicarlos.',
  true,
  ARRAY[
    'FORMS_VIEW', 'FORMS_CREATE', 'FORMS_EDIT', 'FORMS_VIEW_RESPONSES',
    'ASSIGNMENTS_VIEW',
    'REPORTS_VIEW',
    'EPP_MONITOR_VIEW',
    'STRUCTURE_MONITOR_VIEW',
    'ACCESS_ADMIN_PANEL', 'ACCESS_MOBILE_APP'
  ]::"Permission"[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- OPERATOR role
INSERT INTO "Role" ("id", "name", "displayName", "description", "isSystem", "permissions", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'OPERATOR',
  'Operador',
  'Puede ver y responder formularios asignados. Acceso solo a la aplicación móvil.',
  true,
  ARRAY[
    'FORMS_VIEW',
    'ACCESS_MOBILE_APP'
  ]::"Permission"[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Step 6: Add roleId column as nullable first
ALTER TABLE "User" ADD COLUMN "roleId" TEXT;

-- Step 7: Add customPermissions column
ALTER TABLE "User" ADD COLUMN "customPermissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[];

-- Step 8: Assign roleId to existing users based on their current role
-- Map old enum values (now RoleOld) to new role IDs
UPDATE "User" 
SET "roleId" = '00000000-0000-0000-0000-000000000001'
WHERE "role"::text = 'ADMIN';

UPDATE "User" 
SET "roleId" = '00000000-0000-0000-0000-000000000002'
WHERE "role"::text = 'MANAGER';

UPDATE "User" 
SET "roleId" = '00000000-0000-0000-0000-000000000003'
WHERE "role"::text = 'SUPERVISOR';

UPDATE "User" 
SET "roleId" = '00000000-0000-0000-0000-000000000004'
WHERE "role"::text = 'OPERATOR' OR "role" IS NULL;

-- Step 9: For any users that couldn't be matched (shouldn't happen, but safety first), assign OPERATOR
UPDATE "User"
SET "roleId" = (SELECT "id" FROM "Role" WHERE "name" = 'OPERATOR')
WHERE "roleId" IS NULL;

-- Step 10: Make roleId required
ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;

-- Step 11: Create index for roleId
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- Step 12: Add foreign key constraint
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 13: Drop old role column (which uses RoleOld enum)
ALTER TABLE "User" DROP COLUMN "role";

-- Step 14: Drop old Role enum (now renamed to RoleOld)
DROP TYPE "public"."RoleOld";

-- Step 14: Notification table should remain - it was incorrectly marked for deletion
-- The table exists and should not be dropped
