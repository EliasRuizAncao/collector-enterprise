import { Request, Response, NextFunction } from 'express'
import { PrismaClient, FormStatus } from '@prisma/client'
import { z } from 'zod'

import { AuthRequest } from '@/middleware/auth'

const prisma = new PrismaClient()

// Schema de validación para query params de formularios completados
const completedFormsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
})

/**
 * Obtiene estadísticas generales del dashboard (KPIs)
 * - Total formularios activos (status PUBLISHED)
 * - Formularios completados hoy/semana
 * - Usuarios activos
 * - Tasa de completitud (%)
 * - Comparación con periodo anterior
 */
export const getDashboardStats = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    // Fechas para el periodo actual (hoy y últimos 7 días)
    const now = new Date()
    const startOfToday = new Date(now.setHours(0, 0, 0, 0))
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - 7)

    // Fechas para el periodo anterior (hace 7-14 días para comparación semanal)
    const startOfPreviousWeek = new Date(startOfWeek)
    startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7)
    const endOfPreviousWeek = new Date(startOfWeek)

    // Total formularios activos (PUBLISHED)
    const totalActiveForms = await prisma.form.count({
      where: {
        status: FormStatus.PUBLISHED,
      },
    })

    // Formularios completados hoy
    const formsCompletedToday = await prisma.formResponse.count({
      where: {
        submittedAt: {
          gte: startOfToday,
        },
      },
    })

    // Formularios completados esta semana
    const formsCompletedThisWeek = await prisma.formResponse.count({
      where: {
        submittedAt: {
          gte: startOfWeek,
        },
      },
    })

    // Formularios completados semana anterior (para comparación)
    const formsCompletedPreviousWeek = await prisma.formResponse.count({
      where: {
        submittedAt: {
          gte: startOfPreviousWeek,
          lt: endOfPreviousWeek,
        },
      },
    })

    // Usuarios activos (con isActive = true)
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
      },
    })

    // Usuarios activos del mes anterior (para comparación)
    // Nota: En este caso usamos todos los usuarios activos, pero podríamos
    // mejorar esto para usuarios activos que hayan usado el sistema en el último mes
    const previousActiveUsers = activeUsers // Simplificado por ahora

    // Total de asignaciones para calcular tasa de completitud
    const totalAssignments = await prisma.formAssignment.count()
    const completedAssignments = await prisma.formAssignment.count({
      where: {
        isCompleted: true,
      },
    })

    // Tasa de completitud
    const completionRate =
      totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0

    // Asignaciones completadas esta semana
    const assignmentsCompletedThisWeek = await prisma.formAssignment.count({
      where: {
        isCompleted: true,
        updatedAt: {
          gte: startOfWeek,
        },
      },
    })

    // Asignaciones completadas semana anterior
    const assignmentsCompletedPreviousWeek = await prisma.formAssignment.count({
      where: {
        isCompleted: true,
        updatedAt: {
          gte: startOfPreviousWeek,
          lt: endOfPreviousWeek,
        },
      },
    })

    // Calcular cambios porcentuales
    const formsCompletedChange =
      formsCompletedPreviousWeek > 0
        ? ((formsCompletedThisWeek - formsCompletedPreviousWeek) /
            formsCompletedPreviousWeek) *
          100
        : formsCompletedThisWeek > 0
          ? 100
          : 0

    const completionRateChange =
      assignmentsCompletedPreviousWeek > 0
        ? ((assignmentsCompletedThisWeek - assignmentsCompletedPreviousWeek) /
            assignmentsCompletedPreviousWeek) *
          100
        : assignmentsCompletedThisWeek > 0
          ? 100
          : 0

    // Respuesta con todos los KPIs
    res.json({
      kpis: {
        totalActiveForms: {
          value: totalActiveForms,
          change: 0, // No comparamos esto por ahora
        },
        formsCompletedToday: {
          value: formsCompletedToday,
          change: 0, // Podríamos comparar con ayer
        },
        formsCompletedThisWeek: {
          value: formsCompletedThisWeek,
          change: Number(formsCompletedChange.toFixed(1)),
        },
        activeUsers: {
          value: activeUsers,
          change: 0, // Simplificado
        },
        completionRate: {
          value: Number(completionRate.toFixed(1)),
          change: Number(completionRateChange.toFixed(1)),
        },
      },
    })
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' })
  }
}

