import { z } from 'zod'

/**
 * Schema de validación para crear una respuesta de formulario
 */
export const submitResponseSchema = z.object({
  formId: z.string().uuid('ID de formulario inválido'),
  data: z.record(z.string(), z.unknown()),
  latitude: z
    .union([z.number().min(-90).max(90), z.null()])
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  longitude: z
    .union([z.number().min(-180).max(180), z.null()])
    .optional()
    .transform((val) => (val === undefined ? null : val)),
})

/**
 * Schema de validación para query params de listado de respuestas
 */
export const listResponsesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  formId: z.string().uuid('ID de formulario inválido').optional(),
  userId: z.string().uuid('ID de usuario inválido').optional(),
  startDate: z.string().datetime('Fecha de inicio inválida').optional(),
  endDate: z.string().datetime('Fecha de fin inválida').optional(),
})

/**
 * Tipos inferidos de los schemas
 */
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>
export type ListResponsesQuery = z.infer<typeof listResponsesQuerySchema>

