import { Router } from 'express'

import { authenticate } from '../middleware/auth'
import {
  getProductsList,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  adjustStockHandler,
  getLowStockProductsList,
} from '../controllers/stockController'
import {
  getRequestsList,
  getRequest,
  createRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  scanQR,
  confirmDeliveryHandler,
  getSupervisors,
} from '../controllers/materialRequestController'

const router = Router()

// Rutas de productos (stock)
router.get('/products', authenticate, getProductsList)
router.get('/products/low-stock', authenticate, getLowStockProductsList)
router.get('/products/:id', authenticate, getProduct)
router.post('/products', authenticate, createProductHandler)
router.put('/products/:id', authenticate, updateProductHandler)
router.delete('/products/:id', authenticate, deleteProductHandler)
router.post('/products/:id/adjust-stock', authenticate, adjustStockHandler)

// Rutas de solicitudes de materiales
router.get('/requests', authenticate, getRequestsList)
router.get('/requests/pending', authenticate, getPendingRequests)
router.get('/requests/:id', authenticate, getRequest)
router.post('/requests', authenticate, createRequest)
router.post('/requests/:id/approve', authenticate, approveRequest)
router.post('/requests/:id/reject', authenticate, rejectRequest)
router.post('/requests/scan-qr', authenticate, scanQR)
router.post('/requests/:id/confirm-delivery', authenticate, confirmDeliveryHandler)

// Rutas de supervisión
router.get('/supervisors', authenticate, getSupervisors)

export default router