/**
 * Obtiene formularios completados agrupados por fecha
 * Query params: startDate, endDate, userId
 * Retorna series para gráfico de línea
 */
export const getFormsCompleted = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    // Validar query params
    const query = completedFormsQuerySchema.parse(req.query)

    // Fechas por defecto: últimos 7 días
    const endDate = query.endDate ? new Date(query.endDate) : new Date()
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Construir filtro
    const where: any = {
      submittedAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (query.userId) {
      where.userId = query.userId
    }

    // Obtener todas las respuestas en el rango de fechas
    const responses = await prisma.formResponse.findMany({
      where,
      select: {
        submittedAt: true,
      },
      orderBy: {
        submittedAt: 'asc',
      },
    })

    // Agrupar por día
    const groupedByDay = responses.reduce((acc, response) => {
      const date = new Date(response.submittedAt)
      const dayKey = date.toISOString().split('T')[0] // YYYY-MM-DD

      if (!acc[dayKey]) {
        acc[dayKey] = 0
      }
      acc[dayKey]++

      return acc
    }, {} as Record<string, number>)

    // Generar serie para todos los días en el rango
    const series = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dayKey = currentDate.toISOString().split('T')[0]
      const dayName = currentDate.toLocaleDateString('es-ES', { weekday: 'short' })
      const dayNumber = currentDate.getDate()

      series.push({
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1), // Primera letra mayúscula
        date: dayKey,
        completados: groupedByDay[dayKey] || 0,
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    res.json({
      series,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.issues })
    }

    console.error('Error al obtener formularios completados:', error)
    res.status(500).json({ error: 'Error al obtener formularios completados' })
  }
}

/**
 * Obtiene formularios agrupados por tipo o categoría
 * Retorna datos para gráfico de barras
 * Por ahora agrupamos por status, pero podríamos mejorarlo agrupando por campos del formulario
 */
export const getFormsByType = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    // Agrupar formularios por status
    const formsByStatus = await prisma.form.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    // Mapear a formato para el gráfico
    const data = formsByStatus.map((item) => ({
      type: item.status === FormStatus.PUBLISHED ? 'Publicado' : item.status === FormStatus.DRAFT ? 'Borrador' : 'Archivado',
      cantidad: item._count.id,
    }))

    // También podemos agrupar respuestas por formulario para ver cuáles son más usados
    const responsesByForm = await prisma.formResponse.groupBy({
      by: ['formId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10, // Top 10 formularios más usados
    })

    // Obtener información de los formularios
    const formIds = responsesByForm.map((r) => r.formId)
    const forms = await prisma.form.findMany({
      where: {
        id: {
          in: formIds,
        },
      },
      select: {
        id: true,
        title: true,
      },
    })

    const topForms = responsesByForm.map((r) => {
      const form = forms.find((f) => f.id === r.formId)
      return {
        type: form?.title || 'Formulario desconocido',
        cantidad: r._count.id,
      }
    })

    res.json({
      byStatus: data,
      topForms,
    })
  } catch (error) {
    console.error('Error al obtener formularios por tipo:', error)
    res.status(500).json({ error: 'Error al obtener formularios por tipo' })
  }
}

/**
 * Mapeo de acciones en inglés a español
 */
