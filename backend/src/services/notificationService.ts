import { PrismaClient, NotificationType } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Crea una notificación cuando se asigna un formulario a un usuario
 * @param userId - ID del usuario al que se le asigna el formulario
 * @param formId - ID del formulario asignado
 */
export const notifyFormAssigned = async (userId: string, formId: string) => {
  console.info('[notificationService] notifyFormAssigned', { userId, formId })

  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  // Verificar que el formulario existe
  const form = await prisma.form.findUnique({ where: { id: formId } })
  if (!form) {
    throw new Error('FORM_NOT_FOUND')
  }

  // Crear la notificación
  const notification = await prisma.notification.create({
    data: {
      userId,
      title: 'Nuevo formulario asignado',
      message: `Se te ha asignado el formulario "${form.title}". Por favor, complétalo antes de la fecha límite.`,
      type: NotificationType.FORM_ASSIGNED,
      read: false,
      link: `/forms/${formId}`, // Link al formulario asignado
    },
  })

  console.info('[notificationService] notification created', notification.id)
  return notification
}

/**
 * Crea una notificación cuando un formulario es completado
 * Notifica al supervisor del usuario que completó el formulario
 * @param supervisorId - ID del supervisor que debe ser notificado
 * @param userId - ID del usuario que completó el formulario
 * @param formId - ID del formulario completado
 */
export const notifyFormCompleted = async (
  supervisorId: string,
  userId: string,
  formId: string,
) => {
  console.info('[notificationService] notifyFormCompleted', {
    supervisorId,
    userId,
    formId,
  })

  // Verificar que el supervisor existe
  const supervisor = await prisma.user.findUnique({ where: { id: supervisorId } })
  if (!supervisor) {
    throw new Error('SUPERVISOR_NOT_FOUND')
  }

  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  // Verificar que el formulario existe
  const form = await prisma.form.findUnique({ where: { id: formId } })
  if (!form) {
    throw new Error('FORM_NOT_FOUND')
  }

  // Crear la notificación
  const notification = await prisma.notification.create({
    data: {
      userId: supervisorId,
      title: 'Formulario completado',
      message: `${user.name} ha completado el formulario "${form.title}".`,
      type: NotificationType.FORM_COMPLETED,
      read: false,
      link: `/forms/${formId}/responses`, // Link a las respuestas del formulario
    },
  })

  console.info('[notificationService] notification created', notification.id)
  return notification
}

/**
 * Crea una notificación cuando se acerca la fecha límite de una asignación
 * @param userId - ID del usuario al que se le notifica
 * @param assignmentId - ID de la asignación que está por vencer
 */
export const notifyDeadlineApproaching = async (
  userId: string,
  assignmentId: string,
) => {
  console.info('[notificationService] notifyDeadlineApproaching', {
    userId,
    assignmentId,
  })

  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  // Obtener la asignación con el formulario
  const assignment = await prisma.formAssignment.findUnique({
    where: { id: assignmentId },
    include: { form: true },
  })

  if (!assignment) {
    throw new Error('ASSIGNMENT_NOT_FOUND')
  }

  // Verificar que la asignación pertenece al usuario
  if (assignment.userId !== userId) {
    throw new Error('ASSIGNMENT_NOT_BELONGS_TO_USER')
  }

  // Calcular días restantes hasta la fecha límite
  const endDate = assignment.endDate || assignment.startDate
  const daysRemaining = Math.ceil(
    (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  // Crear la notificación
  const notification = await prisma.notification.create({
    data: {
      userId,
      title: 'Fecha límite próxima',
      message: `El formulario "${assignment.form.title}" vence en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}. Por favor, complétalo a tiempo.`,
      type: NotificationType.DEADLINE,
      read: false,
      link: `/forms/${assignment.formId}`, // Link al formulario con fecha límite próxima
    },
  })

  console.info('[notificationService] notification created', notification.id)
  return notification
}

/**
 * Marca una notificación como leída
 * @param notificationId - ID de la notificación a marcar como leída
 */
export const markAsRead = async (notificationId: string) => {
  console.info('[notificationService] markAsRead', notificationId)

  // Verificar que la notificación existe
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification) {
    throw new Error('NOTIFICATION_NOT_FOUND')
  }

  // Si ya está leída, no hacer nada
  if (notification.read) {
    return notification
  }

  // Marcar como leída
  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })

  console.info('[notificationService] notification marked as read', notificationId)
  return updated
}

/**
 * Obtiene el conteo de notificaciones no leídas para un usuario
 * @param userId - ID del usuario
 * @returns Número de notificaciones no leídas
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  console.info('[notificationService] getUnreadCount', userId)

  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  // Contar notificaciones no leídas
  const count = await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  })

  console.info('[notificationService] unread count', count)
  return count
}

/**
 * Obtiene todas las notificaciones de un usuario
 * @param userId - ID del usuario
 * @param options - Opciones de paginación y filtrado
 * @returns Lista de notificaciones con paginación
 */
export const getUserNotifications = async (
  userId: string,
  options?: {
    page?: number
    limit?: number
    read?: boolean
    type?: NotificationType
  },
) => {
  console.info('[notificationService] getUserNotifications', { userId, options })

  const page = options?.page && options.page > 0 ? options.page : 1
  const limit = options?.limit && options.limit > 0 && options.limit <= 100 ? options.limit : 20

  const where: {
    userId: string
    read?: boolean
    type?: NotificationType
  } = {
    userId,
  }

  if (options?.read !== undefined) {
    where.read = options.read
  }

  if (options?.type) {
    where.type = options.type
  }

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ])

  return {
    data: notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 * @param userId - ID del usuario
 */
export const markAllAsRead = async (userId: string) => {
  console.info('[notificationService] markAllAsRead', userId)

  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  // Marcar todas como leídas
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  })

  console.info('[notificationService] marked all as read', result.count)
  return result
}

