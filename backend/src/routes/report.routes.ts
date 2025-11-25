import { Router } from 'express'

import { authenticate, authorize } from '../middleware/auth'
import {
  getCompletionReport,
  getUserPerformanceReport,
  getFormAnalyticsReport,
  exportReportToExcel,
  exportReportToPDF,
} from '../controllers/reportController'

// Rutas protegidas para reportes
// Solo ADMIN y MANAGER pueden acceder
const router = Router()

// Reporte de completitud de formularios
// GET /api/reports/completion?startDate=...&endDate=...&userId=...&formId=...
router.get('/completion', authenticate, authorize('ADMIN', 'MANAGER'), getCompletionReport)

// Reporte de rendimiento de usuarios
// GET /api/reports/user-performance?startDate=...&endDate=...&limit=...
router.get('/user-performance', authenticate, authorize('ADMIN', 'MANAGER'), getUserPerformanceReport)

// Reporte de analíticas de formulario específico
// GET /api/reports/form-analytics/:formId?startDate=...&endDate=...
router.get('/form-analytics/:formId', authenticate, authorize('ADMIN', 'MANAGER'), getFormAnalyticsReport)

// Exportar reporte a Excel
// GET /api/reports/export/excel?type=completion|user-performance|form-analytics&...
router.get('/export/excel', authenticate, authorize('ADMIN', 'MANAGER'), exportReportToExcel)

// Exportar reporte a PDF
// GET /api/reports/export/pdf?type=completion|user-performance|form-analytics&...
router.get('/export/pdf', authenticate, authorize('ADMIN', 'MANAGER'), exportReportToPDF)

export default router

