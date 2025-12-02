import { Router } from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth'
import { analyzeStructure, getStructureStatus, resetStructureStatus } from '../controllers/structureController'

const router = Router()

// Configurar multer para recibir archivos (imágenes y videos)
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/')
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
        }
    }),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB máximo (para videos)
    },
    fileFilter: (req, file, cb) => {
        // Aceptar imágenes y videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true)
        } else {
            cb(new Error('Formato de archivo no soportado'))
        }
    },
})

// POST /api/v1/structure/analyze
// Usa autenticación de usuario (panel admin)
router.post(
    '/analyze',
    authenticate,
    upload.single('file'),
    analyzeStructure
)

// GET /api/v1/structure/status
router.get('/status', authenticate, getStructureStatus)

// POST /api/v1/structure/reset
router.post('/reset', authenticate, resetStructureStatus)

export default router
