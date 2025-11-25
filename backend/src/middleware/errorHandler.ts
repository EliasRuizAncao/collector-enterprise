import type { ErrorRequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import * as Sentry from '@sentry/node'
import {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
} from 'jsonwebtoken'

// Middleware global para manejo de errores en Express
// Debe registrarse al final de toda la cadena de middlewares y rutas
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const env = process.env.NODE_ENV || 'development'
  const isDev = env === 'development'

  let status = 500
  let message = 'Error interno del servidor'
  let details: unknown

  // Errores de validación con Zod
  if (err instanceof ZodError) {
    status = 400
    message = 'Error de validación'
    details = err.issues
  }

  // Errores conocidos de Prisma (por ejemplo, violaciones de constraints)
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    status = 400
    message = 'Error en la base de datos'
    details = {
      code: err.code,
      meta: err.meta,
    }
  }

  // Errores de validación de Prisma (datos con formato inválido)
  else if (err instanceof Prisma.PrismaClientValidationError) {
    status = 400
    message = 'Datos no válidos para la base de datos'
    details = err.message
  }

  // Errores genéricos del cliente Prisma
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    status = 500
    message = 'Error desconocido en la base de datos'
    details = err.message
  }

  // Errores de autenticación con JWT
  else if (
    err instanceof JsonWebTokenError ||
    err instanceof TokenExpiredError ||
    err instanceof NotBeforeError
  ) {
    status = 401
    message = 'Token inválido o expirado'
    details = err.message
  }

  // Capturamos el error en Sentry para monitoreo
  Sentry.captureException(err)

  const response: {
    error: string
    details?: unknown
  } = {
    error: message,
  }

  if (details) {
    response.details = details
  }

  if (isDev) {
    const existingDetails =
      response.details && typeof response.details === 'object'
        ? (response.details as Record<string, unknown>)
        : response.details !== undefined
          ? { data: response.details }
          : {}

    response.details = {
      ...existingDetails,
      stack: err.stack,
    }
  }

  res.status(status).json(response)
}

export default errorHandler

