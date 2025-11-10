import { Request, Response, NextFunction } from 'express'

// TODO: Implementar obtención de estadísticas generales
export const getDashboardStats = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Estadísticas no implementadas aún' })
}

// TODO: Implementar listado de formularios completados (con filtros)
export const getCompletedForms = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Formularios completados no implementados aún' })
}

// TODO: Implementar listado de formularios pendientes
export const getPendingForms = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Formularios pendientes no implementados aún' })
}

// TODO: Implementar actividad reciente del sistema
export const getRecentActivity = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Actividad reciente no implementada aún' })
}

export default {
  getDashboardStats,
  getCompletedForms,
  getPendingForms,
  getRecentActivity,
}

