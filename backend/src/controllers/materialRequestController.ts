import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { MaterialRequestStatus } from '@prisma/client'

import { AuthRequest } from '@/middleware/auth'
import {
  createMaterialRequest,
  getMaterialRequests,
  getMaterialRequestById,
  getMaterialRequestByQR,
  approveMaterialRequest,
  rejectMaterialRequest,
  markRequestAsReady,
  confirmDelivery,
  getPendingRequestsForSupervisor,
  getUserSupervisors,
} from '@/services/materialRequestService'
import {
  notifyMaterialRequestPending,
  notifyMaterialRequestApproved,
  notifyMaterialRequestRejected,
  notifyMaterialRequestReady,
} from '@/services/notificationService'
import { createAuditLog } from '@/utils/auditLog'
import { AUDIT_MODULES } from '@/utils/auditLog'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(MaterialRequestStatus).optional(),
  requesterId: z.string().uuid().optional(),
  authorizerId: z.string().uuid().optional(),
  search: z.string().optional(),
})

const createRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('ID de producto inválido'),
        quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
      }),
    )
    .min(1, 'Debe incluir al menos un item'),
  notes: z.string().optional(),
})

const approveRequestSchema = z.object({
  requestId: z.string().uuid('ID de solicitud inválido'),
})

const rejectRequestSchema = z.object({
  requestId: z.string().uuid('ID de solicitud inválido'),
  reason: z.string().min(1, 'La razón del rechazo es requerida'),
})

const scanQRSchema = z.object({
  qrCode: z.string().min(1, 'El código QR es requerido'),
})

const confirmDeliverySchema = z.object({
  requestId: z.string().uuid('ID de solicitud inválido'),
  receiverId: z.string().uuid('ID de receptor inválido'),
  signature: z.string().min(1, 'La firma es requerida'),
  itemsDelivered: z
    .array(
      z.object({
        itemId: z.string().uuid('ID de item inválido'),
        quantityDelivered: z.number().int().min(0, 'La cantidad entregada no puede ser negativa'),
      }),
    )
    .min(1, 'Debe incluir al menos un item entregado'),
})

const requestIdSchema = z.object({
  id: z.string().uuid('ID de solicitud inválido'),
})

/**
 * Obtiene todas las solicitudes de materiales
 * GET /api/warehouse/requests
 */
export const getRequestsList = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const query = querySchema.parse(req.query)
    const result = await getMaterialRequests(query)

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('[materialRequestController] error in getRequestsList', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: error.issues,
      })
    }

    return res.status(500).json({
      error: 'Error al obtener solicitudes',
    })
  }
}

/**
 * Obtiene una solicitud por ID
 * GET /api/warehouse/requests/:id
 */
export const getRequest = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = requestIdSchema.parse(req.params)
    const request = await getMaterialRequestById(params.id)

    return res.status(200).json({
      success: true,
      data: request,
    })
  } catch (error) {
    console.error('[materialRequestController] error in getRequest', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'ID de solicitud inválido',
        details: error.issues,
      })
    }

    if (error instanceof Error && error.message === 'REQUEST_NOT_FOUND') {
      return res.status(404).json({
        error: 'Solicitud no encontrada',
      })
    }

    return res.status(500).json({
      error: 'Error al obtener solicitud',
    })
  }
}

/**
 * Crea una nueva solicitud de materiales
 * POST /api/warehouse/requests
 */
export const createRequest = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const data = createRequestSchema.parse(req.body)
    const request = await createMaterialRequest({
      requesterId: req.user.id,
      items: data.items,
      notes: data.notes,
    })

    // Obtener superiores del usuario y notificarles
    const supervisors = await getUserSupervisors(req.user.id)
    for (const supervisor of supervisors) {
      try {
        await notifyMaterialRequestPending(supervisor.id, req.user.id, request.id)
      } catch (error) {
        console.error('[materialRequestController] Error al notificar supervisor:', error)
        // No fallar la creación si falla la notificación
      }
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'MATERIAL_REQUEST_CREATED',
      module: AUDIT_MODULES.WAREHOUSE,
      details: { requestId: request.id, requestNumber: request.requestNumber },
      req,
    })

    return res.status(201).json({
      success: true,
      data: request,
      message: 'Solicitud creada correctamente',
    })
  } catch (error) {
    console.error('[materialRequestController] error in createRequest', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      })
    }

    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          error: 'Usuario no encontrado',
        })
      }

      if (error.message === 'SOME_PRODUCTS_NOT_FOUND_OR_INACTIVE') {
        return res.status(400).json({
          error: 'Algunos productos no existen o están inactivos',
        })
      }

      if (error.message === 'INVALID_QUANTITY') {
        return res.status(400).json({
          error: 'Las cantidades deben ser mayores a 0',
        })
      }
    }

    return res.status(500).json({
      error: 'Error al crear solicitud',
    })
  }
}

