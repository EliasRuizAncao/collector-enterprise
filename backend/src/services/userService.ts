import { PrismaClient, Prisma, Role } from '@prisma/client'
import { z } from 'zod'

import {
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
  type CreateUserInput,
  type ChangeRoleInput,
  type UpdateUserInput,
} from '@/validators/userValidator'
import admin from '@/config/firebase'

const prisma = new PrismaClient()

export interface UserFilters {
  page?: number
  limit?: number
  role?: Role
  status?: 'ACTIVE' | 'INACTIVE'
  search?: string
}

export const findUsers = async (filters: UserFilters) => {
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const limit = filters.limit && filters.limit > 0 && filters.limit <= 100 ? filters.limit : 10

  const where: Prisma.UserWhereInput = {}

  if (filters.role) {
    where.role = filters.role
  }

  if (filters.status) {
    where.isActive = filters.status === 'ACTIVE'
  }

  if (filters.search && filters.search.trim().length > 0) {
    where.OR = [
      { name: { contains: filters.search.trim(), mode: 'insensitive' } },
      { email: { contains: filters.search.trim(), mode: 'insensitive' } },
    ]
  }

  console.info('[userService] list filters', { page, limit, where })

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  return {
    data: users,
    pagination: {
      total,
      page,
      limit,
    },
  }
}

export const findUserById = async (id: string) => {
  console.info('[userService] find user by id', id)
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }
  return user
}

export const findUserByEmail = async (email: string) => {
  console.info('[userService] find user by email', email)
  return prisma.user.findUnique({ where: { email } })
}

export const createUser = async (payload: CreateUserInput) => {
  const data = createUserSchema.parse(payload)

  console.info('[userService] create user', data.email)

  const exists = await prisma.user.findUnique({ where: { email: data.email } })
  if (exists) {
    const error = new Error('EMAIL_ALREADY_EXISTS')
    console.warn('[userService] email already exists', data.email)
    throw error
  }

  try {
    // Crear usuario en Firebase primero
    const firebaseUser = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      disabled: data.status === 'INACTIVE',
    })

    // Crear usuario en Prisma con el UID de Firebase
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        firebaseUid: firebaseUser.uid,
        isActive: data.status === 'ACTIVE',
      },
    })
    return user
  } catch (error) {
    console.error('[userService] error creating user', error)
    // Si falla la creación en Prisma, intentar eliminar el usuario de Firebase
    if (error instanceof Error && error.message.includes('EMAIL_ALREADY_EXISTS')) {
      throw error
    }
    throw error
  }
}

export const updateUser = async (id: string, payload: UpdateUserInput) => {
  const data = updateUserSchema.parse({ ...payload, id })

  console.info('[userService] update user', id)

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  if (data.email && data.email !== user.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: data.email } })
    if (emailExists) {
      console.warn('[userService] email already exists', data.email)
      throw new Error('EMAIL_ALREADY_EXISTS')
    }
  }

  const updateData: Prisma.UserUpdateInput = {}
  if (data.email) updateData.email = data.email
  if (data.name) updateData.name = data.name
  if (data.role) updateData.role = data.role
  if (data.status) updateData.isActive = data.status === 'ACTIVE'

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    })
    return updated
  } catch (error) {
    console.error('[userService] error updating user', error)
    throw error
  }
}

export const deleteUser = async (id: string) => {
  console.info('[userService] soft delete user', id)
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  return prisma.user.update({
    where: { id },
    data: { isActive: false },
  })
}

export const changeUserRole = async (id: string, payload: ChangeRoleInput) => {
  const data = changeRoleSchema.parse(payload)

  console.info('[userService] change role', id, data.role)

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  return prisma.user.update({
    where: { id },
    data: { role: data.role },
  })
}

export const getUserStats = async () => {
  console.info('[userService] get user stats')

  const [total, activos, inactivos] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
  ])

  return {
    total,
    activos,
    inactivos,
  }
}


