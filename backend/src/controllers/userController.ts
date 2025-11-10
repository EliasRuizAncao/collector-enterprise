import { Request, Response, NextFunction } from 'express'

// TODO: Implementar listado de usuarios con paginación
export const listUsers = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Listado de usuarios no implementado aún' })
}

// TODO: Implementar obtención de usuario por ID
export const getUserById = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Detalle de usuario no implementado aún' })
}

// TODO: Implementar creación de usuarios
export const createUser = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Creación de usuario no implementada aún' })
}

// TODO: Implementar actualización de usuarios
export const updateUser = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Actualización de usuario no implementada aún' })
}

// TODO: Implementar desactivación (soft delete) de usuarios
export const deactivateUser = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Desactivación de usuario no implementada aún' })
}

// TODO: Implementar cambio de rol de usuarios
export const changeUserRole = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Cambio de rol no implementado aún' })
}

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  changeUserRole,
}

