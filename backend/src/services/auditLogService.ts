import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuditLogFilters {
  page?: number
  limit?: number
  userId?: string
  module?: string
  action?: string
  startDate?: Date
  endDate?: Date
}

/**
 * Obtiene los logs de auditoría con filtros y paginación
 */
export const getAuditLogs = async (filters: AuditLogFilters) => {
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const limit = filters.limit && filters.limit > 0 && filters.limit <= 100 ? filters.limit : 20

  const where: Prisma.AuditLogWhereInput = {}

  if (filters.userId) {
    where.userId = filters.userId
  }

  if (filters.module) {
    where.module = filters.module
  }

  if (filters.action) {
    where.action = {
      contains: filters.action,
      mode: 'insensitive',
    }
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    data: logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Obtiene los módulos únicos de los logs de auditoría
 */
export const getAuditLogModules = async (): Promise<string[]> => {
  const logs = await prisma.auditLog.findMany({
    select: {
      module: true,
    },
    distinct: ['module'],
  })

  return logs.map((log) => log.module).sort()
}

/**
 * Obtiene las acciones únicas de los logs de auditoría
 */
export const getAuditLogActions = async (module?: string): Promise<string[]> => {
  const where: Prisma.AuditLogWhereInput = {}
  if (module) {
    where.module = module
  }

  const logs = await prisma.auditLog.findMany({
    where,
    select: {
      action: true,
    },
    distinct: ['action'],
  })

  return logs.map((log) => log.action).sort()
}