/**
 * Obtiene solicitudes pendientes de autorización para el supervisor autenticado
 * GET /api/warehouse/requests/pending
 */
export const getPendingRequests = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const query = querySchema.parse(req.query)
    const result = await getPendingRequestsForSupervisor(req.user.id, query)

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('[materialRequestController] error in getPendingRequests', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: error.issues,
      })
    }

    return res.status(500).json({
      error: 'Error al obtener solicitudes pendientes',
    })
  }
}

/**
 * Autoriza una solicitud de materiales
 * POST /api/warehouse/requests/:id/approve
 */
export const approveRequest = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = requestIdSchema.parse(req.params)
    const request = await approveMaterialRequest(params.id, req.user.id)

    // Notificar al solicitante
    try {
      await notifyMaterialRequestApproved(request.requesterId, request.id)
    } catch (error) {
      console.error('[materialRequestController] Error al notificar aprobación:', error)
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'MATERIAL_REQUEST_APPROVED',
      module: AUDIT_MODULES.WAREHOUSE,
      details: { requestId: request.id, requestNumber: request.requestNumber },
      req,
    })

    return res.status(200).json({
      success: true,
      data: request,
      message: 'Solicitud aprobada correctamente',
    })
  } catch (error) {
    console.error('[materialRequestController] error in approveRequest', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'ID de solicitud inválido',
        details: error.issues,
      })
    }

    if (error instanceof Error) {
      if (error.message === 'REQUEST_NOT_FOUND') {
        return res.status(404).json({
          error: 'Solicitud no encontrada',
        })
      }

      if (error.message === 'REQUEST_ALREADY_PROCESSED') {
        return res.status(400).json({
          error: 'La solicitud ya fue procesada',
        })
      }

      if (error.message === 'NOT_AUTHORIZED_TO_APPROVE') {
        return res.status(403).json({
          error: 'No tienes permiso para aprobar esta solicitud',
        })
      }

      if (error.message.startsWith('INSUFFICIENT_STOCK_')) {
        const productName = error.message.replace('INSUFFICIENT_STOCK_', '')
        return res.status(400).json({
          error: `Stock insuficiente para el producto: ${productName}`,
        })
      }
    }

    return res.status(500).json({
      error: 'Error al aprobar solicitud',
    })
  }
}

/**
 * Rechaza una solicitud de materiales
 * POST /api/warehouse/requests/:id/reject
 */
export const rejectRequest = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = requestIdSchema.parse(req.params)
    const body = rejectRequestSchema.parse({ ...req.body, requestId: params.id })
    const request = await rejectMaterialRequest(params.id, req.user.id, body.reason)

    // Notificar al solicitante
    try {
      await notifyMaterialRequestRejected(request.requesterId, request.id, body.reason)
    } catch (error) {
      console.error('[materialRequestController] Error al notificar rechazo:', error)
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'MATERIAL_REQUEST_REJECTED',
      module: AUDIT_MODULES.WAREHOUSE,
      details: {
        requestId: request.id,
        requestNumber: request.requestNumber,
        reason: body.reason,
      },
      req,
    })

    return res.status(200).json({
      success: true,
      data: request,
      message: 'Solicitud rechazada correctamente',
    })
  } catch (error) {
    console.error('[materialRequestController] error in rejectRequest', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      })
    }

    if (error instanceof Error) {
      if (error.message === 'REQUEST_NOT_FOUND') {
        return res.status(404).json({
          error: 'Solicitud no encontrada',
        })
      }

      if (error.message === 'REQUEST_ALREADY_PROCESSED') {
        return res.status(400).json({
          error: 'La solicitud ya fue procesada',
        })
      }

      if (error.message === 'NOT_AUTHORIZED_TO_REJECT') {
        return res.status(403).json({
          error: 'No tienes permiso para rechazar esta solicitud',
        })
      }
    }

    return res.status(500).json({
      error: 'Error al rechazar solicitud',
    })
  }
}

