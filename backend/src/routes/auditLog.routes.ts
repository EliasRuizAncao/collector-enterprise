import { Router } from 'express'

import { authenticate, authorize } from '../middleware/auth'
import { Role } from '@prisma/client'
import { getAuditLogsList, getModules, getActions } from '../controllers/auditLogController'

// Rutas protegidas para logs de auditoría
// Solo ADMIN puede acceder
const router = Router()

// Obtener logs de auditoría con filtros y paginación
// GET /api/audit-logs?page=1&limit=20&userId=...&module=...&action=...&startDate=...&endDate=...
router.get('/', authenticate, authorize(Role.ADMIN), getAuditLogsList)

// Obtener lista de módulos únicos
// GET /api/audit-logs/modules
router.get('/modules', authenticate, authorize(Role.ADMIN), getModules)

// Obtener lista de acciones únicas (opcionalmente filtradas por módulo)
// GET /api/audit-logs/actions?module=...
router.get('/actions', authenticate, authorize(Role.ADMIN), getActions)

export default router

