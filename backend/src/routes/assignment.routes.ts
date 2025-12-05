import { Router } from 'express'

import { authenticate, authorize } from '../middleware/auth'
import {
  getAssignments,
  getAssignmentById,
  createAssignments,
  updateAssignment,
  deleteAssignment,
  markAsCompleted,
  getTodayAssignments,
  getAssignmentStats,
} from '../controllers/assignmentController'

// Rutas protegidas para la gestión de asignaciones de formularios
const router = Router()

// Listar asignaciones con paginación y filtros
// Todos los usuarios autenticados pueden ver sus asignaciones
router.get('/', authenticate, getAssignments)

// Obtener asignaciones del día de hoy
router.get('/today', authenticate, getTodayAssignments)

// Obtener estadísticas de asignaciones
router.get('/stats', authenticate, getAssignmentStats)

// Obtener una asignación por su ID
// Todos los usuarios autenticados pueden ver sus propias asignaciones
router.get('/:id', authenticate, getAssignmentById)

// Crear una o múltiples asignaciones
// Solo ADMIN o MANAGER pueden crear asignaciones
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createAssignments)

// Actualizar una asignación
// El usuario asignado puede actualizar su propia asignación, admin puede actualizar cualquiera
router.put('/:id', authenticate, updateAssignment)

// Eliminar una asignación
// Solo ADMIN o MANAGER pueden eliminar asignaciones
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), deleteAssignment)

// Marcar una asignación como completada
// Solo el usuario asignado puede marcar como completada
router.put('/:id/complete', authenticate, markAsCompleted)

export default router

