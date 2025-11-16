import { Router } from 'express'

import { authenticate } from '../middleware/auth'
import { submitResponse, getResponses, getResponse } from '../controllers/responseController'

// Rutas protegidas para la gestión de respuestas de formularios
const router = Router()

// Enviar una respuesta de formulario
router.post('/', authenticate, submitResponse)

// Listar respuestas con filtros y paginación
router.get('/', authenticate, getResponses)

// Obtener una respuesta específica
router.get('/:id', authenticate, getResponse)

export default router

