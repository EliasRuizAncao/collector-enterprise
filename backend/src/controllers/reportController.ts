import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import * as XLSX from 'xlsx'
import PDFDocument from 'pdfkit'

import { AuthRequest } from '@/middleware/auth'

const prisma = new PrismaClient()

// Schema de validación para reporte de completitud
const completionReportQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
  formId: z.string().uuid().optional(),
})

// Schema de validación para reporte de rendimiento de usuario
const userPerformanceQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

/**
 * Reporte de completitud de formularios
 * Agrupa respuestas por usuario/formulario y calcula tasas de completitud
 */
export const getCompletionReport = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    // Validar query params
    const query = completionReportQuerySchema.parse(req.query)

    // Fechas por defecto: últimos 30 días
    const endDate = query.endDate ? new Date(query.endDate) : new Date()
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Construir filtro para respuestas
    const responseWhere: any = {
      submittedAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (query.userId) {
      responseWhere.userId = query.userId
    }

    if (query.formId) {
      responseWhere.formId = query.formId
    }

    // Obtener respuestas con relaciones
    const responses = await prisma.formResponse.findMany({
      where: responseWhere,
      include: {
        form: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    // Obtener información de usuarios (join manual)
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

    // Agrupar por usuario y formulario
    const groupedData = responses.reduce((acc, response) => {
      const user = userMap.get(response.userId)
      if (!user) return acc // Skip si no se encuentra el usuario

      const key = `${response.userId}-${response.formId}`
      if (!acc[key]) {
        acc[key] = {
          userId: response.userId,
          userName: user.name,
          userEmail: user.email,
          formId: response.formId,
          formTitle: response.form.title,
          totalResponses: 0,
          firstResponse: response.submittedAt,
          lastResponse: response.submittedAt,
        }
      }

      acc[key].totalResponses++
      if (response.submittedAt < acc[key].firstResponse) {
        acc[key].firstResponse = response.submittedAt
      }
      if (response.submittedAt > acc[key].lastResponse) {
        acc[key].lastResponse = response.submittedAt
      }

      return acc
    }, {} as Record<string, any>)

    // Obtener asignaciones para calcular tasas de completitud
    const assignmentsWhere: any = {
      startDate: {
        lte: endDate,
      },
    }

    if (query.userId) {
      assignmentsWhere.userId = query.userId
    }

    if (query.formId) {
      assignmentsWhere.formId = query.formId
    }

    const assignments = await prisma.formAssignment.findMany({
      where: assignmentsWhere,
      select: {
        userId: true,
        formId: true,
        isCompleted: true,
      },
    })

    // Agrupar asignaciones por usuario/formulario
    const assignmentCounts = assignments.reduce((acc, assignment) => {
      const key = `${assignment.userId}-${assignment.formId}`
      if (!acc[key]) {
        acc[key] = { total: 0, completed: 0 }
      }
      acc[key].total++
      if (assignment.isCompleted) {
        acc[key].completed++
      }
      return acc
    }, {} as Record<string, { total: number; completed: number }>)

    // Calcular tasas de completitud
    const reportData = Object.values(groupedData).map((item: any) => {
      const key = `${item.userId}-${item.formId}`
      const assignmentData = assignmentCounts[key] || { total: 0, completed: 0 }
      const completionRate =
        assignmentData.total > 0
          ? (assignmentData.completed / assignmentData.total) * 100
          : item.totalResponses > 0
            ? 100
            : 0

      return {
        ...item,
        assignedCount: assignmentData.total,
        completedCount: assignmentData.completed,
        completionRate: Number(completionRate.toFixed(2)),
      }
    })

    // Estadísticas generales
    const totalResponses = responses.length
    const totalUsers = new Set(responses.map((r) => r.userId)).size
    const totalForms = new Set(responses.map((r) => r.formId)).size
    const averageCompletionRate =
      reportData.length > 0
        ? reportData.reduce((sum, item) => sum + item.completionRate, 0) / reportData.length
        : 0

    res.json({
      data: reportData,
      summary: {
        totalResponses,
        totalUsers,
        totalForms,
        averageCompletionRate: Number(averageCompletionRate.toFixed(2)),
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.issues })
    }

    console.error('Error al obtener reporte de completitud:', error)
    res.status(500).json({ error: 'Error al obtener reporte de completitud' })
  }
}

/**
 * Reporte de rendimiento de usuarios
 * Ranking de usuarios más activos con métricas de rendimiento
 */
export const getUserPerformanceReport = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    // Validar query params
    const query = userPerformanceQuerySchema.parse(req.query)

    // Fechas por defecto: últimos 30 días
    const endDate = query.endDate ? new Date(query.endDate) : new Date()
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    const limit = query.limit || 50

    // Obtener respuestas agrupadas por usuario
    const responses = await prisma.formResponse.findMany({
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    // Obtener información de usuarios (join manual)
    const userIds = [...new Set(responses.map((r) => r.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    // Agrupar por usuario y calcular métricas
    const userStats = responses.reduce((acc, response) => {
      const user = userMap.get(response.userId)
      if (!user) return acc // Skip si no se encuentra el usuario

      const userId = response.userId
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          totalResponses: 0,
          responseTimes: [] as number[],
          firstResponse: response.submittedAt,
          lastResponse: response.submittedAt,
          formsCompleted: new Set<string>(),
        }
      }

      acc[userId].totalResponses++
      acc[userId].formsCompleted.add(response.formId)

      if (response.submittedAt < acc[userId].firstResponse) {
        acc[userId].firstResponse = response.submittedAt
      }
      if (response.submittedAt > acc[userId].lastResponse) {
        acc[userId].lastResponse = response.submittedAt
      }

      return acc
    }, {} as Record<string, any>)

    // Calcular tiempo promedio entre respuestas (si hay más de una)
    const reportData = Object.values(userStats)
      .map((user: any) => {
        const daysActive =
          (new Date(user.lastResponse).getTime() - new Date(user.firstResponse).getTime()) /
          (1000 * 60 * 60 * 24)

        // Calcular promedio de respuestas por día
        const responsesPerDay = daysActive > 0 ? user.totalResponses / daysActive : user.totalResponses

        return {
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          userRole: user.userRole,
          totalResponses: user.totalResponses,
          uniqueFormsCompleted: user.formsCompleted.size,
          daysActive: Number(daysActive.toFixed(1)),
          averageResponsesPerDay: Number(responsesPerDay.toFixed(2)),
          firstResponse: user.firstResponse,
          lastResponse: user.lastResponse,
          // Score para ranking (respuestas totales * formas únicas)
          performanceScore: user.totalResponses * user.formsCompleted.size,
        }
      })
      .sort((a: any, b: any) => b.performanceScore - a.performanceScore)
      .slice(0, limit)

    // Estadísticas generales
    const totalUsers = reportData.length
    const totalResponses = responses.length
    const averageResponsesPerUser =
      totalUsers > 0 ? Number((totalResponses / totalUsers).toFixed(2)) : 0

    res.json({
      data: reportData,
      summary: {
        totalUsers,
        totalResponses,
        averageResponsesPerUser,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.issues })
    }

    console.error('Error al obtener reporte de rendimiento de usuarios:', error)
    res.status(500).json({ error: 'Error al obtener reporte de rendimiento de usuarios' })
  }
}

/**
 * Reporte de analíticas de un formulario específico
 * Incluye respuestas por campo y tendencias temporales
 */
export const getFormAnalyticsReport = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    const formId = req.params.formId

    if (!formId) {
      return res.status(400).json({ error: 'ID de formulario requerido' })
    }

    // Validar query params opcionales
    const query = z
      .object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      })
      .parse(req.query)

    // Obtener formulario
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: {
        id: true,
        title: true,
        description: true,
        fields: true,
        createdAt: true,
      },
    })

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' })
    }

    // Fechas por defecto: últimos 30 días
    const endDate = query.endDate ? new Date(query.endDate) : new Date()
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Obtener respuestas del formulario
    const responses = await prisma.formResponse.findMany({
      where: {
        formId,
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    })

    // Obtener información de usuarios (join manual)
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

    // Tendencia temporal (agrupado por día)
    const temporalTrend = responses.reduce((acc, response) => {
      const date = new Date(response.submittedAt)
      const dayKey = date.toISOString().split('T')[0] // YYYY-MM-DD

      if (!acc[dayKey]) {
        acc[dayKey] = 0
      }
      acc[dayKey]++

      return acc
    }, {} as Record<string, number>)

    // Convertir a array ordenado
    const temporalTrendArray = Object.entries(temporalTrend)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Analizar respuestas por campo (si los campos están definidos)
    const fieldsAnalysis: Record<string, any> = {}
    if (Array.isArray(form.fields)) {
      const fieldIds = (form.fields as any[]).map((field: any) => field.id).filter(Boolean)

      responses.forEach((response) => {
        const data = response.data as Record<string, any>
        if (typeof data === 'object' && data !== null) {
          Object.entries(data).forEach(([fieldId, value]) => {
            if (fieldIds.includes(fieldId)) {
              if (!fieldsAnalysis[fieldId]) {
                fieldsAnalysis[fieldId] = {
                  fieldId,
                  fieldName: (form.fields as any[]).find((f: any) => f.id === fieldId)?.label || fieldId,
                  responseCount: 0,
                  emptyCount: 0,
                  valueTypes: {} as Record<string, number>,
                }
              }

              fieldsAnalysis[fieldId].responseCount++

              if (value === null || value === undefined || value === '') {
                fieldsAnalysis[fieldId].emptyCount++
              } else {
                const valueType = typeof value
                fieldsAnalysis[fieldId].valueTypes[valueType] =
                  (fieldsAnalysis[fieldId].valueTypes[valueType] || 0) + 1
              }
            }
          })
        }
      })
    }

    // Estadísticas generales
    const totalResponses = responses.length
    const uniqueUsers = new Set(responses.map((r) => r.userId)).size
    const averageResponsesPerDay =
      temporalTrendArray.length > 0
        ? Number((totalResponses / temporalTrendArray.length).toFixed(2))
        : 0

    // Usuarios que más han respondido este formulario
    const userResponseCounts = responses.reduce((acc, response) => {
      const user = userMap.get(response.userId)
      if (!user) return acc // Skip si no se encuentra el usuario

      const userId = response.userId
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName: user.name,
          userEmail: user.email,
          count: 0,
        }
      }
      acc[userId].count++
      return acc
    }, {} as Record<string, any>)

    const topUsers = Object.values(userResponseCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)

    res.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        createdAt: form.createdAt,
      },
      summary: {
        totalResponses,
        uniqueUsers,
        averageResponsesPerDay,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
      temporalTrend: temporalTrendArray,
      fieldsAnalysis: Object.values(fieldsAnalysis),
      topUsers,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.issues })
    }

    console.error('Error al obtener reporte de analíticas de formulario:', error)
    res.status(500).json({ error: 'Error al obtener reporte de analíticas de formulario' })
  }
}

