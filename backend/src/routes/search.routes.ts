import { Router } from 'express'

import { authenticate } from '../middleware/auth'
import { globalSearch } from '../controllers/searchController'

// Rutas protegidas para búsqueda global
const router = Router()

// Búsqueda global en assignments, forms e history
// Todos los usuarios autenticados pueden buscar
router.get('/', authenticate, globalSearch)

export default router

