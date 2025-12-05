import { useState, useEffect } from 'react'
import { Plus, Search, AlertTriangle, Edit, Trash2, TrendingUp, Package } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import useWarehouse, { type WarehouseProduct } from '@/shared/hooks/useWarehouse'
import PageLoader from '@/shared/components/common/PageLoader'
import ProductDialog from '@/admin/components/warehouse/ProductDialog'
import AdjustStockDialog from '@/admin/components/warehouse/AdjustStockDialog'
import ConfirmDialog from '@/shared/components/common/ConfirmDialog'
import { useToast } from '@/shared/components/ui/use-toast'

const PRODUCTS_PER_PAGE = 20

const WarehouseStock = () => {
  const { toast } = useToast()
  const {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getLowStockProducts,
    loading,
    error,
  } = useWarehouse()

  const [products, setProducts] = useState<WarehouseProduct[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<WarehouseProduct[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingProduct, setEditingProduct] = useState<WarehouseProduct | null>(null)
  const [confirmProduct, setConfirmProduct] = useState<WarehouseProduct | null>(null)
  const [adjustStockDialogOpen, setAdjustStockDialogOpen] = useState(false)
  const [productToAdjust, setProductToAdjust] = useState<WarehouseProduct | null>(null)

  const fetchProducts = async () => {
    try {
      const result = await getProducts({
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
        search: searchTerm || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        lowStock: lowStockFilter || undefined,
      })
      setProducts(result.data || [])
      setTotalPages(result.pagination?.totalPages || 1)
      setTotal(result.pagination?.total || 0)
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const fetchLowStock = async () => {
    try {
      const lowStock = await getLowStockProducts()
      setLowStockProducts(lowStock || [])
    } catch (err) {
      console.error('Error fetching low stock:', err)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [currentPage, searchTerm, statusFilter, lowStockFilter])

  useEffect(() => {
    fetchLowStock()
  }, [])

  // Mostrar loader inicial si está cargando y no hay productos
  if (loading && products.length === 0 && !error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stock de Bodega</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los productos y el stock de la bodega.
            </p>
          </div>
        </div>
        <PageLoader
          message="Cargando productos..."
          icon={<Package className="h-12 w-12 text-primary" />}
        />
      </div>
    )
  }

  const handleCreate = () => {
    setDialogMode('create')
    setEditingProduct(null)
    setDialogOpen(true)
  }

  const handleEdit = (product: WarehouseProduct) => {
    setDialogMode('edit')
    setEditingProduct(product)
    setDialogOpen(true)
  }

  const handleDelete = (product: WarehouseProduct) => {
    setConfirmProduct(product)
  }

  const confirmDelete = async () => {
    if (!confirmProduct) return
    try {
      await deleteProduct(confirmProduct.id)
      toast({
        title: 'Producto eliminado',
        description: 'El producto ha sido eliminado correctamente.',
      })
      fetchProducts()
      setConfirmProduct(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al eliminar producto',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (dialogMode === 'create') {
        await createProduct(data)
        toast({
          title: 'Producto creado',
          description: 'El producto ha sido creado correctamente.',
        })
      } else if (editingProduct) {
        await updateProduct(editingProduct.id, data)
        toast({
          title: 'Producto actualizado',
          description: 'El producto ha sido actualizado correctamente.',
        })
      }
      setDialogOpen(false)
      fetchProducts()
      fetchLowStock()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al guardar producto',
        variant: 'destructive',
      })
    }
  }

  const handleOpenAdjustStock = (product: WarehouseProduct) => {
    setProductToAdjust(product)
    setAdjustStockDialogOpen(true)
  }

  const handleAdjustStock = async (quantity: number, operation: 'add' | 'subtract') => {
    if (!productToAdjust) return
    try {
      await adjustStock(productToAdjust.id, quantity, operation)
      toast({
        title: 'Stock ajustado',
        description: `Stock ${operation === 'add' ? 'aumentado' : 'disminuido'} correctamente.`,
      })
      fetchProducts()
      fetchLowStock()
      setAdjustStockDialogOpen(false)
      setProductToAdjust(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al ajustar stock',
        variant: 'destructive',
      })
    }
  }

  const isLowStock = (product: WarehouseProduct) => product.stock <= product.minStock

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stock de Bodega</h1>
          <p className="text-sm text-muted-foreground">Gestiona los productos y el stock de la bodega.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {lowStockProducts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{lowStockProducts.length}</strong> producto(s) con stock bajo. Revisa el inventario.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: 'all' | 'active' | 'inactive') => {
            setStatusFilter(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={lowStockFilter ? 'default' : 'outline'}
          onClick={() => {
            setLowStockFilter(!lowStockFilter)
            setCurrentPage(1)
          }}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Stock Bajo
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Stock Mínimo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell colSpan={6}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-muted/40 animate-pulse" />
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="h-4 w-1/3 rounded bg-muted/40 animate-pulse" />
                        <div className="h-3 w-1/4 rounded bg-muted/30 animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground">{product.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={isLowStock(product) ? 'font-bold text-destructive' : ''}>
                        {product.stock}
                      </span>
                      {isLowStock(product) && (
                        <Badge variant="destructive" className="text-xs">
                          Bajo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.minStock}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAdjustStock(product)}
                        title="Ajustar stock"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {products.length} de {total} productos
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        product={editingProduct}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={Boolean(confirmProduct)}
        onClose={() => setConfirmProduct(null)}
        title="Eliminar Producto"
        description={confirmProduct ? `¿Estás seguro de que deseas eliminar "${confirmProduct.name}"? Esta acción no se puede deshacer.` : ''}
        onConfirm={confirmDelete}
        variant="destructive"
      />

      {productToAdjust && (
        <AdjustStockDialog
          open={adjustStockDialogOpen}
          onOpenChange={(open) => {
            setAdjustStockDialogOpen(open)
            if (!open) {
              setProductToAdjust(null)
            }
          }}
          product={productToAdjust}
          onConfirm={handleAdjustStock}
          loading={loading}
        />
      )}
    </div>
  )
}

export default WarehouseStock

