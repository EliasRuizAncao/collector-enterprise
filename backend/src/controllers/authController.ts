import { Request, Response, NextFunction } from 'express'

// TODO: Implementar registro de usuarios
export const registerUser = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Registro no implementado aún' })
}

// TODO: Implementar login usando Firebase Auth
export const loginUser = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Login no implementado aún' })
}

// TODO: Implementar logout (invalidar token, limpiar sesión, etc.)
export const logoutUser = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Logout no implementado aún' })
}

// TODO: Implementar obtención de datos del usuario actual
export const getCurrentUser = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Usuario actual no implementado aún' })
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
}