const actionTranslations: Record<string, string> = {
  // Respuestas
  RESPONSE_SUBMITTED: 'Completó formulario',
  
  // Formularios
  FORM_CREATED: 'Creó formulario',
  FORM_PUBLISHED: 'Publicó formulario',
  FORM_ARCHIVED: 'Archivó formulario',
  FORM_UPDATED: 'Actualizó formulario',
  FORM_DELETED: 'Eliminó formulario',
  
  // Usuarios
  USER_CREATED: 'Creó usuario',
  USER_UPDATED: 'Actualizó usuario',
  USER_DEACTIVATED: 'Desactivó usuario',
  USER_ACTIVATED: 'Activó usuario',
  USER_ROLE_CHANGED: 'Cambió rol de usuario',
  USER_DELETED: 'Eliminó usuario',
  
  // Asignaciones
  ASSIGNMENTS_CREATED: 'Creó asignación',
  ASSIGNMENT_UPDATED: 'Actualizó asignación',
  ASSIGNMENT_DELETED: 'Eliminó asignación',
  ASSIGNMENT_COMPLETED: 'Completó asignación',
  
  // Otros
  LOGIN: 'Inició sesión',
  LOGOUT: 'Cerró sesión',
  SETTINGS_UPDATED: 'Actualizó configuración',
  REPORT_GENERATED: 'Generó reporte',
}

/**
 * Mapeo de módulos en inglés a español
 */
const moduleTranslations: Record<string, string> = {
  RESPONSES: 'Formularios',
  FORMS: 'Formularios',
  USERS: 'Usuarios',
  ASSIGNMENTS: 'Asignaciones',
  AUTH: 'Autenticación',
  SETTINGS: 'Configuración',
  REPORTS: 'Reportes',
  INCIDENTS: 'Incidentes',
}

/**
 * Determina el estado de la actividad basándose en la acción
 */
const getActivityStatus = (action: string): 'success' | 'warning' | 'error' => {
  const upperAction = action.toUpperCase()
  
  // Acciones de éxito (completadas, creadas, publicadas, activadas)
  if (
    upperAction.includes('SUBMITTED') ||
    upperAction.includes('CREATED') ||
    upperAction.includes('PUBLISHED') ||
    upperAction.includes('ACTIVATED') ||
    upperAction.includes('COMPLETED') ||
    upperAction.includes('LOGIN') ||
    upperAction.includes('GENERATED')
  ) {
    return 'success'
  }
  
  // Acciones de error (eliminadas, rechazadas, deactivadas)
  if (
    upperAction.includes('DELETED') ||
    upperAction.includes('REJECTED') ||
    upperAction.includes('DEACTIVATED') ||
    upperAction.includes('ARCHIVED')
  ) {
    return 'error'
  }
  
  // Acciones de advertencia (actualizadas, cambiadas, otras)
  return 'warning'
}

/**
 * Traduce una acción a español
 */
const translateAction = (action: string): string => {
  return actionTranslations[action.toUpperCase()] || action
}

/**
 * Traduce un módulo a español
 */
const translateModule = (module: string): string => {
  return moduleTranslations[module.toUpperCase()] || module
}

/**
 * Obtiene actividad reciente del sistema (últimas 10 acciones del AuditLog)
 * Incluye relación con User
 * Ordenado por fecha descendente
 */
export const getRecentActivity = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    const activities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Mapear a formato para el frontend
    const mappedActivities = activities.map((activity) => ({
      id: activity.id,
      user: activity.user.name,
      action: translateAction(activity.action),
      module: translateModule(activity.module),
      timestamp: activity.createdAt.toISOString(),
      status: getActivityStatus(activity.action),
    }))

    res.json({
      activities: mappedActivities,
    })
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error)
    res.status(500).json({ error: 'Error al obtener actividad reciente' })
  }
}

// Mantener compatibilidad con rutas existentes
export const getPendingForms = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    // Obtener asignaciones pendientes
    const pendingAssignments = await prisma.formAssignment.findMany({
      where: {
        isCompleted: false,
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({
      pendingForms: pendingAssignments,
      count: pendingAssignments.length,
    })
  } catch (error) {
    console.error('Error al obtener formularios pendientes:', error)
    res.status(500).json({ error: 'Error al obtener formularios pendientes' })
  }
}

export default {
  getDashboardStats,
  getFormsCompleted,
  getPendingForms,
  getRecentActivity,
  getFormsByType,
}
