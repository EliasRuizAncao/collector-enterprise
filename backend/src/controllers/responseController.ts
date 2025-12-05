import { Request, Response, NextFunction } from 'express'
import { PrismaClient, Prisma, AssignmentFrequency } from '@prisma/client'
import { z } from 'zod'

import { AuthRequest } from '@/middleware/auth'
import { submitResponseSchema, listResponsesQuerySchema } from '@/validators/responseValidator'
import type { Field, FieldType } from '@/types/formBuilder'

const prisma = new PrismaClient()
const RESPONSES_MODULE = 'RESPONSES'

/**
 * Helper para obtener user agent de forma segura
 */
const safeUserAgent = (req: Request) => {
  const header = req.headers['user-agent']
  return Array.isArray(header) ? header.join(',') : header ?? undefined
}

/**
 * Crea un registro de auditoría para acciones de respuestas
 */
const createAuditLog = async (
  actorId: string | undefined,
  action: string,
  details: Prisma.InputJsonValue | undefined,
  req: Request,
) => {
  if (!actorId) {
    return
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action,
        module: RESPONSES_MODULE,
        details,
        ipAddress: req.ip,
        userAgent: safeUserAgent(req),
      },
    })
  } catch (error) {
    // No fallar la operación principal si el audit log falla
    console.error('[audit] Error al crear log de auditoría:', error)
  }
}

/**
 * Valida que los datos de la respuesta cumplan con el schema del formulario
 */
