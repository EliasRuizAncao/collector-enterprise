import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

import { AuthRequest } from '@/middleware/auth'

const prisma = new PrismaClient()

/**
 * Schema de validación para query params de búsqueda
 */
const searchQuerySchema = z.object({
  q: z.string().min(2, 'La búsqueda debe tener al menos 2 caracteres'),
  types: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').filter(Boolean) : [])),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

/**
 * GET /api/search
 * Búsqueda global en assignments, forms e history
 */
export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = searchQuerySchema.parse(req.query)
    const authReq = req as AuthRequest
    const currentUserId = authReq.user?.id
    const isAdmin = authReq.user?.role === 'ADMIN'

    const query = parsed.q.toLowerCase().trim()
    const types = parsed.types || ['assignment', 'form', 'history']
    const results: {
      assignments: Array<{
        type: 'assignment'
        id: string
        formName: string
        status: 'pending' | 'in_progress' | 'completed'
        date: string
        description?: string
      }>
      forms: Array<{
        type: 'form'
        id: string
        name: string
        description?: string
      }>
      history: Array<{
        type: 'history'
        id: string
        activity: string
        date: string
        metadata?: {
          formId?: string
          formName?: string
        }
      }>
    } = {
      assignments: [],
      forms: [],
      history: [],
    }

    // Búsqueda en Assignments
    if (types.includes('assignment')) {
      const assignmentWhere: any = {
        OR: [
          {
            form: {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            form: {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        ],
      }

      // Si no es admin, solo sus asignaciones
      if (!isAdmin) {
        assignmentWhere.userId = currentUserId
      }

      // Filtro por estado (mapear a isCompleted)
      if (parsed.status === 'completed') {
        assignmentWhere.isCompleted = true
      } else if (parsed.status === 'pending' || parsed.status === 'in_progress') {
        assignmentWhere.isCompleted = false
      }

      // Filtro por fecha
      if (parsed.startDate || parsed.endDate) {
        assignmentWhere.createdAt = {}
        if (parsed.startDate) {
          assignmentWhere.createdAt.gte = new Date(parsed.startDate)
        }
        if (parsed.endDate) {
          assignmentWhere.createdAt.lte = new Date(parsed.endDate)
        }
      }

      const assignments = await prisma.formAssignment.findMany({
        where: assignmentWhere,
        include: {
          form: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
        take: 5, // Máximo 5 resultados
        orderBy: {
          createdAt: 'desc',
        },
      })

      results.assignments = assignments.map((assignment) => {
        // Determinar status basado en isCompleted y fecha
        let status: 'pending' | 'in_progress' | 'completed' = 'pending'
        if (assignment.isCompleted) {
          status = 'completed'
        } else {
          // Si tiene fecha de inicio y no está completada, está en progreso
          const now = new Date()
          const startDate = new Date(assignment.startDate)
          if (startDate <= now) {
            status = 'in_progress'
          }
        }

        return {
          type: 'assignment' as const,
          id: assignment.id,
          formName: assignment.form.title,
          status,
          date: assignment.createdAt.toISOString(),
          description: assignment.form.description || undefined,
        }
      })
    }

    // Búsqueda en Forms
    if (types.includes('form')) {
      const formWhere: any = {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        status: 'PUBLISHED', // Solo formularios publicados
      }

      // Filtro por fecha
      if (parsed.startDate || parsed.endDate) {
        formWhere.createdAt = {}
        if (parsed.startDate) {
          formWhere.createdAt.gte = new Date(parsed.startDate)
        }
        if (parsed.endDate) {
          formWhere.createdAt.lte = new Date(parsed.endDate)
        }
      }

      const forms = await prisma.form.findMany({
        where: formWhere,
        select: {
          id: true,
          title: true,
          description: true,
        },
        take: 3, // Máximo 3 resultados
        orderBy: {
          createdAt: 'desc',
        },
      })

      results.forms = forms.map((form) => ({
        type: 'form' as const,
        id: form.id,
        name: form.title,
        description: form.description || undefined,
      }))
    }

    // Búsqueda en History (AuditLog)
    if (types.includes('history')) {
      const historyWhere: any = {
        OR: [
          {
            action: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            module: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      }

      // Si no es admin, solo su historial
      if (!isAdmin) {
        historyWhere.userId = currentUserId
      }

      // Filtro por fecha
      if (parsed.startDate || parsed.endDate) {
        historyWhere.createdAt = {}
        if (parsed.startDate) {
          historyWhere.createdAt.gte = new Date(parsed.startDate)
        }
        if (parsed.endDate) {
          historyWhere.createdAt.lte = new Date(parsed.endDate)
        }
      }

      const history = await prisma.auditLog.findMany({
        where: historyWhere,
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        take: 5, // Máximo 5 resultados
        orderBy: {
          createdAt: 'desc',
        },
      })

      results.history = history.map((log) => {
        // Construir actividad descriptiva
        let activity = `${log.action}`
        if (log.module) {
          activity += ` en ${log.module}`
        }
        if (log.user) {
          activity += ` por ${log.user.name}`
        }

        // Extraer metadata si existe
        const metadata: { formId?: string; formName?: string } = {}
        if (log.details && typeof log.details === 'object') {
          const details = log.details as any
          if (details.formId) {
            metadata.formId = details.formId
          }
          if (details.formName) {
            metadata.formName = details.formName
          }
        }

        return {
          type: 'history' as const,
          id: log.id,
          activity,
          date: log.createdAt.toISOString(),
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        }
      })
    }

    res.json(results)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      })
    }
    next(error)
  }
}

