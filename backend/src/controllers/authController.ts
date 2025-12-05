import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

import admin from '@/config/firebase'
import { PermissionService } from '@/services/permissionService'

const prisma = new PrismaClient()

// Schemas de validación para las peticiones
const loginSchema = z.object({
  idToken: z.string(),
})

const registerSchema = z.object({
  firebaseUid: z.string(),
  email: z.string().email(),
  name: z.string().min(2),
  roleId: z.string().uuid().optional(), // Opcional, se asignará OPERATOR por defecto
})

// Genera (o reusa) un JWT propio. Por ahora reutilizamos el idToken de Firebase
const issueToken = (idToken: string) => idToken

// POST /auth/login
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  console.log('[Auth] Login request received')
  try {
    const { idToken } = loginSchema.parse(req.body)
    console.log('[Auth] Token received, verifying...')

    const decoded = await admin.auth().verifyIdToken(idToken)
    console.log('[Auth] Token verified for UID:', decoded.uid)

    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
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
    })
    console.log('[Auth] User found in DB:', user ? 'Yes' : 'No')

    if (!user) {
      console.log('[Auth] Creating new user...')
      // Buscar rol OPERATOR por defecto
      // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
      const defaultRole = await prisma.role.findUnique({
        where: { name: 'OPERATOR' },
      })

      if (!defaultRole) {
        console.error('[Auth] Rol OPERATOR no encontrado. Ejecuta el script de seeding primero.')
        return res.status(500).json({ error: 'Error de configuración del sistema' })
      }

      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email ?? '',
          name: decoded.name ?? decoded.email ?? 'Usuario Collector',
          // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
          roleId: defaultRole.id,
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
        },
      })
      console.log('[Auth] New user created:', user.id)
    }

    if (!user.isActive) {
      console.warn('[Auth] User is inactive:', user.id)
      return res.status(401).json({ error: 'Usuario inactivo' })
    }

    if (!user.role) {
      console.error('[Auth] User has no role assigned:', user.id)
      return res.status(500).json({ error: 'Error de configuración del usuario' })
    }

    const token = issueToken(idToken)
    console.log('[Auth] Login successful, returning token')

    // Obtener permisos del usuario
    const permissions = await PermissionService.getUserPermissions(user.id)

    return res.status(200).json({
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        role: user.role.name,
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        roleId: user.roleId,
      },
      permissions,
      token,
    })
  } catch (error) {
    console.error('[Auth] loginUser error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.flatten() })
    }
    if (error instanceof Error && error.message.includes('Firebase ID token has expired')) {
      return res.status(401).json({ error: 'Token de Firebase expirado' })
    }
    next(error)
  }
}

// POST /auth/register
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = registerSchema.parse(req.body)

    const existingUser = await prisma.user.findUnique({ where: { firebaseUid: payload.firebaseUid } })
    if (existingUser) {
      return res.status(409).json({ error: 'El usuario ya existe' })
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

    const user = await prisma.user.create({
      data: {
        firebaseUid: payload.firebaseUid,
        email: payload.email,
        name: payload.name,
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        roleId,
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
      },
    })

    if (!user.role) {
      return res.status(500).json({ error: 'Error de configuración del usuario' })
    }

    // Obtener permisos del usuario
    const permissions = await PermissionService.getUserPermissions(user.id)

    return res.status(201).json({
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        role: user.role.name,
        // @ts-expect-error - Prisma Client types may not be updated yet, but this works at runtime
        roleId: user.roleId,
      },
      permissions,
    })
  } catch (error) {
    console.error('registerUser error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.flatten() })
    }
    next(error)
  }
}

// GET /auth/me
export const getCurrentUser = async (req: Request, res: Response) => {
  const authReq = req as any
  const user = authReq.user
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  // Obtener permisos del usuario
  const permissions = await PermissionService.getUserPermissions(user.id)

  return res.status(200).json({
    ...user,
    permissions,
  })
}

// POST /auth/logout
export const logoutUser = async (_req: Request, res: Response) => {
  return res.status(200).json({ message: 'Logout exitoso' })
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
}

