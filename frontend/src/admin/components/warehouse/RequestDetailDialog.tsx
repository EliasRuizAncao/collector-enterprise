import { useState } from 'react'
import { CheckCircle, XCircle, Package, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import ConfirmDialog from '@/shared/components/common/ConfirmDialog'
import type { MaterialRequest } from '@/shared/hooks/useWarehouse'

interface RequestDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: MaterialRequest | null
  onApprove: (requestId: string) => void | Promise<void>
  onReject: (requestId: string, reason: string) => void | Promise<void>
}

const RequestDetailDialog = ({
  open,
  onOpenChange,
  request,
  onApprove,
  onReject,
}: RequestDetailDialogProps) => {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)

  if (!request) return null

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await onApprove(request.id)
      setShowApproveConfirm(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      return
    }
    setIsProcessing(true)
    try {
      await onReject(request.id, rejectionReason)
      setRejectionReason('')
      setShowRejectForm(false)
      setShowRejectConfirm(false)
    } finally {
      setIsProcessing(false)
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

    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Solicitud {request.requestNumber}
          </DialogTitle>
          <DialogDescription>
            Detalles de la solicitud de materiales
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del solicitante */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Solicitante
            </div>
            <div className="pl-6 space-y-1">
              <div className="font-medium">{request.requester.name}</div>
              <div className="text-sm text-muted-foreground">{request.requester.email}</div>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Estado y Fecha
            </div>
            <div className="pl-6 space-y-1">
              <div>{getStatusBadge(request.status)}</div>
              <div className="text-sm text-muted-foreground">
                Solicitado: {format(new Date(request.requestedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
            </div>
          </div>

          {/* Productos solicitados */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Productos Solicitados</div>
            <div className="space-y-2">
              {request.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{item.product.name}</div>
                    {item.product.description && (
                      <div className="text-sm text-muted-foreground">{item.product.description}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {item.quantity} {item.product.unit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Stock disponible: {item.product.stock}
                    </div>
                    {item.product.stock < item.quantity && (
                      <Badge variant="destructive" className="mt-1">
                        Stock insuficiente
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          {request.notes && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Notas</div>
              <div className="rounded-lg border p-3 text-sm">{request.notes}</div>
            </div>
          )}

          {/* Razón de rechazo si fue rechazada */}
          {request.status === 'REJECTED' && request.rejectionReason && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Razón del rechazo:</div>
                {request.rejectionReason}
              </AlertDescription>
            </Alert>
          )}

          {/* Formulario de rechazo */}
          {showRejectForm && request.status === 'PENDING' && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Razón del rechazo *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Explica por qué se rechaza esta solicitud..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectConfirm(true)}
                  disabled={!rejectionReason.trim() || isProcessing}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirmar Rechazo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectionReason('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Acciones */}
          {request.status === 'PENDING' && !showRejectForm && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => setShowApproveConfirm(true)}
                disabled={isProcessing}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar Solicitud
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                disabled={isProcessing}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar Solicitud
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Diálogo de confirmación para aprobar */}
      <ConfirmDialog
        open={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        title="Confirmar Aprobación"
        description={`¿Estás seguro de que deseas aprobar la solicitud ${request.requestNumber}? El solicitante recibirá una notificación y se generará un código QR para la entrega.`}
        onConfirm={handleApprove}
        confirmText="Aprobar"
        cancelText="Cancelar"
        variant="default"
        loading={isProcessing}
      />

      {/* Diálogo de confirmación para rechazar */}
      {showRejectForm && rejectionReason.trim() && (
        <ConfirmDialog
          open={showRejectConfirm}
          onClose={() => setShowRejectConfirm(false)}
          title="Confirmar Rechazo"
          description={`¿Estás seguro de que deseas rechazar la solicitud ${request.requestNumber}? El solicitante recibirá una notificación con la razón del rechazo.`}
          onConfirm={handleReject}
          confirmText="Rechazar"
          cancelText="Cancelar"
          variant="destructive"
          loading={isProcessing}
        />
      )}
    </Dialog>
  )
}

export default RequestDetailDialog

