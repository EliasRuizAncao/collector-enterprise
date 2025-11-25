import { Router } from 'express'

import { authenticate } from '../middleware/auth'
import {
  getDashboardStats,
  getFormsCompleted,
  getPendingForms,
  getRecentActivity,
  getFormsByType,
} from '../controllers/dashboardController'

// Rutas protegidas para exponer estadísticas del dashboard
const router = Router()

// KPIs y métricas generales
router.get('/stats', authenticate, getDashboardStats)

// Formularios completados (admite filtros por fechas, obra, etc.)
router.get('/forms/completed', authenticate, getFormsCompleted)

// Formularios pendientes de completar
router.get('/forms/pending', authenticate, getPendingForms)

// Actividad reciente del sistema
router.get('/activity', authenticate, getRecentActivity)

// Formularios agrupados por tipo (para gráficos)
router.get('/forms/by-type', authenticate, getFormsByType)

export default router

