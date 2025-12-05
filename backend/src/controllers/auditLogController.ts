import { Response, NextFunction } from 'express'
import { z } from 'zod'

import { AuthRequest } from '@/middleware/auth'
import { getAuditLogs, getAuditLogModules, getAuditLogActions } from '@/services/auditLogService'

// Schema de validación para query params
const getAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  userId: z.string().uuid('ID de usuario inválido').optional(),
  module: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime('Fecha de inicio inválida').optional(),
  endDate: z.string().datetime('Fecha de fin inválida').optional(),
})

/**
 * GET /api/audit-logs
 * Obtiene los logs de auditoría con filtros y paginación
 * Solo accesible para ADMIN
 */
export const getAuditLogsList = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Validar que sea ADMIN
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Solo los administradores pueden acceder a los logs de auditoría',
      })
    }

    // Validar query params
    const query = getAuditLogsQuerySchema.parse(req.query)

    // Convertir fechas
    const filters = {
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      module: query.module,
      action: query.action,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    }

    // Obtener logs
    const result = await getAuditLogs(filters)

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('[auditLogController] error in getAuditLogsList', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: error.errors,
      })
    }

    return res.status(500).json({
      error: 'Error al obtener logs de auditoría',
    })
  }
}

/**
 * GET /api/audit-logs/modules
 * Obtiene la lista de módulos únicos disponibles
 * Solo accesible para ADMIN
 */
export const getModules = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Validar que sea ADMIN
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Solo los administradores pueden acceder a los logs de auditoría',
      })
    }

    const modules = await getAuditLogModules()

    return res.status(200).json({
      success: true,
      data: modules,
    })
  } catch (error) {
    console.error('[auditLogController] error in getModules', error)
    return res.status(500).json({
      error: 'Error al obtener módulos',
    })
  }
}

/**
 * GET /api/audit-logs/actions
 * Obtiene la lista de acciones únicas disponibles (opcionalmente filtradas por módulo)
 * Solo accesible para ADMIN
 */
export const getActions = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Validar que sea ADMIN
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Solo los administradores pueden acceder a los logs de auditoría',
      })
    }

    const module = typeof req.query.module === 'string' ? req.query.module : undefined
    const actions = await getAuditLogActions(module)

    return res.status(200).json({
      success: true,
      data: actions,
    })
  } catch (error) {
    console.error('[auditLogController] error in getActions', error)
    return res.status(500).json({
      error: 'Error al obtener acciones',
    })
  }
}

