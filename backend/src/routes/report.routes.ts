import { Router } from 'express'

import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/auth'
import { Role } from '@prisma/client'
import {
  getCompletionReport,
  getUserPerformanceReport,
  getFormAnalyticsReport,
} from '../controllers/reportController'

// Rutas protegidas para reportes
// Solo ADMIN y MANAGER pueden acceder
const router = Router()

// Aplicar autenticación y autorización a todas las rutas
router.use(authenticate)
router.use(authorize(Role.ADMIN, Role.MANAGER))

// Reporte de completitud de formularios
// GET /api/reports/completion?startDate=...&endDate=...&userId=...&formId=...
router.get('/completion', getCompletionReport)

// Reporte de rendimiento de usuarios
// GET /api/reports/user-performance?startDate=...&endDate=...&limit=...
router.get('/user-performance', getUserPerformanceReport)

// Reporte de analíticas de formulario específico
// GET /api/reports/form-analytics/:formId?startDate=...&endDate=...
router.get('/form-analytics/:formId', getFormAnalyticsReport)

// TODO: Implementar exportación a Excel y PDF en futuras iteraciones
// GET /api/reports/export/excel?type=...&params=...
// GET /api/reports/export/pdf?type=...&params=...

export default router

