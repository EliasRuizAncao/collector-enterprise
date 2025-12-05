import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import useWarehouse, { type MaterialRequest } from '@/shared/hooks/useWarehouse'
import SignaturePad, { type SignatureData } from '@/mobile/components/SignaturePad'
import { useToast } from '@/shared/components/ui/use-toast'
import { useAuthStore } from '@/shared/store/authStore'

const DeliverMaterial = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { getRequest, confirmDelivery, loading } = useWarehouse()

  const [request, setRequest] = useState<MaterialRequest | null>(null)
  const [itemsDelivered, setItemsDelivered] = useState<Map<string, number>>(new Map())
  const [showSignature, setShowSignature] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchRequest()
    }
  }, [id])

  const fetchRequest = async () => {
    if (!id) return
    try {
      const data = await getRequest(id)
      setRequest(data)
      // Inicializar con las cantidades solicitadas
      const initialMap = new Map<string, number>()
      data.items.forEach((item: { id: string; quantity: number }) => {
        initialMap.set(item.id, item.quantity)
      })
      setItemsDelivered(initialMap)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al cargar solicitud',
        variant: 'destructive',
      })
      navigate('/mobile/warehouse/requests')
    }
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (!request) return
    const item = request.items.find((i) => i.id === itemId)
    if (!item) return

    if (quantity < 0) quantity = 0
    if (quantity > item.quantity) quantity = item.quantity

    setItemsDelivered(new Map(itemsDelivered.set(itemId, quantity)))
  }

  const handleSignatureSave = (signatureData: SignatureData) => {
    setSignature(signatureData.dataUrl)
    setShowSignature(false)
  }

  const handleConfirmDelivery = async () => {
    if (!request || !user || !signature) return

    const items = Array.from(itemsDelivered.entries())
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantityDelivered]) => ({
        itemId,
        quantityDelivered,
      }))

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes entregar al menos un producto',
        variant: 'destructive',
      })
      return
    }

    try {
      await confirmDelivery(request.id, user.id, signature, items)
      toast({
        title: 'Entrega confirmada',
        description: 'La entrega ha sido confirmada correctamente',
      })
      navigate('/mobile/warehouse/requests')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al confirmar entrega',
        variant: 'destructive',
      })
    }
  }

  if (!request) {
    return <div className="p-4">Cargando...</div>
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Confirmar Entrega</h1>
        <p className="text-sm text-muted-foreground">
          Solicitud {request.requestNumber}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitante</CardTitle>
          <CardDescription>{request.requester.name}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos a Entregar</CardTitle>
          <CardDescription>
            Ajusta las cantidades entregadas si es necesario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {request.items.map((item) => {
            const deliveredQty = itemsDelivered.get(item.id) || 0
            return (
              <div key={item.id} className="space-y-2 rounded-lg border p-3">
                <div>
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Solicitado: {item.quantity} {item.product.unit}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`qty-${item.id}`} className="text-sm">
                    Cantidad entregada:
                  </Label>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={deliveredQty}
                    onChange={(e) =>
                      handleQuantityChange(item.id, parseInt(e.target.value) || 0)
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.product.unit}
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firma del Receptor</CardTitle>
          <CardDescription>
            El receptor debe firmar para confirmar la recepción
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signature ? (
            <div className="space-y-2">
              <div className="rounded-lg border p-4 bg-white">
                <img src={signature} alt="Firma" className="w-full h-32 object-contain" />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSignature(null)
                  setShowSignature(true)
                }}
              >
                Cambiar Firma
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={() => setShowSignature(true)}
            >
              Capturar Firma
            </Button>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={handleConfirmDelivery}
        disabled={!signature || loading}
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Confirmar Entrega
      </Button>

      {showSignature && (
        <SignaturePad
          onSave={handleSignatureSave}
          onClose={() => setShowSignature(false)}
        />
      )}
    </div>
  )
}

export default DeliverMaterial