/**
 * Escanea un código QR y marca la solicitud como lista para recoger
 * POST /api/warehouse/requests/scan-qr
 */
export const scanQR = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const body = scanQRSchema.parse(req.body)
    const request = await getMaterialRequestByQR(body.qrCode)

    // Verificar que la solicitud está aprobada
    if (request.status !== MaterialRequestStatus.APPROVED) {
      return res.status(400).json({
        error: 'La solicitud no está aprobada',
      })
    }

    // Marcar como lista para recoger
    const updated = await markRequestAsReady(request.id, req.user.id)

    // Notificar al solicitante
    try {
      await notifyMaterialRequestReady(updated.requesterId, updated.id)
    } catch (error) {
      console.error('[materialRequestController] Error al notificar que está lista:', error)
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'MATERIAL_REQUEST_SCANNED',
      module: AUDIT_MODULES.WAREHOUSE,
      details: { requestId: updated.id, requestNumber: updated.requestNumber, qrCode: body.qrCode },
      req,
    })

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Solicitud marcada como lista para recoger',
    })
  } catch (error) {
    console.error('[materialRequestController] error in scanQR', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      })
    }

    if (error instanceof Error && error.message === 'REQUEST_NOT_FOUND') {
      return res.status(404).json({
        error: 'Código QR no válido o solicitud no encontrada',
      })
    }

    return res.status(500).json({
      error: 'Error al escanear código QR',
    })
  }
}

/**
 * Confirma la entrega de materiales con firma digital
 * POST /api/warehouse/requests/:id/confirm-delivery
 */
export const confirmDeliveryHandler = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = requestIdSchema.parse(req.params)
    const body = confirmDeliverySchema.parse({ ...req.body, requestId: params.id })

    const request = await confirmDelivery(
      params.id,
      req.user.id,
      body.receiverId,
      body.signature,
      body.itemsDelivered,
    )

    await createAuditLog({
      userId: req.user.id,
      action: 'MATERIAL_REQUEST_DELIVERED',
      module: AUDIT_MODULES.WAREHOUSE,
      details: {
        requestId: request.id,
        requestNumber: request.requestNumber,
        receiverId: body.receiverId,
      },
      req,
    })

    return res.status(200).json({
      success: true,
      data: request,
      message: 'Entrega confirmada correctamente',
    })
  } catch (error) {
    console.error('[materialRequestController] error in confirmDeliveryHandler', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      })
    }

    if (error instanceof Error) {
      if (error.message === 'REQUEST_NOT_FOUND') {
        return res.status(404).json({
          error: 'Solicitud no encontrada',
        })
      }

      if (error.message === 'REQUEST_NOT_READY_FOR_PICKUP') {
        return res.status(400).json({
          error: 'La solicitud no está lista para recoger',
        })
      }

      if (error.message.startsWith('ITEM_NOT_FOUND_')) {
        return res.status(400).json({
          error: 'Uno de los items no existe en la solicitud',
        })
      }

      if (error.message.startsWith('QUANTITY_EXCEEDS_REQUESTED_')) {
        const productName = error.message.replace('QUANTITY_EXCEEDS_REQUESTED_', '')
        return res.status(400).json({
          error: `La cantidad entregada excede la solicitada para: ${productName}`,
        })
      }

      if (error.message.startsWith('INSUFFICIENT_STOCK_')) {
        const productName = error.message.replace('INSUFFICIENT_STOCK_', '')
        return res.status(400).json({
          error: `Stock insuficiente para: ${productName}`,
        })
      }
    }

    return res.status(500).json({
      error: 'Error al confirmar entrega',
    })
  }
}

/**
 * Obtiene los superiores de un usuario
 * GET /api/warehouse/supervisors
 */
export const getSupervisors = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const supervisors = await getUserSupervisors(req.user.id)

    return res.status(200).json({
      success: true,
      data: supervisors,
    })
  } catch (error) {
    console.error('[materialRequestController] error in getSupervisors', error)

    return res.status(500).json({
      error: 'Error al obtener superiores',
    })
  }
}

