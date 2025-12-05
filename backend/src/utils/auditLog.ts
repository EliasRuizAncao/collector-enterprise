import { Request } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Módulos disponibles para los logs de auditoría
 */
export const AUDIT_MODULES = {
  AUTH: 'AUTH',
  USERS: 'USERS',
  FORMS: 'FORMS',
  ASSIGNMENTS: 'ASSIGNMENTS',
  RESPONSES: 'RESPONSES',
  EPP: 'EPP',
  REPORTS: 'REPORTS',
  NOTIFICATIONS: 'NOTIFICATIONS',
  WAREHOUSE: 'WAREHOUSE',
} as const

export type AuditModule = typeof AUDIT_MODULES[keyof typeof AUDIT_MODULES]

/**
 * Parámetros para crear un log de auditoría
 */
export interface CreateAuditLogParams {
  /** ID del usuario que realiza la acción */
  userId: string | undefined
  /** Acción realizada (ej: 'USER_CREATED', 'FORM_PUBLISHED') */
  action: string
  /** Módulo al que pertenece la acción */
  module: AuditModule
  /** Detalles adicionales de la acción (opcional) */
  details?: Prisma.InputJsonValue
  /** Request de Express para extraer IP y User-Agent */
  req: Request
}

/**
 * Extrae el User-Agent de forma segura del request
 */
const safeUserAgent = (req: Request): string | undefined => {
  const header = req.headers['user-agent']
  return Array.isArray(header) ? header.join(',') : header ?? undefined
}

/**
 * Extrae la IP del request, considerando proxies y load balancers
 */
const getClientIp = (req: Request): string | undefined => {
  // Intentar obtener IP de headers comunes de proxies
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded.join(',') : forwarded
    return ips.split(',')[0].trim()
  }

  const realIp = req.headers['x-real-ip']
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp
  }

  // Fallback a req.ip (requiere que Express confíe en el proxy)
  return req.ip || req.socket.remoteAddress || undefined
}

/**
 * Crea un registro de auditoría en la base de datos
 * 
 * Esta función no debe fallar la operación principal si hay un error al crear el log.
 * Los errores se registran en la consola pero no se propagan.
 * 
 * @param params - Parámetros para crear el log de auditoría
 * @returns Promise que se resuelve cuando el log se crea (o falla silenciosamente)
 */
export const createAuditLog = async (params: CreateAuditLogParams): Promise<void> => {
  const { userId, action, module, details, req } = params

  // No crear log si no hay usuario
  if (!userId) {
    return
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        details: details ?? undefined,
        ipAddress: getClientIp(req),
        userAgent: safeUserAgent(req),
      },
    })
  } catch (error) {
    // No fallar la operación principal si el audit log falla
    // Solo registrar el error en la consola
    console.error('[auditLog] Error al crear log de auditoría:', {
      userId,
      action,
      module,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Middleware factory para crear logs de auditoría automáticamente
 * 
 * Este middleware crea un log de auditoría después de que la acción se complete exitosamente.
 * Se debe usar después de los middlewares de autenticación y autorización.
 * 
 * @param module - Módulo al que pertenece la acción
 * @param action - Acción que se está registrando
 * @param getDetails - Función opcional para extraer detalles del request/response
 * @returns Middleware de Express
 * 
 * @example
 * ```typescript
 * router.post('/users', authenticate, authorize(Role.ADMIN), 
 *   auditMiddleware(AUDIT_MODULES.USERS, 'USER_CREATED', (req, res) => ({
 *     targetUserId: res.locals.createdUser?.id
 *   }))
 * )
 * ```
 */
export const auditMiddleware = (
  module: AuditModule,
  action: string,
  getDetails?: (req: Request, res: any) => Prisma.InputJsonValue | undefined,
) => {
  return async (req: Request, res: any, next: any) => {
    // Guardar la función original de res.json
    const originalJson = res.json.bind(res)

    // Interceptar res.json para crear el log después de una respuesta exitosa
    res.json = function (body: any) {
      // Si la respuesta es exitosa (2xx), crear el log
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const authReq = req as any
        const userId = authReq.user?.id

        if (userId) {
          const details = getDetails ? getDetails(req, res) : undefined

          // Crear el log de forma asíncrona (no esperar)
          createAuditLog({
            userId,
            action,
            module,
            details,
            req,
          }).catch((error) => {
            console.error('[auditMiddleware] Error al crear log:', error)
          })
        }
      }

      // Llamar a la función original
      return originalJson(body)
    }

    next()
  }
}

