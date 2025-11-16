import { Request, Response, NextFunction } from 'express'
import { PrismaClient, Prisma, Role } from '@prisma/client'
import { z } from 'zod'

import admin from '@/config/firebase'
import { AuthRequest } from '@/middleware/auth'

const prisma = new PrismaClient()
const USERS_MODULE = 'USERS'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
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
  role: z.nativeEnum(Role).default(Role.OPERATOR),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: z.string().min(6).optional(),
})

const changeRoleSchema = z.object({
  role: z.nativeEnum(Role),
})

type UserWithAudit = {
  id: string
  email: string
  name: string
  role: Role
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
    role: user.role,
    status: user.isActive ? 'ACTIVE' : 'INACTIVE',
    lastActivity: lastActivityDate ? lastActivityDate.toISOString() : null,
  }
}

const buildFilters = (
  role?: Role,
  isActive?: boolean | undefined,
  search?: string,
): Prisma.UserWhereInput => {
  const where: Prisma.UserWhereInput = {}

  if (role) {
    where.role = role
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

    const where = buildFilters(parsed.role, isActive, parsed.search)

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
      data: users.map(formatUserResponse),
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
      ...formatUserResponse(user),
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
        role: payload.role,
        isActive: payload.status === 'ACTIVE',
      },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    })

    const actorId = (req as AuthRequest).user?.id
    await createAuditLog(actorId, 'USER_CREATED', { targetUserId: createdUser.id }, req)

    return res.status(201).json(formatUserResponse(createdUser))
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
    if (payload.role) prismaData.role = payload.role
    if (payload.status) prismaData.isActive = payload.status === 'ACTIVE'

    if (Object.keys(prismaData).length === 0 && !payload.password) {
      return res
        .status(200)
        .json(
          formatUserResponse({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            updatedAt: user.updatedAt,
            auditLogs: [],
          }),
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
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    })

    const actorId = (req as AuthRequest).user?.id
    await createAuditLog(actorId, 'USER_UPDATED', { targetUserId: id, changes: payload }, req)

    return res.status(200).json(formatUserResponse(updatedUser))
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
    const { role } = changeRoleSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    })

    const actorId = (req as AuthRequest).user?.id
    await createAuditLog(actorId, 'USER_ROLE_CHANGED', { targetUserId: id, role }, req)

    return res.status(200).json(formatUserResponse(updatedUser))
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