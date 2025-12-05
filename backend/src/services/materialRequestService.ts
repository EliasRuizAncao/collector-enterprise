import { PrismaClient, Prisma, MaterialRequestStatus } from '@prisma/client'
import * as crypto from 'crypto'
import * as notificationService from './notificationService'

const prisma = new PrismaClient()

export interface CreateMaterialRequestInput {
  requesterId: string
  items: Array<{
    productId: string
    quantity: number
  }>
  notes?: string
}

export interface MaterialRequestFilters {
  page?: number
  limit?: number
  status?: MaterialRequestStatus
  requesterId?: string
  authorizerId?: string
  search?: string
}

/**
 * Genera un número único de solicitud
 */
const generateRequestNumber = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = `REQ-${year}-`

  // Obtener el último número de solicitud del año
  const lastRequest = await prisma.materialRequest.findFirst({
    where: {
      requestNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      requestNumber: 'desc',
    },
  })

  let sequence = 1
  if (lastRequest) {
    const lastSequence = parseInt(lastRequest.requestNumber.split('-')[2] || '0', 10)
    sequence = lastSequence + 1
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`
}

/**
 * Genera un código QR único para la solicitud
 */
const generateQRCode = (requestId: string): string => {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  return `QR-${requestId.substring(0, 8)}-${timestamp}-${random}`
}

/**
 * Obtiene los superiores de un usuario
 */
export const getUserSupervisors = async (userId: string) => {
  const supervisors = await prisma.userSupervisor.findMany({
    where: { userId },
    include: {
      supervisor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      },
    },
  })

  return supervisors.map((s) => s.supervisor)
}

/**
 * Verifica si un usuario es superior de otro
 */
export const isSupervisor = async (supervisorId: string, userId: string): Promise<boolean> => {
  const relation = await prisma.userSupervisor.findUnique({
    where: {
      userId_supervisorId: {
        userId,
        supervisorId,
      },
    },
  })

  return !!relation
}

/**
 * Crea una nueva solicitud de materiales
 */
export const createMaterialRequest = async (data: CreateMaterialRequestInput) => {
  // Verificar que el usuario existe
  const requester = await prisma.user.findUnique({
    where: { id: data.requesterId },
  })

  if (!requester) {
    throw new Error('USER_NOT_FOUND')
  }

  // Verificar que todos los productos existen y están activos
  const productIds = data.items.map((item) => item.productId)
  const products = await prisma.warehouseProduct.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
  })

  if (products.length !== productIds.length) {
    throw new Error('SOME_PRODUCTS_NOT_FOUND_OR_INACTIVE')
  }

  // Verificar que las cantidades son válidas
  for (const item of data.items) {
    if (item.quantity <= 0) {
      throw new Error('INVALID_QUANTITY')
    }
  }

  // Generar número de solicitud
  const requestNumber = await generateRequestNumber()

  // Crear la solicitud con sus items
  const request = await prisma.materialRequest.create({
    data: {
      requestNumber,
      requesterId: data.requesterId,
      status: MaterialRequestStatus.PENDING,
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          quantityDelivered: 0,
        })),
      },
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  // Enviar notificaciones a los supervisores del solicitante
  try {
    const supervisors = await getUserSupervisors(data.requesterId)
    for (const supervisor of supervisors) {
      await notificationService.notifyMaterialRequestPending(
        supervisor.id,
        data.requesterId,
        request.id,
      )
    }
  } catch (error) {
    console.error('[materialRequestService] Error sending pending notifications:', error)
    // No lanzamos el error para no interrumpir el flujo principal
  }

  return request
}

/**
 * Obtiene solicitudes de materiales con filtros
 */
export const getMaterialRequests = async (filters: MaterialRequestFilters = {}) => {
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const limit = filters.limit && filters.limit > 0 && filters.limit <= 100 ? filters.limit : 20

  const where: Prisma.MaterialRequestWhereInput = {}

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.requesterId) {
    where.requesterId = filters.requesterId
  }

  if (filters.authorizerId) {
    where.authorizerId = filters.authorizerId
  }

  if (filters.search) {
    where.OR = [
      { requestNumber: { contains: filters.search, mode: 'insensitive' } },
      { notes: { contains: filters.search, mode: 'insensitive' } },
      {
        requester: {
          name: { contains: filters.search, mode: 'insensitive' },
        },
      },
    ]
  }

  const [requests, total] = await prisma.$transaction([
    prisma.materialRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { requestedAt: 'desc' },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        authorizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    }),
    prisma.materialRequest.count({ where }),
  ])

  return {
    data: requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Obtiene una solicitud por ID
 */
export const getMaterialRequestById = async (requestId: string) => {
  const request = await prisma.materialRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      authorizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      deliverer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }

  return request
}

/**
 * Obtiene una solicitud por código QR
 */
export const getMaterialRequestByQR = async (qrCode: string) => {
  const request = await prisma.materialRequest.findUnique({
    where: { qrCode },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      authorizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }

  return request
}

/**
 * Autoriza una solicitud de materiales
 */
export const approveMaterialRequest = async (requestId: string, authorizerId: string) => {
  const request = await prisma.materialRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }

  if (request.status !== MaterialRequestStatus.PENDING) {
    throw new Error('REQUEST_ALREADY_PROCESSED')
  }

  // Verificar que el autorizador es superior del solicitante
  const isAuthorized = await isSupervisor(authorizerId, request.requesterId)
  if (!isAuthorized) {
    throw new Error('NOT_AUTHORIZED_TO_APPROVE')
  }

  // Verificar que hay stock suficiente para todos los items
  for (const item of request.items) {
    if (item.product.stock < item.quantity) {
      throw new Error(`INSUFFICIENT_STOCK_${item.product.name}`)
    }
  }

  // Generar código QR
  const qrCode = generateQRCode(requestId)

  // Actualizar la solicitud
  const updated = await prisma.materialRequest.update({
    where: { id: requestId },
    data: {
      status: MaterialRequestStatus.APPROVED,
      authorizerId,
      authorizedAt: new Date(),
      qrCode,
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      authorizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  // Enviar notificación al solicitante
  try {
    await notificationService.notifyMaterialRequestApproved(request.requesterId, requestId)
  } catch (error) {
    console.error('[materialRequestService] Error sending approval notification:', error)
    // No lanzamos el error para no interrumpir el flujo principal
  }

  return updated
}

/**
 * Rechaza una solicitud de materiales
 */
export const rejectMaterialRequest = async (requestId: string, authorizerId: string, reason: string) => {
  const request = await prisma.materialRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: true,
    },
  })

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }

  if (request.status !== MaterialRequestStatus.PENDING) {
    throw new Error('REQUEST_ALREADY_PROCESSED')
  }

  // Verificar que el autorizador es superior del solicitante
  const isAuthorized = await isSupervisor(authorizerId, request.requesterId)
  if (!isAuthorized) {
    throw new Error('NOT_AUTHORIZED_TO_REJECT')
  }

  // Actualizar la solicitud
  const updated = await prisma.materialRequest.update({
    where: { id: requestId },
    data: {
      status: MaterialRequestStatus.REJECTED,
      authorizerId,
      rejectedAt: new Date(),
      rejectionReason: reason,
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      authorizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  return updated
}

/**
 * Marca una solicitud como lista para recoger (cuando se escanea el QR)
 */
export const markRequestAsReady = async (requestId: string, delivererId: string) => {
  const request = await prisma.materialRequest.findUnique({
    where: { id: requestId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }

  if (request.status !== MaterialRequestStatus.APPROVED) {
    throw new Error('REQUEST_NOT_APPROVED')
  }

  // Actualizar la solicitud
  const updated = await prisma.materialRequest.update({
    where: { id: requestId },
    data: {
      status: MaterialRequestStatus.READY_FOR_PICKUP,
      delivererId,
      readyAt: new Date(),
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  return updated
}

/**
 * Confirma la entrega de materiales (con firma digital)
 */
export const confirmDelivery = async (
  requestId: string,
  delivererId: string,
  receiverId: string,
  signature: string,
  itemsDelivered: Array<{ itemId: string; quantityDelivered: number }>,
) => {
  const request = await prisma.materialRequest.findUnique({
    where: { id: requestId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }

  if (request.status !== MaterialRequestStatus.READY_FOR_PICKUP) {
    throw new Error('REQUEST_NOT_READY_FOR_PICKUP')
  }

  // Actualizar cantidades entregadas y descontar stock
  await prisma.$transaction(async (tx) => {
    // Actualizar items entregados
    for (const itemDelivered of itemsDelivered) {
      const item = request.items.find((i) => i.id === itemDelivered.itemId)
      if (!item) {
        throw new Error(`ITEM_NOT_FOUND_${itemDelivered.itemId}`)
      }

      if (itemDelivered.quantityDelivered > item.quantity) {
        throw new Error(`QUANTITY_EXCEEDS_REQUESTED_${item.product.name}`)
      }

      // Actualizar cantidad entregada
      await tx.materialRequestItem.update({
        where: { id: itemDelivered.itemId },
        data: { quantityDelivered: itemDelivered.quantityDelivered },
      })

      // Descontar stock
      if (itemDelivered.quantityDelivered > 0) {
        const newStock = item.product.stock - itemDelivered.quantityDelivered
        if (newStock < 0) {
          throw new Error(`INSUFFICIENT_STOCK_${item.product.name}`)
        }

        await tx.warehouseProduct.update({
          where: { id: item.productId },
          data: { stock: newStock },
        })
      }
    }

    // Actualizar solicitud
    await tx.materialRequest.update({
      where: { id: requestId },
      data: {
        status: MaterialRequestStatus.DELIVERED,
        delivererId,
        receiverId,
        signature,
        deliveredAt: new Date(),
      },
    })
  })

  // Obtener la solicitud actualizada
  const updated = await getMaterialRequestById(requestId)
  return updated
}

/**
 * Obtiene solicitudes pendientes de autorización para un supervisor
 */
export const getPendingRequestsForSupervisor = async (
  supervisorId: string,
  filters: Omit<MaterialRequestFilters, 'requesterId' | 'authorizerId'> = {},
) => {
  // Obtener todos los subordinados del supervisor
  const subordinates = await prisma.userSupervisor.findMany({
    where: { supervisorId },
    select: { userId: true },
  })

  const subordinateIds = subordinates.map((s) => s.userId)

  if (subordinateIds.length === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 20,
        totalPages: 0,
      },
    }
  }

  // Obtener solicitudes pendientes de los subordinados
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const limit = filters.limit && filters.limit > 0 && filters.limit <= 100 ? filters.limit : 20

  const where: Prisma.MaterialRequestWhereInput = {
    status: MaterialRequestStatus.PENDING,
    requesterId: { in: subordinateIds },
  }

  if (filters.search) {
    where.OR = [
      { requestNumber: { contains: filters.search, mode: 'insensitive' } },
      { notes: { contains: filters.search, mode: 'insensitive' } },
      {
        requester: {
          name: { contains: filters.search, mode: 'insensitive' },
        },
      },
    ]
  }

  const [requests, total] = await prisma.$transaction([
    prisma.materialRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { requestedAt: 'desc' },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    }),
    prisma.materialRequest.count({ where }),
  ])

  return {
    data: requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

