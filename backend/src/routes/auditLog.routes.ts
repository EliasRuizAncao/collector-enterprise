import { Router } from 'express'

import { authenticate, authorize } from '../middleware/auth'
import { getAuditLogsList, getModules, getActions } from '../controllers/auditLogController'

// Rutas protegidas para logs de auditoría
// Solo ADMIN puede acceder
const router = Router()

// Obtener logs de auditoría con filtros y paginación
// GET /api/audit-logs?page=1&limit=20&userId=...&module=...&action=...&startDate=...&endDate=...
router.get('/', authenticate, authorize('ADMIN'), getAuditLogsList)

// Obtener lista de módulos únicos
// GET /api/audit-logs/modules
router.get('/modules', authenticate, authorize('ADMIN'), getModules)

// Obtener lista de acciones únicas (opcionalmente filtradas por módulo)
// GET /api/audit-logs/actions?module=...
router.get('/actions', authenticate, authorize('ADMIN'), getActions)

export default router

