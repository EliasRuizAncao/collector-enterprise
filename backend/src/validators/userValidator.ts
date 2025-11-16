import { Role } from '@prisma/client'
import { z } from 'zod'

// Schema para creación de usuarios administrados
// NOTA: firebaseUid NO se incluye aquí porque se crea en Firebase primero
// y luego se usa el UID generado para crear el usuario en Prisma
export const createUserSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  role: z.nativeEnum(Role).default(Role.OPERATOR),
  password: z.string().min(6, 'La contraseña debe tener mínimo 6 caracteres'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

// Schema para actualización de usuarios (campos opcionales)
export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().uuid('ID inválido'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

// Schema para cambio de rol
export const changeRoleSchema = z.object({
  role: z.nativeEnum(Role),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>


