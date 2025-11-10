import { Request, Response, NextFunction } from 'express'
import admin from '../config/firebase'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthRequest extends Request {
  user?: {
    id: string
    firebaseUid: string
    email: string
    role: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Verificar token con Firebase
    const decodedToken = await admin.auth().verifyIdToken(token)

    // Buscar usuario en DB
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: { id: true, firebaseUid: true, email: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Middleware para verificar roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    next()
  }
}