import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { cn } from '@/shared/lib/utils'

interface ActivityItem {
  id: string
  user: string
  action: string
  module: string
  timestamp: string | Date
  status?: 'success' | 'warning' | 'error'
}

interface ActivityTableProps {
  activities: ActivityItem[]
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)

const formatRelativeDate = (timestamp: string | Date) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return formatDistanceToNow(date, { addSuffix: true, locale: es })
}

const ActivityTable = ({ activities }: ActivityTableProps) => {
  const items = activities.slice(0, 10)

  const getRowClasses = (status?: ActivityItem['status']) => {
    if (status === 'success') {
      return 'border-l-4 border-l-emerald-500/80 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06]'
    }

    if (status === 'warning') {
      return 'border-l-4 border-l-amber-500/80 bg-amber-500/[0.03] hover:bg-amber-500/[0.08]'
    }

    if (status === 'error') {
      return 'border-l-4 border-l-rose-500/80 bg-rose-500/[0.04] hover:bg-rose-500/[0.1]'
    }

    return ''
  }

  const renderStatusBadge = (status?: ActivityItem['status']) => {
    if (!status) {
      return (
        <Badge variant="muted" className="gap-1">
          <Clock className="h-3.5 w-3.5" />
          Sin estado
        </Badge>
      )
    }

    if (status === 'success') {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completado
        </Badge>
      )
    }

    if (status === 'warning') {
      return (
        <Badge variant="warning" className="gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          Requiere atención
        </Badge>
      )
    }

    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3.5 w-3.5" />
        Error
      </Badge>
    )
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Actividad reciente</h3>
          <p className="text-xs text-muted-foreground">
            Últimas acciones registradas en Collector Enterprise.
          </p>
        </div>
        <Link
          to="/admin/audit"
          className="text-sm font-medium text-primary transition hover:text-primary/80"
        >
          Ver todas
        </Link>
      </div>

      {/* Vista desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(({ id, user, action, module, timestamp, status }) => (
              <TableRow key={id} className={cn('bg-background/60', getRowClasses(status))}>
                <TableCell className="min-w-[180px]">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user}</p>
                      <p className="text-xs text-muted-foreground">ID #{id.slice(0, 6)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <p className="text-sm text-foreground">{action}</p>
                </TableCell>
                <TableCell className="min-w-[140px]">
                  <Badge variant="outline" className="border-border/60 bg-background/70">
                    {module}
                  </Badge>
                </TableCell>
                <TableCell className="min-w-[140px]">
                  <p className="text-sm text-muted-foreground">{formatRelativeDate(timestamp)}</p>
                </TableCell>
                <TableCell className="min-w-[150px]">{renderStatusBadge(status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>
            <div className="w-full rounded-lg bg-muted/40 px-3 py-2 text-left text-muted-foreground">
              La auditoría completa estará disponible en la sección de historial de actividad.
            </div>
          </TableCaption>
        </Table>
      </div>

      {/* Vista mobile */}
      <div className="block divide-y divide-border/60 md:hidden">
        {items.map(({ id, user, action, module, timestamp, status }) => (
          <div
            key={id}
            className={cn(
              'flex flex-col gap-2 px-4 py-3',
              status === 'success' && 'bg-emerald-500/[0.04]',
              status === 'warning' && 'bg-amber-500/[0.05]',
              status === 'error' && 'bg-rose-500/[0.06]',
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{getInitials(user)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{user}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeDate(timestamp)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-foreground">{action}</p>
              <p className="text-xs text-muted-foreground">Módulo: {module}</p>
              <div className="mt-1">{renderStatusBadge(status)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="block w-full px-4 pb-4 text-xs md:hidden">
        <div className="w-full rounded-lg bg-muted/40 px-3 py-2 text-left text-muted-foreground">
          La auditoría completa estará disponible en la sección de historial de actividad.
        </div>
      </div>
    </div>
  )
}

export default ActivityTable


