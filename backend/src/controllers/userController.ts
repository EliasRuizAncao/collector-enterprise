import { Request, Response, NextFunction } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { z } from 'zod'

import admin from '@/config/firebase'
import { AuthRequest } from '@/middleware/auth'

const prisma = new PrismaClient()
const USERS_MODULE = 'USERS'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  role: z.string().optional(), // Nombre del rol (ej: "ADMIN", "MANAGER")
  roleId: z.string().uuid().optional(), // ID del rol
  isActive: z.coerce.boolean().optional(),
  status: z
    .enum(['ACTIVE', 'INACTIVE'])
    .optional()
    .transform((value) => {
      if (value === 'ACTIVE') return true
      if (value === 'INACTIVE') return false
      return undefined
    }),
  search: z.string().optional(),
})

const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener mínimo 6 caracteres'),
  roleId: z.string().uuid().optional(), // Si no se proporciona, se usará OPERATOR por defecto
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  roleId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: z.string().min(6).optional(),
})

const changeRoleSchema = z.object({
  roleId: z.string().uuid(),
})

type UserWithAudit = {
  id: string
  email: string
  name: string
  roleId: string
  role: {
    id: string
    name: string
    displayName: string
  }
  isActive: boolean
  updatedAt: Date
  auditLogs?: Array<{ createdAt: Date }>
}

const formatUserResponse = (user: UserWithAudit) => {
  const lastActivityDate = user.auditLogs?.[0]?.createdAt ?? user.updatedAt ?? null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name, // Mantener compatibilidad con frontend
    roleId: user.roleId,
    roleDisplayName: user.role.displayName,
    status: user.isActive ? 'ACTIVE' : 'INACTIVE',
    lastActivity: lastActivityDate ? lastActivityDate.toISOString() : null,
  }
}

const buildFilters = (
  roleName?: string,
  roleId?: string,
  isActive?: boolean | undefined,
  search?: string,
): Prisma.UserWhereInput => {
  const where: Prisma.UserWhereInput = {}

  if (roleId) {
    // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
    where.roleId = roleId
  } else if (roleName) {
    // Filtrar por nombre del rol usando la relación
    where.role = {
      name: roleName,
    } as any
  }

  if (typeof isActive === 'boolean') {
    where.isActive = isActive
  }

  if (search && search.trim().length > 0) {
    where.OR = [
      { name: { contains: search.trim(), mode: 'insensitive' } },
      { email: { contains: search.trim(), mode: 'insensitive' } },
    ]
  }

  return where
}

const safeUserAgent = (req: Request) => {
  const header = req.headers['user-agent']
  return Array.isArray(header) ? header.join(',') : header ?? undefined
}

const createAuditLog = async (
  actorId: string | undefined,
  action: string,
  details: Prisma.InputJsonValue | undefined,
  req: Request,
) => {
  if (!actorId) {
    return
  }

  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      module: USERS_MODULE,
      details,
      ipAddress: req.ip,
      userAgent: safeUserAgent(req),
    },
  })
}

// GET /api/users
export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = querySchema.parse(req.query)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 10
    const isActive = parsed.isActive ?? parsed.status

    const where = buildFilters(parsed.role, parsed.roleId, isActive, parsed.search)

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return res.status(200).json({
      data: users.map((u: any) => formatUserResponse(u as any)),
      pagination: {
        total,
        page,
        limit,
      },
    })
  } catch (error) {
    console.error('listUsers error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.flatten() })
    }
    next(error)
  }
}

// GET /api/users/:id
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            createdAt: true,
            action: true,
            module: true,
            details: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.status(200).json({
      ...formatUserResponse(user as any),
      // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
      auditLogs: user.auditLogs,
    })
  } catch (error) {
    console.error('getUserById error:', error)
    next(error)
  }
}

