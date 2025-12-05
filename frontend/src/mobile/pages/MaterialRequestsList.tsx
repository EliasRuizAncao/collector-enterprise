import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Clock, CheckCircle, XCircle, QrCode } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import useWarehouse, { type MaterialRequest } from '@/shared/hooks/useWarehouse'
import { useToast } from '@/shared/components/ui/use-toast'
import qrcode from 'qrcode'

const MaterialRequestsList = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { getRequests } = useWarehouse()

  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const result = await getRequests({ status: undefined })
      setRequests(result.data || [])
    } catch (err) {
      console.error('Error fetching requests:', err)
    }
  }

  const handleShowQR = async (request: MaterialRequest) => {
    if (!request.qrCode) {
      toast({
        title: 'Error',
        description: 'Esta solicitud no tiene código QR',
        variant: 'destructive',
      })
      return
    }

    try {
      const qrDataUrl = await qrcode.toDataURL(request.qrCode)
      setQrImage(qrDataUrl)
      setSelectedRequest(request)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Error al generar código QR',
        variant: 'destructive',
      })
    }
  }

  const getStatusIcon = (status: MaterialRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'READY_FOR_PICKUP':
        return <Package className="h-4 w-4 text-blue-500" />
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: MaterialRequest['status']) => {
    const variants: Record<MaterialRequest['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'outline',
      APPROVED: 'default',
      REJECTED: 'destructive',
      READY_FOR_PICKUP: 'secondary',
      DELIVERED: 'default',
      CANCELLED: 'secondary',
    }

    const labels: Record<MaterialRequest['status'], string> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
      READY_FOR_PICKUP: 'Lista para recoger',
      DELIVERED: 'Entregada',
      CANCELLED: 'Cancelada',
    }

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis Solicitudes</h1>
          <p className="text-sm text-muted-foreground">
            Historial de solicitudes de materiales
          </p>
        </div>
        <Button onClick={() => navigate('/mobile/warehouse/request')}>
          <Package className="mr-2 h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tienes solicitudes
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const hasQR = (request.status === 'APPROVED' || request.status === 'READY_FOR_PICKUP') && request.qrCode
            const isApproved = request.status === 'APPROVED' || request.status === 'READY_FOR_PICKUP'
            
            return (
              <Card 
                key={request.id}
                className={hasQR ? 'border-primary border-2 shadow-lg' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.requestNumber}</CardTitle>
                      <CardDescription>
                        {format(new Date(request.requestedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Productos:</div>
                    <div className="space-y-1">
                      {request.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="text-sm text-muted-foreground">
                          • {item.quantity} {item.product.unit} de {item.product.name}
                        </div>
                      ))}
                      {request.items.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{request.items.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>

                  {request.rejectionReason && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <div className="font-medium mb-1">Razón del rechazo:</div>
                      {request.rejectionReason}
                    </div>
                  )}

                  {isApproved && !request.qrCode && (
                    <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                      <div className="font-medium mb-1">⏳ Procesando...</div>
                      <div>Tu solicitud está siendo preparada. El código QR estará disponible pronto.</div>
                    </div>
                  )}

                  {hasQR && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="rounded-lg bg-primary/10 p-3 text-center">
                        <QrCode className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm font-medium mb-1">✅ Listo para recoger</p>
                        <p className="text-xs text-muted-foreground">
                          Presenta el código QR en bodega
                        </p>
                      </div>
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full"
                        onClick={() => handleShowQR(request)}
                      >
                        <QrCode className="mr-2 h-5 w-5" />
                        Mostrar QR al Bodeguero
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog para mostrar QR */}
      {selectedRequest && qrImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            setSelectedRequest(null)
            setQrImage(null)
          }}
        >
          <Card 
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="text-center">Código QR de Solicitud</CardTitle>
              <CardDescription className="text-center">
                Solicitud {selectedRequest.requestNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrImage} alt="QR Code" className="w-72 h-72" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Muestra este código al bodeguero</p>
                  <p className="text-xs text-muted-foreground">
                    El bodeguero escaneará este código para procesar tu solicitud
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => {
                    setSelectedRequest(null)
                    setQrImage(null)
                  }}
                >
                  Cerrar
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    // Copiar código QR al portapapeles
                    navigator.clipboard.writeText(selectedRequest.qrCode || '')
                    toast({
                      title: 'Código copiado',
                      description: 'El código QR ha sido copiado al portapapeles',
                    })
                  }}
                >
                  Copiar Código
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default MaterialRequestsList