/**
 * Exportar reporte a Excel
 * Soporta diferentes tipos de reporte: completion, user-performance, form-analytics
 */
export const exportReportToExcel = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    const { type, ...queryParams } = req.query

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Tipo de reporte requerido (type)' })
    }

    let data: any[] = []
    let filename = 'reporte'
    let sheetName = 'Reporte'

    // Obtener datos según el tipo de reporte
    switch (type) {
      case 'completion': {
        const query = completionReportQuerySchema.parse(queryParams)
        const endDate = query.endDate ? new Date(query.endDate) : new Date()
        const startDate = query.startDate
          ? new Date(query.startDate)
          : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        const responseWhere: any = {
          submittedAt: { gte: startDate, lte: endDate },
        }
        if (query.userId) responseWhere.userId = query.userId
        if (query.formId) responseWhere.formId = query.formId

        const responses = await prisma.formResponse.findMany({
          where: responseWhere,
          include: {
            form: { select: { id: true, title: true } },
          },
          orderBy: { submittedAt: 'desc' },
        })

        // Obtener información de usuarios (join manual)
        const userIds = [...new Set(responses.map((r) => r.userId))]
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u]))

        data = responses.map((r) => {
          const user = userMap.get(r.userId)
          return {
            'Usuario': user?.name || 'N/A',
            'Email': user?.email || 'N/A',
            'Formulario': r.form?.title || 'N/A',
            'Fecha de Envío': r.submittedAt.toISOString(),
            'Ubicación': r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : 'N/A',
          }
        })

        filename = `reporte-completitud-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`
        sheetName = 'Completitud'
        break
      }

      case 'user-performance': {
        const query = userPerformanceQuerySchema.parse(queryParams)
        const endDate = query.endDate ? new Date(query.endDate) : new Date()
        const startDate = query.startDate
          ? new Date(query.startDate)
          : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        const responses = await prisma.formResponse.findMany({
          where: { submittedAt: { gte: startDate, lte: endDate } },
          orderBy: { submittedAt: 'desc' },
        })

        // Obtener información de usuarios (join manual)
        const userIds = [...new Set(responses.map((r) => r.userId))]
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, role: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u]))

        const userStats = responses.reduce((acc, r) => {
          const userId = r.userId
          const user = userMap.get(userId)
          if (!acc[userId]) {
            acc[userId] = {
              'Usuario': user?.name || 'N/A',
              'Email': user?.email || 'N/A',
              'Rol': user?.role || 'N/A',
              'Total Respuestas': 0,
              'Formularios Únicos': new Set<string>(),
            }
          }
          acc[userId]['Total Respuestas']++
          acc[userId]['Formularios Únicos'].add(r.formId)
          return acc
        }, {} as Record<string, any>)

        data = Object.values(userStats).map((stat: any) => ({
          ...stat,
          'Formularios Únicos': stat['Formularios Únicos'].size,
        }))

        filename = `reporte-rendimiento-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`
        sheetName = 'Rendimiento'
        break
      }

      case 'form-analytics': {
        const formId = queryParams.formId as string
        if (!formId) {
          return res.status(400).json({ error: 'formId requerido para reporte de analíticas' })
        }

        const form = await prisma.form.findUnique({
          where: { id: formId },
          select: { id: true, title: true },
        })

        if (!form) {
          return res.status(404).json({ error: 'Formulario no encontrado' })
        }

        const query = z
          .object({
            startDate: z.string().datetime().optional(),
            endDate: z.string().datetime().optional(),
          })
          .parse(queryParams)

        const endDate = query.endDate ? new Date(query.endDate) : new Date()
        const startDate = query.startDate
          ? new Date(query.startDate)
          : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        const responses = await prisma.formResponse.findMany({
          where: {
            formId,
            submittedAt: { gte: startDate, lte: endDate },
          },
          orderBy: { submittedAt: 'asc' },
        })

        // Obtener información de usuarios (join manual)
        const userIds = [...new Set(responses.map((r) => r.userId))]
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u]))

        data = responses.map((r) => {
          const user = userMap.get(r.userId)
          return {
            'Usuario': user?.name || 'N/A',
            'Email': user?.email || 'N/A',
            'Fecha de Envío': r.submittedAt.toISOString(),
            'Ubicación': r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : 'N/A',
          }
        })

        filename = `reporte-analiticas-${form.title.replace(/[^a-z0-9]/gi, '_')}-${startDate.toISOString().split('T')[0]}`
        sheetName = 'Analíticas'
        break
      }

      default:
        return res.status(400).json({ error: 'Tipo de reporte no válido' })
    }

    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Ajustar ancho de columnas
    const maxWidth = 50
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.min(key.length, maxWidth),
    }))
    worksheet['!cols'] = colWidths

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Enviar archivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`)
    res.send(buffer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.issues })
    }

    console.error('Error al exportar reporte a Excel:', error)
    res.status(500).json({ error: 'Error al exportar reporte a Excel' })
  }
}

/**
 * Exportar reporte a PDF
 * Soporta diferentes tipos de reporte: completion, user-performance, form-analytics
 */
export const exportReportToPDF = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    const { type, ...queryParams } = req.query

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Tipo de reporte requerido (type)' })
    }

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 })
    const buffers: Buffer[] = []

    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="reporte-${type}.pdf"`)
      res.send(pdfBuffer)
    })

    // Agregar título
    doc.fontSize(20).text('Reporte de Collector Enterprise', { align: 'center' })
    doc.moveDown()

    // Obtener y agregar datos según el tipo
    switch (type) {
      case 'completion': {
        const query = completionReportQuerySchema.parse(queryParams)
        const endDate = query.endDate ? new Date(query.endDate) : new Date()
        const startDate = query.startDate
          ? new Date(query.startDate)
          : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        doc.fontSize(16).text('Reporte de Completitud', { align: 'center' })
        doc.fontSize(12).text(`Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, { align: 'center' })
        doc.moveDown()

        const responseWhere: any = {
          submittedAt: { gte: startDate, lte: endDate },
        }
        if (query.userId) responseWhere.userId = query.userId
        if (query.formId) responseWhere.formId = query.formId

        const responses = await prisma.formResponse.findMany({
          where: responseWhere,
          include: {
            form: { select: { title: true } },
          },
          orderBy: { submittedAt: 'desc' },
          take: 100, // Limitar para PDF
        })

        // Obtener información de usuarios (join manual)
        const userIds = [...new Set(responses.map((r) => r.userId))]
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u]))

        doc.fontSize(12).text(`Total de respuestas: ${responses.length}`)
        doc.moveDown()

        responses.forEach((r, index) => {
          const user = userMap.get(r.userId)
          if (index > 0) doc.moveDown(0.5)
          doc.fontSize(10)
          doc.text(`Usuario: ${user?.name || 'N/A'}`)
          doc.text(`Formulario: ${r.form?.title || 'N/A'}`)
          doc.text(`Fecha: ${r.submittedAt.toLocaleString()}`)
          if (index < responses.length - 1) {
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
          }
        })

        break
      }

      case 'user-performance': {
        const query = userPerformanceQuerySchema.parse(queryParams)
        const endDate = query.endDate ? new Date(query.endDate) : new Date()
        const startDate = query.startDate
          ? new Date(query.startDate)
          : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        doc.fontSize(16).text('Reporte de Rendimiento de Usuarios', { align: 'center' })
        doc.fontSize(12).text(`Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, { align: 'center' })
        doc.moveDown()

        const responses = await prisma.formResponse.findMany({
          where: { submittedAt: { gte: startDate, lte: endDate } },
        })

        // Obtener información de usuarios (join manual)
        const userIds = [...new Set(responses.map((r) => r.userId))]
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, role: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u]))

        const userStats = responses.reduce((acc, r) => {
          const userId = r.userId
          const user = userMap.get(userId)
          if (!acc[userId]) {
            acc[userId] = {
              name: user?.name || 'N/A',
              email: user?.email || 'N/A',
              role: user?.role || 'N/A',
              count: 0,
            }
          }
          acc[userId].count++
          return acc
        }, {} as Record<string, any>)

        const sortedUsers = Object.values(userStats)
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 50) // Top 50

        doc.fontSize(12).text(`Total de usuarios: ${Object.keys(userStats).length}`)
        doc.moveDown()

        sortedUsers.forEach((user: any, index) => {
          if (index > 0) doc.moveDown(0.5)
          doc.fontSize(10)
          doc.text(`${index + 1}. ${user.name} (${user.email})`)
          doc.text(`   Rol: ${user.role} | Respuestas: ${user.count}`)
          if (index < sortedUsers.length - 1) {
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
          }
        })

        break
      }

      case 'form-analytics': {
        const formId = queryParams.formId as string
        if (!formId) {
          doc.text('Error: formId requerido')
          doc.end()
          return
        }

        const form = await prisma.form.findUnique({
          where: { id: formId },
          select: { id: true, title: true, description: true },
        })

        if (!form) {
          doc.text('Error: Formulario no encontrado')
          doc.end()
          return
        }

        doc.fontSize(16).text('Reporte de Analíticas de Formulario', { align: 'center' })
        doc.fontSize(14).text(form.title, { align: 'center' })
        if (form.description) {
          doc.fontSize(10).text(form.description, { align: 'center' })
        }
        doc.moveDown()

        const query = z
          .object({
            startDate: z.string().datetime().optional(),
            endDate: z.string().datetime().optional(),
          })
          .parse(queryParams)

        const endDate = query.endDate ? new Date(query.endDate) : new Date()
        const startDate = query.startDate
          ? new Date(query.startDate)
          : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

        doc.fontSize(12).text(`Período: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, { align: 'center' })
        doc.moveDown()

        const responses = await prisma.formResponse.findMany({
          where: {
            formId,
            submittedAt: { gte: startDate, lte: endDate },
          },
          orderBy: { submittedAt: 'desc' },
          take: 100, // Limitar para PDF
        })

        // Obtener información de usuarios (join manual)
        const userIds = [...new Set(responses.map((r) => r.userId))]
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
        const userMap = new Map(users.map((u) => [u.id, u]))

        doc.fontSize(12).text(`Total de respuestas: ${responses.length}`)
        doc.moveDown()

        responses.forEach((r, index) => {
          const user = userMap.get(r.userId)
          if (index > 0) doc.moveDown(0.5)
          doc.fontSize(10)
          doc.text(`Usuario: ${user?.name || 'N/A'}`)
          doc.text(`Fecha: ${r.submittedAt.toLocaleString()}`)
          if (index < responses.length - 1) {
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
          }
        })

        break
      }

      default:
        doc.text('Error: Tipo de reporte no válido')
        doc.end()
        return
    }

    // Finalizar documento
    doc.end()
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.issues })
    }

    console.error('Error al exportar reporte a PDF:', error)
    res.status(500).json({ error: 'Error al exportar reporte a PDF' })
  }
}

export default {
  getCompletionReport,
  getUserPerformanceReport,
  getFormAnalyticsReport,
  exportReportToExcel,
  exportReportToPDF,
}