const validateResponseData = (formFields: Field[], responseData: Record<string, unknown>): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  const fieldMap = new Map<string, Field>()
  
  // Crear mapa de campos por ID
  formFields.forEach((field) => {
    fieldMap.set(field.id, field)
  })

  // Validar que todos los campos requeridos estén presentes
  formFields.forEach((field) => {
    if (field.hidden) return

    if (field.required) {
      const value = responseData[field.id]
      // Para arrays, verificar que no estén vacíos
      if (Array.isArray(value)) {
        if (value.length === 0) {
          errors.push(`El campo "${field.label}" es obligatorio`)
        }
      } else if (!(field.id in responseData) || value === undefined || value === null || value === '') {
        errors.push(`El campo "${field.label}" es obligatorio`)
      }
    }
  })

  // Validar que todos los valores en responseData correspondan a campos del formulario
  Object.keys(responseData).forEach((fieldId) => {
    const field = fieldMap.get(fieldId)
    if (!field) {
      errors.push(`Campo desconocido: ${fieldId}`)
      return
    }

    if (field.hidden) {
      errors.push(`No se puede enviar un valor para el campo oculto: ${field.label}`)
      return
    }

    const value = responseData[fieldId]

    // Validar según el tipo de campo
    const fieldType = field.type as FieldType
    switch (fieldType) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        if (typeof value !== 'string') {
          errors.push(`El campo "${field.label}" debe ser texto`)
          break
        }
        if (field.validations?.minLength && value.length < field.validations.minLength) {
          errors.push(`El campo "${field.label}" debe tener al menos ${field.validations.minLength} caracteres`)
        }
        if (field.validations?.maxLength && value.length > field.validations.maxLength) {
          errors.push(`El campo "${field.label}" debe tener máximo ${field.validations.maxLength} caracteres`)
        }
        if (field.type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`El campo "${field.label}" debe ser un email válido`)
        }
        if (field.type === 'URL' && !/^https?:\/\/.+/.test(value)) {
          errors.push(`El campo "${field.label}" debe ser una URL válida`)
        }
        if (field.validations?.pattern) {
          const regex = new RegExp(field.validations.pattern)
          if (!regex.test(value)) {
            errors.push(field.validations.patternMessage || `El campo "${field.label}" no cumple con el formato requerido`)
          }
        }
        break

      case 'NUMBER':
        // Si el campo no es requerido y está vacío, permitirlo
        if (!field.required && (value === '' || value === null || value === undefined)) {
          break
        }
        // Convertir string a número si es necesario
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        if (typeof numValue !== 'number' || isNaN(numValue)) {
          errors.push(`El campo "${field.label}" debe ser un número`)
          break
        }
        if (field.validations?.min !== undefined && numValue < field.validations.min) {
          errors.push(`El campo "${field.label}" debe ser mayor o igual a ${field.validations.min}`)
        }
        if (field.validations?.max !== undefined && numValue > field.validations.max) {
          errors.push(`El campo "${field.label}" debe ser menor o igual a ${field.validations.max}`)
        }
        break

      case 'DATE':
      case 'TIME':
      case 'DATETIME':
        if (typeof value !== 'string') {
          errors.push(`El campo "${field.label}" debe ser una fecha`)
          break
        }
        // Validar formato de fecha básico
        if (isNaN(Date.parse(value))) {
          errors.push(`El campo "${field.label}" debe ser una fecha válida`)
        }
        break

      case 'SELECT':
      case 'RADIO':
        if (typeof value !== 'string') {
          errors.push(`El campo "${field.label}" debe ser una opción válida`)
          break
        }
        // Validar que el valor esté en las opciones
        if ('options' in field && Array.isArray(field.options)) {
          const validOptions = field.options.map((opt) => opt.value)
          if (!validOptions.includes(value)) {
            errors.push(`El campo "${field.label}" tiene un valor inválido`)
          }
        }
        break

      case 'MULTISELECT':
      case 'CHECKBOX':
        if (field.type === 'CHECKBOX' && !('options' in field)) {
          // Checkbox simple (booleano)
          if (typeof value !== 'boolean') {
            errors.push(`El campo "${field.label}" debe ser verdadero o falso`)
          }
        } else {
          // Multiselect o grupo de checkboxes
          if (!Array.isArray(value)) {
            errors.push(`El campo "${field.label}" debe ser un array`)
            break
          }
          if (field.validations?.minSelections && value.length < field.validations.minSelections) {
            errors.push(`El campo "${field.label}" requiere al menos ${field.validations.minSelections} selección(es)`)
          }
          if (field.validations?.maxSelections && value.length > field.validations.maxSelections) {
            errors.push(`El campo "${field.label}" permite máximo ${field.validations.maxSelections} selección(es)`)
          }
          // Validar que todos los valores estén en las opciones
          if ('options' in field && Array.isArray(field.options)) {
            const validOptions = field.options.map((opt) => opt.value)
            value.forEach((val) => {
              if (typeof val !== 'string' || !validOptions.includes(val)) {
                errors.push(`El campo "${field.label}" contiene valores inválidos`)
              }
            })
          }
        }
        break

      case 'FILE':
      case 'PHOTO':
      case 'SIGNATURE':
        // Por ahora, solo validar que sea string o array de strings
        if (field.type === 'FILE' || field.type === 'PHOTO') {
          if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
            errors.push(`El campo "${field.label}" debe ser un array de URLs`)
          }
        } else {
          if (typeof value !== 'string') {
            errors.push(`El campo "${field.label}" debe ser una cadena de texto`)
          }
        }
        break

      default:
        // Tipo desconocido, permitir cualquier valor
        break
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * POST /api/form-responses
 * Envía una respuesta de formulario
 */
