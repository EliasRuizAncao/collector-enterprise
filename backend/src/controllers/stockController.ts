import { Response, NextFunction } from 'express'
import { z } from 'zod'

import { AuthRequest } from '@/middleware/auth'
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getLowStockProducts,
} from '@/services/stockService'
import { createAuditLog } from '@/utils/auditLog'
import { AUDIT_MODULES } from '@/utils/auditLog'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
})

const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  unit: z.string().min(1, 'La unidad es requerida'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  minStock: z.number().int().min(0, 'El stock mínimo no puede ser negativo'),
})

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unit: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  isActive: z.coerce.boolean().optional(),
})

const adjustStockSchema = z.object({
  quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  operation: z.enum(['add', 'subtract']),
})

const productIdSchema = z.object({
  id: z.string().uuid('ID de producto inválido'),
})

/**
 * Obtiene todos los productos de bodega
 * GET /api/warehouse/products
 */
export const getProductsList = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const query = querySchema.parse(req.query)
    const result = await getProducts(query)

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('[stockController] error in getProductsList', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: error.issues,
      })
    }

    return res.status(500).json({
      error: 'Error al obtener productos',
    })
  }
}

/**
 * Obtiene un producto por ID
 * GET /api/warehouse/products/:id
 */
export const getProduct = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = productIdSchema.parse(req.params)
    const product = await getProductById(params.id)

    return res.status(200).json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('[stockController] error in getProduct', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'ID de producto inválido',
        details: error.issues,
      })
    }

    if (error instanceof Error && error.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({
        error: 'Producto no encontrado',
      })
    }

    return res.status(500).json({
      error: 'Error al obtener producto',
    })
  }
}

/**
 * Crea un nuevo producto
 * POST /api/warehouse/products
 */
export const createProductHandler = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const data = createProductSchema.parse(req.body)
    const product = await createProduct(data)

    await createAuditLog({
      userId: req.user.id,
      action: 'PRODUCT_CREATED',
      module: AUDIT_MODULES.WAREHOUSE,
      details: { productId: product.id, productName: product.name },
      req,
    })

    return res.status(201).json({
      success: true,
      data: product,
      message: 'Producto creado correctamente',
    })
  } catch (error) {
    console.error('[stockController] error in createProductHandler', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      })
    }

    if (error instanceof Error) {
      if (error.message === 'STOCK_CANNOT_BE_NEGATIVE') {
        return res.status(400).json({
          error: 'El stock no puede ser negativo',
        })
      }

      if (error.message === 'MIN_STOCK_CANNOT_BE_NEGATIVE') {
        return res.status(400).json({
          error: 'El stock mínimo no puede ser negativo',
        })
      }
    }

    return res.status(500).json({
      error: 'Error al crear producto',
    })
  }
}

/**
 * Actualiza un producto
 * PUT /api/warehouse/products/:id
 */
export const updateProductHandler = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = productIdSchema.parse(req.params)
    const data = updateProductSchema.parse(req.body)

    const product = await updateProduct(params.id, data)

    await createAuditLog({
      userId: req.user.id,
      action: 'PRODUCT_UPDATED',
      module: AUDIT_MODULES.WAREHOUSE,
      details: { productId: product.id, changes: data },
      req,
    })

    return res.status(200).json({
      success: true,
      data: product,
      message: 'Producto actualizado correctamente',
    })
  } catch (error) {
    console.error('[stockController] error in updateProductHandler', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      })
    }

    if (error instanceof Error) {
      if (error.message === 'PRODUCT_NOT_FOUND') {
        return res.status(404).json({
          error: 'Producto no encontrado',
        })
      }

      if (error.message === 'STOCK_CANNOT_BE_NEGATIVE') {
        return res.status(400).json({
          error: 'El stock no puede ser negativo',
        })
      }

      if (error.message === 'MIN_STOCK_CANNOT_BE_NEGATIVE') {
        return res.status(400).json({
          error: 'El stock mínimo no puede ser negativo',
        })
      }
    }

    return res.status(500).json({
      error: 'Error al actualizar producto',
    })
  }
}

/**
 * Elimina un producto (soft delete)
 * DELETE /api/warehouse/products/:id
 */
export const deleteProductHandler = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = productIdSchema.parse(req.params)
    const product = await deleteProduct(params.id)

    await createAuditLog({
      userId: req.user.id,
      action: 'PRODUCT_DELETED',
      module: AUDIT_MODULES.WAREHOUSE,
      details: { productId: product.id },
      req,
    })

    return res.status(200).json({
      success: true,
      message: 'Producto eliminado correctamente',
    })
  } catch (error) {
    console.error('[stockController] error in deleteProductHandler', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'ID de producto inválido',
        details: error.issues,
      })
    }

    if (error instanceof Error && error.message === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({
        error: 'Producto no encontrado',
      })
    }

    return res.status(500).json({
      error: 'Error al eliminar producto',
    })
  }
}

/**
 * Ajusta el stock de un producto
 * POST /api/warehouse/products/:id/adjust-stock
 */
export const adjustStockHandler = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = productIdSchema.parse(req.params)
    const data = adjustStockSchema.parse(req.body)

    const product = await adjustStock(params.id, data.quantity, data.operation)

    await createAuditLog({
      userId: req.user.id,
      action: 'STOCK_ADJUSTED',
      module: AUDIT_MODULES.WAREHOUSE,
      details: {
        productId: product.id,
        operation: data.operation,
        quantity: data.quantity,
        newStock: product.stock,
      },
      req,
    })

    return res.status(200).json({
      success: true,
      data: product,
      message: 'Stock ajustado correctamente',
    })
  } catch (error) {
    console.error('[stockController] error in adjustStockHandler', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      })
    }

    if (error instanceof Error) {
      if (error.message === 'PRODUCT_NOT_FOUND') {
        return res.status(404).json({
          error: 'Producto no encontrado',
        })
      }

      if (error.message === 'PRODUCT_IS_INACTIVE') {
        return res.status(400).json({
          error: 'El producto está inactivo',
        })
      }

      if (error.message === 'INSUFFICIENT_STOCK') {
        return res.status(400).json({
          error: 'Stock insuficiente',
        })
      }
    }

    return res.status(500).json({
      error: 'Error al ajustar stock',
    })
  }
}

/**
 * Obtiene productos con stock bajo
 * GET /api/warehouse/products/low-stock
 */
export const getLowStockProductsList = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const products = await getLowStockProducts()

    return res.status(200).json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error('[stockController] error in getLowStockProductsList', error)

    return res.status(500).json({
      error: 'Error al obtener productos con stock bajo',
    })
  }
}

