import { useState } from 'react'
import { Package } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import type { WarehouseProduct } from '@/shared/hooks/useWarehouse'

interface MaterialRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: Array<{ product: WarehouseProduct; quantity: number }>
  onSubmit: (notes?: string) => void | Promise<void>
  loading?: boolean
}

const MaterialRequestDialog = ({
  open,
  onOpenChange,
  items,
  onSubmit,
  loading,
}: MaterialRequestDialogProps) => {
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    await onSubmit(notes || undefined)
    setNotes('')
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Confirmar Solicitud
          </DialogTitle>
          <DialogDescription>
            Revisa los productos antes de enviar la solicitud
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Resumen de productos ({totalItems} items)</div>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-muted-foreground">
                      {quantity} {product.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agrega alguna nota o comentario sobre esta solicitud..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MaterialRequestDialog