export const submitResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[submitResponse] Iniciando...')
    
    // Validar payload
    console.log('[submitResponse] Validando payload...')
    const validationResult = submitResponseSchema.safeParse(req.body)
    if (!validationResult.success) {
      console.log('[submitResponse] Error de validación de payload:', validationResult.error.issues)
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: validationResult.error.issues,
      })
    }
    const payload = validationResult.data
    console.log('[submitResponse] Payload validado:', { formId: payload.formId, dataKeys: Object.keys(payload.data) })
    
    // Validar que los datos no estén vacíos
    if (!payload.data || Object.keys(payload.data).length === 0) {
      return res.status(400).json({
        error: 'Los datos de la respuesta no pueden estar vacíos',
      })
    }
    
    const authReq = req as AuthRequest
    const userId = authReq.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }
    console.log('[submitResponse] Usuario autenticado:', userId)

    // Obtener el formulario y sus campos
    console.log('[submitResponse] Obteniendo formulario...')
    const form = await prisma.form.findUnique({
      where: { id: payload.formId },
      select: {
        id: true,
        title: true,
        fields: true,
        status: true,
      },
    })
    console.log('[submitResponse] Formulario obtenido:', form ? { id: form.id, title: form.title, status: form.status } : 'no encontrado')

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' })
    }

    // Validar que el formulario esté publicado
    if (form.status !== 'PUBLISHED') {
      return res.status(400).json({
        error: 'El formulario no está publicado',
        details: `El formulario "${form.title}" tiene estado ${form.status}`,
      })
    }

    // Validar que el usuario tenga una asignación activa para este formulario
    console.log('[submitResponse] Buscando asignación activa...')
    const now = new Date()
    const assignment = await prisma.formAssignment.findFirst({
      where: {
        formId: payload.formId,
        userId,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
    })
    console.log('[submitResponse] Asignación encontrada:', assignment ? { id: assignment.id, frequency: assignment.frequency } : 'no encontrada')

    if (!assignment) {
      return res.status(403).json({
        error: 'No tienes una asignación activa para este formulario',
        details: 'Solo puedes responder formularios que te hayan sido asignados',
      })
    }

    // Validar estructura de datos contra el schema del formulario
    console.log('[submitResponse] Validando datos contra schema del formulario...')
    const formFields = (form.fields as unknown) as Field[]
    const validation = validateResponseData(formFields, payload.data)
    console.log('[submitResponse] Validación completada:', { valid: validation.valid, errorsCount: validation.errors.length })

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Los datos de la respuesta no son válidos',
        details: validation.errors,
      })
    }

    // Crear la respuesta
    console.log('[submitResponse] Creando respuesta en base de datos...')
    const response = await prisma.formResponse.create({
      data: {
        formId: payload.formId,
        userId,
        data: payload.data as Prisma.InputJsonValue,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
      },
    })
    console.log('[submitResponse] Respuesta creada:', response.id)
    
    // Obtener el título del formulario para la respuesta
    const formTitle = form.title

    // Si la frecuencia es ONCE, marcar la asignación como completada
    if (assignment.frequency === AssignmentFrequency.ONCE) {
      console.log('[submitResponse] Marcando asignación como completada...')
      await prisma.formAssignment.update({
        where: { id: assignment.id },
        data: { isCompleted: true },
      })
      console.log('[submitResponse] Asignación marcada como completada')
    }

    // Crear audit log (no esperar si falla, no debe bloquear la respuesta)
    console.log('[submitResponse] Creando audit log...')
    createAuditLog(
      userId,
      'RESPONSE_SUBMITTED',
      {
        responseId: response.id,
        formId: payload.formId,
        formTitle: form.title,
        hasLocation: !!(payload.latitude && payload.longitude),
      },
      req,
    ).catch((err) => {
      console.error('[submitResponse] Error al crear audit log (no crítico):', err)
    })
    console.log('[submitResponse] Audit log iniciado (no bloqueante)')

    // TODO: Notificar a supervisores si es necesario
    // await notificationService.notifySupervisors(response)

    // Preparar respuesta
    const responseData = {
      id: response.id,
      formId: response.formId,
      formTitle: formTitle,
      submittedAt: response.submittedAt.toISOString(),
      message: 'Respuesta enviada correctamente',
    }
    
    console.log('[submitResponse] Enviando respuesta exitosa:', responseData)
    console.log('[submitResponse] Response object:', { 
      headersSent: res.headersSent,
      finished: res.finished,
    })
    
    // Enviar respuesta
    res.status(201).json(responseData)
    console.log('[submitResponse] Respuesta enviada, finalizando...')
    return
  } catch (error: any) {
    console.error('submitResponse error:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.flatten() })
    }
    
    // Si es un error de Prisma, devolver un mensaje más claro
    if (error?.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Ya existe una respuesta para este formulario',
        details: error?.meta,
      })
    }
    
    if (error?.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Referencia inválida',
        details: error?.meta,
      })
    }
    
    // Error genérico del servidor
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error?.message || 'Ocurrió un error inesperado',
    })
  }
}

