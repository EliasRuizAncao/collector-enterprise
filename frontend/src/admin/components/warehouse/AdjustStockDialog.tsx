import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import type { WarehouseProduct } from '@/shared/hooks/useWarehouse'

interface AdjustStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: WarehouseProduct | null
  onConfirm: (quantity: number, operation: 'add' | 'subtract') => void | Promise<void>
  loading?: boolean
}

const AdjustStockDialog = ({
  open,
  onOpenChange,
  product,
  onConfirm,
  loading,
}: AdjustStockDialogProps) => {
  const [operation, setOperation] = useState<'add' | 'subtract'>('add')
  const [quantity, setQuantity] = useState('1')

  useEffect(() => {
    if (open && product) {
      setOperation('add')
      setQuantity('1')
    }
  }, [open, product])

  if (!product) return null

  const handleSubmit = async () => {
    const qty = parseInt(quantity) || 0
    if (qty <= 0) {
      return
    }
    if (operation === 'subtract' && qty > product.stock) {
      return
    }
    await onConfirm(qty, operation)
    onOpenChange(false)
  }

  const maxSubtract = product.stock
  const newStock = operation === 'add' 
    ? product.stock + (parseInt(quantity) || 0)
    : product.stock - (parseInt(quantity) || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Stock</DialogTitle>
          <DialogDescription>
            {product.name} - Stock actual: {product.stock} {product.unit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Operación</Label>
            <RadioGroup value={operation} onValueChange={(value) => setOperation(value as 'add' | 'subtract')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="flex items-center gap-2 cursor-pointer">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Aumentar stock
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="subtract" id="subtract" />
                <Label htmlFor="subtract" className="flex items-center gap-2 cursor-pointer">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Disminuir stock
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Cantidad {operation === 'subtract' && `(máximo: ${maxSubtract})`}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={operation === 'subtract' ? maxSubtract : undefined}
              value={quantity}
              onChange={(e) => {
                const value = e.target.value
                if (value === '' || /^\d+$/.test(value)) {
                  setQuantity(value)
                }
              }}
              placeholder="Ingresa la cantidad"
            />
          </div>

          {quantity && parseInt(quantity) > 0 && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="text-sm text-muted-foreground">Stock después del ajuste:</div>
              <div className="text-lg font-semibold">
                {newStock >= 0 ? newStock : 0} {product.unit}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !quantity ||
              parseInt(quantity) <= 0 ||
              (operation === 'subtract' && parseInt(quantity) > maxSubtract)
            }
          >
            {loading ? 'Aplicando...' : 'Aplicar Ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdjustStockDialog

