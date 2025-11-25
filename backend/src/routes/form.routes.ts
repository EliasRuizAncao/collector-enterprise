import { Router } from 'express'

import { authenticate } from '../middleware/auth'
import {
  listForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  publishForm,
  archiveForm,
} from '../controllers/formController'
import { getResponses } from '../controllers/responseController'

// Rutas protegidas para la gestión completa de formularios
const router = Router()

// Listar formularios con paginación opcional
router.get('/', authenticate, listForms)

// Obtener respuestas de un formulario específico (debe ir antes de /:id)
router.get('/:formId/responses', authenticate, getResponses)

// Obtener un formulario por su identificador
router.get('/:id', authenticate, getFormById)

// Crear un nuevo formulario
router.post('/', authenticate, createForm)

// Actualizar un formulario existente
router.put('/:id', authenticate, updateForm)

// Eliminar un formulario
router.delete('/:id', authenticate, deleteForm)

// Publicar un formulario
router.post('/:id/publish', authenticate, publishForm)

// Archivar un formulario
router.post('/:id/archive', authenticate, archiveForm)

export default router

