import { z } from 'zod'
import { AssignmentFrequency } from '@prisma/client'

/**
 * Schema de validación para crear una asignación
 */
export const createAssignmentSchema = z.object({
  formId: z.string().uuid('ID de formulario inválido'),
  userIds: z.array(z.string().uuid('ID de usuario inválido')).min(1, 'Debe seleccionar al menos un usuario'),
  frequency: z.nativeEnum(AssignmentFrequency),
  startDate: z.string().datetime('Fecha de inicio inválida'),
  endDate: z.string().datetime('Fecha de fin inválida').optional(),
})

/**
 * Schema de validación para crear múltiples asignaciones
 * Permite crear una asignación por cada usuario en userIds
 */
export const createAssignmentsSchema = createAssignmentSchema

/**
 * Schema de validación para actualizar una asignación
 */
export const updateAssignmentSchema = z.object({
  frequency: z.nativeEnum(AssignmentFrequency).optional(),
  startDate: z.string().datetime('Fecha de inicio inválida').optional(),
  endDate: z.string().datetime('Fecha de fin inválida').optional().nullable(),
  isCompleted: z.boolean().optional(),
})

/**
 * Schema de validación para query params de listado
 */
export const listAssignmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  userId: z.string().uuid('ID de usuario inválido').optional(),
  formId: z.string().uuid('ID de formulario inválido').optional(),
  isCompleted: z.coerce.boolean().optional(),
})

/**
 * Tipos inferidos de los schemas
 */
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
export type CreateAssignmentsInput = z.infer<typeof createAssignmentsSchema>
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>
export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>

