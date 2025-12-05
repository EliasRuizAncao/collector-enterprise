import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateProductInput {
  name: string
  description?: string
  unit: string
  stock: number
  minStock: number
}

export interface UpdateProductInput {
  name?: string
  description?: string
  unit?: string
  stock?: number
  minStock?: number
  isActive?: boolean
}

export interface StockFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  lowStock?: boolean // Solo productos con stock bajo
}

/**
 * Obtiene todos los productos de bodega con paginación y filtros
 */
export const getProducts = async (filters: StockFilters = {}) => {
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const limit = filters.limit && filters.limit > 0 && filters.limit <= 100 ? filters.limit : 20

  const where: Prisma.WarehouseProductWhereInput = {}

  if (filters.search && filters.search.trim().length > 0) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (typeof filters.isActive === 'boolean') {
    where.isActive = filters.isActive
  }

  if (filters.lowStock) {
    // Filtrar productos donde stock <= minStock
    // Esto se hace con una consulta raw o filtrando después
    // Por ahora, obtenemos todos y filtramos en memoria
  }

  const [products, total] = await prisma.$transaction([
    prisma.warehouseProduct.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.warehouseProduct.count({ where }),
  ])

  return {
    data: products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Obtiene un producto por ID
 */
export const getProductById = async (productId: string) => {
  const product = await prisma.warehouseProduct.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND')
  }

  return product
}

/**
 * Crea un nuevo producto de bodega
 */
export const createProduct = async (data: CreateProductInput) => {
  if (data.stock < 0) {
    throw new Error('STOCK_CANNOT_BE_NEGATIVE')
  }

  if (data.minStock < 0) {
    throw new Error('MIN_STOCK_CANNOT_BE_NEGATIVE')
  }

  const product = await prisma.warehouseProduct.create({
    data: {
      name: data.name,
      description: data.description,
      unit: data.unit,
      stock: data.stock,
      minStock: data.minStock,
      isActive: true,
    },
  })

  return product
}

/**
 * Actualiza un producto de bodega
 */
export const updateProduct = async (productId: string, data: UpdateProductInput) => {
  const existingProduct = await prisma.warehouseProduct.findUnique({
    where: { id: productId },
  })

  if (!existingProduct) {
    throw new Error('PRODUCT_NOT_FOUND')
  }

  if (data.stock !== undefined && data.stock < 0) {
    throw new Error('STOCK_CANNOT_BE_NEGATIVE')
  }

  if (data.minStock !== undefined && data.minStock < 0) {
    throw new Error('MIN_STOCK_CANNOT_BE_NEGATIVE')
  }

  const product = await prisma.warehouseProduct.update({
    where: { id: productId },
    data,
  })

  return product
}

/**
 * Elimina un producto de bodega (soft delete - desactiva)
 */
export const deleteProduct = async (productId: string) => {
  const product = await prisma.warehouseProduct.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND')
  }

  // Soft delete - desactivar en lugar de eliminar
  const updated = await prisma.warehouseProduct.update({
    where: { id: productId },
    data: { isActive: false },
  })

  return updated
}

/**
 * Ajusta el stock de un producto (incrementa o decrementa)
 */
export const adjustStock = async (productId: string, quantity: number, operation: 'add' | 'subtract') => {
  const product = await prisma.warehouseProduct.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND')
  }

  if (!product.isActive) {
    throw new Error('PRODUCT_IS_INACTIVE')
  }

  const newStock = operation === 'add' ? product.stock + quantity : product.stock - quantity

  if (newStock < 0) {
    throw new Error('INSUFFICIENT_STOCK')
  }

  const updated = await prisma.warehouseProduct.update({
    where: { id: productId },
    data: { stock: newStock },
  })

  return updated
}

/**
 * Obtiene productos con stock bajo (stock <= minStock)
 */
export const getLowStockProducts = async () => {
  const products = await prisma.warehouseProduct.findMany({
    where: {
      isActive: true,
    },
    orderBy: { stock: 'asc' },
  })

  // Filtrar productos donde stock <= minStock
  return products.filter((p) => p.stock <= p.minStock)
}

