import { Request, Response, NextFunction } from 'express'

// TODO: Implementar listado de formularios con paginación
export const listForms = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Listado de formularios no implementado aún' })
}

// TODO: Implementar obtención de formulario por ID
export const getFormById = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Detalle de formulario no implementado aún' })
}

// TODO: Implementar creación de formularios
export const createForm = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Creación de formulario no implementada aún' })
}

// TODO: Implementar actualización de formularios
export const updateForm = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Actualización de formulario no implementada aún' })
}

// TODO: Implementar eliminación de formularios
export const deleteForm = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Eliminación de formulario no implementada aún' })
}

// TODO: Implementar publicación de formularios
export const publishForm = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Publicación de formulario no implementada aún' })
}

// TODO: Implementar archivado de formularios
export const archiveForm = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(501).json({ error: 'Archivado de formulario no implementado aún' })
}

export default {
  listForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  publishForm,
  archiveForm,
}

