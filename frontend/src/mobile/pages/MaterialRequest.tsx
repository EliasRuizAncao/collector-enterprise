import { useState, useEffect } from 'react'
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import useWarehouse, { type WarehouseProduct } from '@/shared/hooks/useWarehouse'
import { useToast } from '@/shared/components/ui/use-toast'

const MaterialRequestPage = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { getProducts, createRequest, loading, error } = useWarehouse()

  const [products, setProducts] = useState<WarehouseProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map())
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState<'all' | 'available' | 'lowStock'>('available')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [filter])

  const fetchProducts = async () => {
    try {
      const result = await getProducts({
        isActive: true,
        lowStock: filter === 'lowStock' ? true : undefined,
      })
      const availableProducts = filter === 'available'
        ? (result.data || []).filter((p: WarehouseProduct) => p.stock > 0)
        : result.data || []
      setProducts(availableProducts)
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (quantity < 0) quantity = 0
    if (quantity > product.stock) {
      toast({
        title: 'Stock insuficiente',
        description: `Solo hay ${product.stock} ${product.unit} disponibles`,
        variant: 'destructive',
      })
      quantity = product.stock
    }

    const newMap = new Map(selectedProducts)
    if (quantity === 0) {
      newMap.delete(productId)
    } else {
      newMap.set(productId, quantity)
    }
    setSelectedProducts(newMap)
  }

  const handleSubmit = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un producto',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const items = Array.from(selectedProducts.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      }))

      await createRequest({ items, notes: notes.trim() || undefined })
      toast({
        title: 'Solicitud creada',
        description: 'Tu solicitud ha sido enviada y será revisada por tu superior.',
      })
      setSelectedProducts(new Map())
      setNotes('')
      navigate('/mobile/warehouse/requests')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al crear solicitud',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedItemsCount = Array.from(selectedProducts.values()).reduce((sum, qty) => sum + qty, 0)
  const hasSelectedItems = selectedProducts.size > 0

  return (
    <div className="space-y-4 p-4 pb-32">
      <div>
        <h1 className="text-2xl font-bold">Solicitar Materiales</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona los materiales de trabajo que necesitas
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="whitespace-nowrap"
        >
          Todos
        </Button>
        <Button
          variant={filter === 'available' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('available')}
          className="whitespace-nowrap"
        >
          Disponibles
        </Button>
        <Button
          variant={filter === 'lowStock' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('lowStock')}
          className="whitespace-nowrap"
        >
          Stock Bajo
        </Button>
      </div>

      {/* Lista de productos */}
      <div className="space-y-3">
        {products.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay productos disponibles
            </CardContent>
          </Card>
        ) : (
          <>
            {products.map((product) => {
            const isLowStock = product.stock <= product.minStock
            const selectedQty = selectedProducts.get(product.id) || 0
            const isSelected = selectedQty > 0

            return (
              <Card
                key={product.id}
                className={`transition-all ${isSelected ? 'border-primary border-2 shadow-md' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header del producto */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base">{product.name}</h3>
                          {isLowStock && (
                            <Badge variant="destructive" className="text-xs">
                              Stock Bajo
                            </Badge>
                          )}
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Seleccionado
                            </Badge>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {product.description}
                          </p>
                        )}
                        <div className="text-sm">
                          <span className="text-muted-foreground">Disponible: </span>
                          <span className={isLowStock ? 'font-bold text-destructive' : 'font-semibold'}>
                            {product.stock} {product.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Selector de cantidad */}
                    <div className="flex items-center gap-3 pt-2 border-t">
                      <Label htmlFor={`qty-${product.id}`} className="text-sm font-medium whitespace-nowrap">
                        Cantidad:
                      </Label>
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => handleQuantityChange(product.id, selectedQty - 1)}
                          disabled={selectedQty === 0}
                        >
                          -
                        </Button>
                        <Input
                          id={`qty-${product.id}`}
                          type="number"
                          min="0"
                          max={product.stock}
                          value={selectedQty}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            handleQuantityChange(product.id, value)
                          }}
                          className="h-9 w-20 text-center"
                          disabled={product.stock === 0}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => handleQuantityChange(product.id, selectedQty + 1)}
                          disabled={selectedQty >= product.stock || product.stock === 0}
                        >
                          +
                        </Button>
                        <span className="text-sm text-muted-foreground ml-2">
                          {product.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Notas - Solo visible cuando hay items seleccionados */}
          {hasSelectedItems && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Agrega alguna nota sobre esta solicitud..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          )}
          </>
        )}
      </div>

      {/* Botón de envío fijo - Posicionado por encima de la barra de navegación */}
      {hasSelectedItems && (
        <div className="fixed bottom-16 left-0 right-0 bg-background border-t p-4 shadow-lg z-[60] safe-area-bottom">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={loading || isSubmitting}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Enviando...' : `Enviar Solicitud (${selectedItemsCount} ${selectedItemsCount === 1 ? 'material' : 'materiales'})`}
          </Button>
        </div>
      )}
    </div>
  )
}

export default MaterialRequestPage
