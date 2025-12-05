import { useState, useCallback } from 'react'
import api from '@/shared/lib/api'

export interface WarehouseProduct {
  id: string
  name: string
  description?: string
  unit: string
  stock: number
  minStock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MaterialRequest {
  id: string
  requestNumber: string
  requesterId: string
  authorizerId?: string
  delivererId?: string
  receiverId?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'READY_FOR_PICKUP' | 'DELIVERED' | 'CANCELLED'
  notes?: string
  rejectionReason?: string
  qrCode?: string
  signature?: string
  requestedAt: string
  authorizedAt?: string
  rejectedAt?: string
  readyAt?: string
  deliveredAt?: string
  requester: {
    id: string
    name: string
    email: string
  }
  authorizer?: {
    id: string
    name: string
    email: string
  }
  items: Array<{
    id: string
    productId: string
    quantity: number
    quantityDelivered: number
    product: WarehouseProduct
  }>
}

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

export interface CreateMaterialRequestInput {
  items: Array<{
    productId: string
    quantity: number
  }>
  notes?: string
}

const useWarehouse = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Productos
  const getProducts = useCallback(async (filters?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
    lowStock?: boolean
  }) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/warehouse/products', { params: filters })
      return data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al obtener productos'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const getProduct = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/warehouse/products/${id}`)
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al obtener producto'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createProduct = useCallback(async (input: CreateProductInput) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/warehouse/products', input)
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al crear producto'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProduct = useCallback(async (id: string, input: UpdateProductInput) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.put(`/warehouse/products/${id}`, input)
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al actualizar producto'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await api.delete(`/warehouse/products/${id}`)
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al eliminar producto'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const adjustStock = useCallback(async (id: string, quantity: number, operation: 'add' | 'subtract') => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post(`/warehouse/products/${id}/adjust-stock`, {
        quantity,
        operation,
      })
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al ajustar stock'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const getLowStockProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/warehouse/products/low-stock')
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al obtener productos con stock bajo'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Solicitudes
  const getRequests = useCallback(async (filters?: {
    page?: number
    limit?: number
    status?: string
    requesterId?: string
    authorizerId?: string
    search?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/warehouse/requests', { params: filters })
      return data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al obtener solicitudes'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPendingRequests = useCallback(async (filters?: {
    page?: number
    limit?: number
    search?: string
  }) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/warehouse/requests/pending', { params: filters })
      return data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al obtener solicitudes pendientes'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const getRequest = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/warehouse/requests/${id}`)
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al obtener solicitud'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createRequest = useCallback(async (input: CreateMaterialRequestInput) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/warehouse/requests', input)
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al crear solicitud'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const approveRequest = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post(`/warehouse/requests/${id}/approve`)
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al aprobar solicitud'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const rejectRequest = useCallback(async (id: string, reason: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post(`/warehouse/requests/${id}/reject`, { reason })
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al rechazar solicitud'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const scanQR = useCallback(async (qrCode: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/warehouse/requests/scan-qr', { qrCode })
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al escanear código QR'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const confirmDelivery = useCallback(async (
    requestId: string,
    receiverId: string,
    signature: string,
    itemsDelivered: Array<{ itemId: string; quantityDelivered: number }>,
  ) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post(`/warehouse/requests/${requestId}/confirm-delivery`, {
        receiverId,
        signature,
        itemsDelivered,
      })
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al confirmar entrega'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const getSupervisors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/warehouse/supervisors')
      return data.data
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al obtener superiores'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    // Productos
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getLowStockProducts,
    // Solicitudes
    getRequests,
    getPendingRequests,
    getRequest,
    createRequest,
    approveRequest,
    rejectRequest,
    scanQR,
    confirmDelivery,
    getSupervisors,
  }
}

export default useWarehouse