/**
 * GET /api/responses o GET /api/forms/:formId/responses
 * Lista respuestas con filtros y paginación
 */
export const getResponses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener formId de params (si viene de /api/forms/:formId/responses) o de query
    const formIdFromParams = (req.params as { formId?: string }).formId
    const parsed = listResponsesQuerySchema.parse(req.query)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 10

    const authReq = req as AuthRequest
    const currentUserId = authReq.user?.id
    const isAdmin = authReq.user?.role === 'ADMIN'
    const isManager = authReq.user?.role === 'MANAGER'

    // Construir filtros
    const where: Prisma.FormResponseWhereInput = {}

    // Si no es admin o manager, solo mostrar sus propias respuestas
    if (!isAdmin && !isManager) {
      where.userId = currentUserId
    } else if (parsed.userId) {
      where.userId = parsed.userId
    }

    // Priorizar formId de params sobre query
    const effectiveFormId = formIdFromParams || parsed.formId
    if (effectiveFormId) {
      where.formId = effectiveFormId
    }

    if (parsed.startDate || parsed.endDate) {
      where.submittedAt = {}
      if (parsed.startDate) {
        where.submittedAt.gte = new Date(parsed.startDate)
      }
      if (parsed.endDate) {
        where.submittedAt.lte = new Date(parsed.endDate)
      }
    }

    const [responses, total] = await prisma.$transaction([
      prisma.formResponse.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          form: {
            select: {
              id: true,
              title: true,
            },
          },
          // Incluir datos del usuario (necesitamos hacer un join manual)
        },
      }),
      prisma.formResponse.count({ where }),
    ])

    // Obtener información de usuarios
    const userIds = [...new Set(responses.map((r) => r.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    return res.status(200).json({
      data: responses.map((response) => {
        const user = userMap.get(response.userId)
        return {
          id: response.id,
          formId: response.formId,
          formTitle: response.form.title,
          userId: response.userId,
          userName: user?.name,
          userEmail: user?.email,
          data: response.data,
          latitude: response.latitude,
          longitude: response.longitude,
          submittedAt: response.submittedAt.toISOString(),
        }
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('getResponses error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.flatten() })
    }
    next(error)
  }
}

/**
 * GET /api/form-responses/:id
 * Obtiene una respuesta específica
 */
export const getResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    const currentUserId = authReq.user?.id
    const isAdmin = authReq.user?.role === 'ADMIN'
    const isManager = authReq.user?.role === 'MANAGER'

    const response = await prisma.formResponse.findUnique({
      where: { id },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    })

    if (!response) {
      return res.status(404).json({ error: 'Respuesta no encontrada' })
    }

    // Verificar permisos: solo el usuario que creó la respuesta, admin o manager pueden verla
    if (!isAdmin && !isManager && response.userId !== currentUserId) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta respuesta' })
    }

    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: response.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return res.status(200).json({
      id: response.id,
      formId: response.formId,
      formTitle: response.form.title,
      formDescription: response.form.description,
      userId: response.userId,
      userName: user?.name,
      userEmail: user?.email,
      data: response.data,
      latitude: response.latitude,
      longitude: response.longitude,
      submittedAt: response.submittedAt.toISOString(),
    })
  } catch (error) {
    console.error('getResponse error:', error)
    next(error)
  }
}

export default {
  submitResponse,
  getResponses,
  getResponse,
}

