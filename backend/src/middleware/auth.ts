import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'

import admin from '@/config/firebase'

const prisma = new PrismaClient()

export interface AuthRequest extends Request {
  user?: {
    id: string
    firebaseUid: string
    email: string
    role: string // Nombre del rol (para compatibilidad)
    roleId: string // ID del rol
    roleData?: {
      id: string
      name: string
      displayName: string
    }
  }
}

// Middleware de autenticación basado en Firebase
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authorization = req.headers.authorization
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' })
    }

    // Verificar token con Firebase
    const decodedToken = await admin.auth().verifyIdToken(token)

    // Buscar usuario asociado en Prisma con su rol
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        isActive: true,
      },
    })

    if (!user) {
      console.warn('[auth] Usuario no encontrado', decodedToken.uid)
      return res.status(401).json({ error: 'Usuario no registrado' })
    }

    if (!user.isActive) {
      console.warn('[auth] Usuario inactivo', decodedToken.uid)
      return res.status(401).json({ error: 'Usuario inactivo' })
    }

    req.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role.name as any, // Mantener compatibilidad con código existente
      roleId: user.roleId,
      roleData: user.role, // Datos completos del rol
    }

    return next()
  } catch (error) {
    console.error('[auth] Error de autenticación:', error)
    return res.status(401).json({ error: 'Token inválido' })
  }
}

// Middleware para autorizar según roles (mantener para compatibilidad)
// NOTA: Se recomienda usar checkPermission en lugar de authorize
export const authorize = (...roleNames: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    if (roleNames.length > 0 && !roleNames.includes(req.user.role)) {
      console.warn('[auth] Acceso denegado', req.user.email, 'rol', req.user.role)
      return res.status(403).json({ error: 'Acceso no autorizado' })
    }

    return next()
  }
}