import { useState, useEffect } from 'react'
import { Search, PackageCheck } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
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
import useWarehouse, { type MaterialRequest } from '@/shared/hooks/useWarehouse'
import PageLoader from '@/shared/components/common/PageLoader'
import RequestDetailDialog from '@/admin/components/warehouse/RequestDetailDialog'
import { useToast } from '@/shared/components/ui/use-toast'

const WarehouseRequests = () => {
  const { toast } = useToast()
  const { getPendingRequests, approveRequest, rejectRequest, loading, error } = useWarehouse()

  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchRequests = async () => {
    try {
      const result = await getPendingRequests({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
      })
      setRequests(result.data || [])
      setTotalPages(result.pagination?.totalPages || 1)
      setTotal(result.pagination?.total || 0)
    } catch (err) {
      console.error('Error fetching requests:', err)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [currentPage, searchTerm])

  const handleViewDetails = (request: MaterialRequest) => {
    setSelectedRequest(request)
    setDetailOpen(true)
  }

  const handleApprove = async (requestId: string) => {
    try {
      await approveRequest(requestId)
      toast({
        title: 'Solicitud aprobada',
        description: 'La solicitud ha sido aprobada correctamente.',
      })
      fetchRequests()
      setDetailOpen(false)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al aprobar solicitud',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (requestId: string, reason: string) => {
    try {
      await rejectRequest(requestId, reason)
      toast({
        title: 'Solicitud rechazada',
        description: 'La solicitud ha sido rechazada correctamente.',
      })
      fetchRequests()
      setDetailOpen(false)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al rechazar solicitud',
        variant: 'destructive',
      })
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
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  // Mostrar loader inicial si está cargando y no hay solicitudes
  if (loading && requests.length === 0 && !error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Autorización de Solicitudes</h1>
            <p className="text-sm text-muted-foreground">
              Revisa y autoriza las solicitudes de materiales de tus subordinados
            </p>
          </div>
        </div>
        <PageLoader
          message="Cargando solicitudes..."
          icon={<PackageCheck className="h-12 w-12 text-primary" />}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Autorización de Solicitudes</h1>
          <p className="text-sm text-muted-foreground">
            Revisa y autoriza las solicitudes de materiales de tus subordinados
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar solicitudes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9"
          />
        </div>
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
              <TableHead>Número</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Fecha</TableHead>
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
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay solicitudes pendientes
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.requester.name}</div>
                      <div className="text-sm text-muted-foreground">{request.requester.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {request.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="text-sm">
                          {item.quantity} {item.product.unit} de {item.product.name}
                        </div>
                      ))}
                      {request.items.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{request.items.length - 2} más
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.requestedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                      Ver Detalles
                    </Button>
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
            Mostrando {requests.length} de {total} solicitudes
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

      <RequestDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}

export default WarehouseRequests