// POST /api/users
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = createUserSchema.parse(req.body)

    const existingUser = await prisma.user.findUnique({ where: { email: payload.email } })
    if (existingUser) {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado.' })
    }

    // Buscar rol por defecto (OPERATOR) si no se especifica
    let roleId = payload.roleId
    if (!roleId) {
      // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
      const defaultRole = await prisma.role.findUnique({
        where: { name: 'OPERATOR' },
      })
      if (!defaultRole) {
        return res.status(500).json({ error: 'Error de configuración del sistema' })
      }
      roleId = defaultRole.id
    }

    const firebaseUser = await admin.auth().createUser({
      email: payload.email,
      password: payload.password,
      displayName: payload.name,
      disabled: payload.status === 'INACTIVE',
    })

    const createdUser = await prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        email: payload.email,
        name: payload.name,
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        roleId,
        isActive: payload.status === 'ACTIVE',
      },
      include: {
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    })

    const actorId = (req as AuthRequest).user?.id
    await createAuditLog(actorId, 'USER_CREATED', { targetUserId: createdUser.id }, req)

    return res.status(201).json(formatUserResponse(createdUser as any))
  } catch (error) {
    console.error('createUser error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.flatten() })
    }
    if (error instanceof Error && error.message.includes('auth/email-already-exists')) {
      return res.status(409).json({ error: 'El correo electrónico ya existe en Firebase.' })
    }
    next(error)
  }
}

// PUT /api/users/:id
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const payload = updateUserSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (payload.email && payload.email !== user.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: payload.email } })
      if (emailTaken) {
        return res.status(409).json({ error: 'El correo electrónico ya está registrado.' })
      }
    }

    const prismaData: Prisma.UserUpdateInput = {}

    if (payload.name) prismaData.name = payload.name
    if (payload.email) prismaData.email = payload.email
    // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
    if (payload.roleId) prismaData.roleId = payload.roleId
    if (payload.status) prismaData.isActive = payload.status === 'ACTIVE'

    if (Object.keys(prismaData).length === 0 && !payload.password) {
      // Obtener datos del rol para la respuesta
      const userWithRole = await prisma.user.findUnique({
        where: { id },
        include: {
          // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      }) as any
      if (!userWithRole) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }
      return res.status(200).json(
        formatUserResponse({
          id: userWithRole.id,
          email: userWithRole.email,
          name: userWithRole.name,
          roleId: (userWithRole as any).roleId,
          role: (userWithRole as any).role,
          isActive: userWithRole.isActive,
          updatedAt: userWithRole.updatedAt,
          auditLogs: [],
        } as any),
      )
    }

    await admin.auth().updateUser(user.firebaseUid, {
      displayName: payload.name ?? undefined,
      email: payload.email ?? undefined,
      password: payload.password ?? undefined,
      disabled: payload.status ? payload.status === 'INACTIVE' : undefined,
    })

    const updatedUser = await prisma.user.update({
      where: { id },
      data: prismaData,
      include: {
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    })

    const actorId = (req as AuthRequest).user?.id
    await createAuditLog(actorId, 'USER_UPDATED', { targetUserId: id, changes: payload }, req)

    return res.status(200).json(formatUserResponse(updatedUser as any))
  } catch (error) {
    console.error('updateUser error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.flatten() })
    }
    next(error)
  }
}

// DELETE /api/users/:id (soft delete)
export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    await admin.auth().updateUser(user.firebaseUid, { disabled: true })

    const actorId = (req as AuthRequest).user?.id
    await createAuditLog(actorId, 'USER_DEACTIVATED', { targetUserId: id }, req)

    return res.status(200).json({ message: 'Usuario desactivado correctamente' })
  } catch (error) {
    console.error('deactivateUser error:', error)
    next(error)
  }
}

// PUT /api/users/:id/role
export const changeUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { roleId } = changeRoleSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Verificar que el rol existe
    // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { roleId } as any,
      include: {
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    }) as any

    const actorId = (req as AuthRequest).user?.id
    await createAuditLog(
      actorId,
      'USER_ROLE_CHANGED',
      { targetUserId: id, roleId, roleName: role.name },
      req,
    )

    return res.status(200).json(formatUserResponse(updatedUser as any))
  } catch (error) {
    console.error('changeUserRole error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.flatten() })
    }
    next(error)
  }
}

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  changeUserRole,
}