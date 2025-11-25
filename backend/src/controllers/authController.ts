import { Request, Response, NextFunction } from 'express'
import { PrismaClient, Role } from '@prisma/client'
import { z } from 'zod'

import admin from '@/config/firebase'
import { createAuditLog, AUDIT_MODULES } from '@/utils/auditLog'

const prisma = new PrismaClient()

// Schemas de validación para las peticiones
const loginSchema = z.object({
  idToken: z.string(),
})

const registerSchema = z.object({
  firebaseUid: z.string(),
  email: z.string().email(),
  name: z.string().min(2),
  role: z.nativeEnum(Role).default(Role.OPERATOR),
})

// Genera (o reusa) un JWT propio. Por ahora reutilizamos el idToken de Firebase
const issueToken = (idToken: string) => idToken

// POST /auth/login
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = loginSchema.parse(req.body)

    const decoded = await admin.auth().verifyIdToken(idToken)

    let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email ?? '',
          name: decoded.name ?? decoded.email ?? 'Usuario Collector',
          role: 'OPERATOR',
        },
      })
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Usuario inactivo' })
    }

    const token = issueToken(idToken)

    // Crear log de auditoría para login exitoso
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      module: AUDIT_MODULES.AUTH,
      details: {
        email: user.email,
        role: user.role,
      },
      req,
    })

    return res.status(200).json({
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error('loginUser error:', error)
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

    const user = await prisma.user.create({
      data: {
        firebaseUid: payload.firebaseUid,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    })

    // Crear log de auditoría para registro exitoso
    // Nota: En este caso, el usuario que se registra es el mismo que realiza la acción
    await createAuditLog({
      userId: user.id,
      action: 'REGISTER',
      module: AUDIT_MODULES.AUTH,
      details: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      req,
    })

    return res.status(201).json({
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      role: user.role,
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
  const user = (req as any).user
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' })
  }
  return res.status(200).json(user)
}

// POST /auth/logout
export const logoutUser = async (req: Request, res: Response) => {
  // Obtener el usuario del request (debe estar autenticado para hacer logout)
  const user = (req as any).user

  // Crear log de auditoría para logout
  if (user?.id) {
    await createAuditLog({
      userId: user.id,
      action: 'LOGOUT',
      module: AUDIT_MODULES.AUTH,
      details: {
        email: user.email,
      },
      req,
    })
  }

  return res.status(200).json({ message: 'Logout exitoso' })
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
}

