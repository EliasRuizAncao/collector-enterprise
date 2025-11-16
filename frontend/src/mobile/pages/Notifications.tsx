/**
 * Página de Notificaciones - Mobile
 * Historial completo de notificaciones push recibidas
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
  X,
  Filter,
  Trash2,
  CheckCheck,
  Settings,
  ExternalLink,
  ClipboardList,
  MessageSquare,
  AlertTriangle,
  Calendar,
  MapPin,
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import FilterSystem, { type FilterConfig } from '../components/FilterSystem'
import FilterChips from '../components/FilterChips'
import { useToast } from '@/shared/components/ui/use-toast'
import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import { useAuthStore } from '@/shared/store/authStore'

/**
 * Tipos de notificaciones
 */
type NotificationType =
  | 'new_task'
  | 'reminder'
  | 'overdue'
  | 'comment'
  | 'update'
  | 'system'
  | 'security'

/**
 * Estado de notificación
 */
type NotificationStatus = 'unread' | 'read' | 'archived'

/**
 * Notificación
 */
interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  timestamp: Date
  status: NotificationStatus
  actionUrl?: string
  actionLabel?: string
  metadata?: {
    taskId?: string
    formId?: string
    formName?: string
    userId?: string
    userName?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }
  readAt?: Date
}

/**
 * Agrupar notificaciones por fecha
 */
const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: Record<string, Notification[]> = {
    hoy: [],
    ayer: [],
    'esta semana': [],
    'este mes': [],
    'más antiguo': [],
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekStart = startOfWeek(now, { locale: es })
  const monthStart = startOfMonth(now)

  notifications.forEach((notification) => {
    const date = new Date(notification.timestamp)

    if (date >= today) {
      groups.hoy.push(notification)
    } else if (date >= yesterday) {
      groups.ayer.push(notification)
    } else if (date >= weekStart) {
      groups['esta semana'].push(notification)
    } else if (date >= monthStart) {
      groups['este mes'].push(notification)
    } else {
      groups['más antiguo'].push(notification)
    }
  })

  return groups
}

/**
 * Obtener icono según tipo de notificación
 */
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'new_task':
      return ClipboardList
    case 'reminder':
      return Clock
    case 'overdue':
      return AlertTriangle
    case 'comment':
      return MessageSquare
    case 'update':
      return Info
    case 'system':
      return Settings
    case 'security':
      return AlertCircle
    default:
      return Bell
  }
}

/**
 * Obtener color según tipo de notificación
 */
const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'new_task':
      return 'text-blue-500'
    case 'reminder':
      return 'text-amber-500'
    case 'overdue':
      return 'text-red-500'
    case 'comment':
      return 'text-purple-500'
    case 'update':
      return 'text-green-500'
    case 'system':
      return 'text-gray-500'
    case 'security':
      return 'text-orange-500'
    default:
      return 'text-gray-500'
  }
}

/**
 * Componente de card de notificación
 */
const NotificationCard = ({
  notification,
  onRead,
  onArchive,
  onAction,
}: {
  notification: Notification
  onRead: (id: string) => void
  onArchive: (id: string) => void
  onAction: (notification: Notification) => void
}) => {
  const Icon = getNotificationIcon(notification.type)
  const colorClass = getNotificationColor(notification.type)
  const isUnread = notification.status === 'unread'

  const handleTap = () => {
    if (isUnread) {
      onRead(notification.id)
    }
    if (notification.actionUrl) {
      onAction(notification)
    }
  }

  return (
    <Card
      className={cn(
        'mb-3 cursor-pointer touch-manipulation active:scale-[0.98] transition-all',
        isUnread && 'border-primary/50 bg-primary/5',
      )}
      onClick={handleTap}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className={cn('mt-1 flex-shrink-0', colorClass)}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3
                  className={cn(
                    'text-sm font-semibold mb-1',
                    isUnread && 'font-bold',
                  )}
                >
                  {notification.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.body}
                </p>
              </div>
              {isUnread && (
                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
              )}
            </div>

            {/* Metadata */}
            {notification.metadata?.formName && (
              <p className="text-xs text-muted-foreground mt-1">
                {notification.metadata.formName}
              </p>
            )}

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(notification.timestamp, {
                addSuffix: true,
                locale: es,
              })}
            </p>

            {/* Acciones */}
            {notification.actionUrl && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAction(notification)
                  }}
                >
                  {notification.actionLabel || 'Ver'}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchive(notification.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Página principal de Notificaciones
 */
const Notifications = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuthStore()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    type: 'all',
    status: 'all',
    dateRange: 'all',
  })

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // TODO: Reemplazar con endpoint real cuando esté disponible
      const response = await api.get('/notifications')
      const data = response.data

      // Transformar datos de API a formato local
      const transformed: Notification[] = (data.notifications || []).map(
        (n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          timestamp: new Date(n.timestamp),
          status: n.status || 'unread',
          actionUrl: n.actionUrl,
          actionLabel: n.actionLabel,
          metadata: n.metadata,
          readAt: n.readAt ? new Date(n.readAt) : undefined,
        }),
      )

      setNotifications(transformed)
    } catch (err: any) {
      // En desarrollo, usar datos mock
      if (import.meta.env.DEV) {
        const mockNotifications: Notification[] = [
          {
            id: '1',
            type: 'new_task',
            title: 'Nueva tarea asignada',
            body: 'Se te ha asignado el formulario "Inspección de Obra"',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
            status: 'unread',
            actionUrl: '/mobile/form/1',
            actionLabel: 'Ver tarea',
            metadata: {
              formId: 'f1',
              formName: 'Inspección de Obra',
              priority: 'high',
            },
          },
          {
            id: '2',
            type: 'reminder',
            title: 'Recordatorio',
            body: 'Tienes 3 tareas pendientes que vencen hoy',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
            status: 'unread',
            actionUrl: '/mobile/assignments',
            actionLabel: 'Ver tareas',
          },
          {
            id: '3',
            type: 'overdue',
            title: 'Tarea vencida',
            body: 'El formulario "Control de Materiales" está vencido',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5h ago
            status: 'read',
            actionUrl: '/mobile/form/2',
            actionLabel: 'Ver tarea',
            metadata: {
              formId: 'f2',
              formName: 'Control de Materiales',
            },
            readAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
          {
            id: '4',
            type: 'comment',
            title: 'Nuevo comentario',
            body: 'Juan Pérez comentó en tu formulario',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 día
            status: 'read',
            metadata: {
              userName: 'Juan Pérez',
            },
            readAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
          },
        ]
        setNotifications(mockNotifications)
      } else {
        setError(err.response?.data?.message || 'Error al cargar notificaciones')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  // Filtrar notificaciones
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications]

    // Filtrar por tipo
    if (filterValues.type && filterValues.type !== 'all') {
      filtered = filtered.filter((n) => n.type === filterValues.type)
    }

    // Filtrar por estado
    if (filterValues.status && filterValues.status !== 'all') {
      filtered = filtered.filter((n) => n.status === filterValues.status)
    }

    // Filtrar por rango de fechas
    if (filterValues.dateRange && filterValues.dateRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (filterValues.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = startOfWeek(now, { locale: es })
          break
        case 'month':
          startDate = startOfMonth(now)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter(
        (n) => new Date(n.timestamp) >= startDate,
      )
    }

    return filtered.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    )
  }, [notifications, filterValues])

  // Agrupar por fecha
  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(filteredNotifications),
    [filteredNotifications],
  )

  // Contar no leídas
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === 'unread').length,
    [notifications],
  )

  // Marcar como leída
  const handleRead = useCallback(
    async (id: string) => {
      try {
        // TODO: Llamar a API para marcar como leída
        await api.patch(`/notifications/${id}/read`)

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, status: 'read' as NotificationStatus, readAt: new Date() }
              : n,
          ),
        )

        toast({
          title: 'Notificación marcada como leída',
          duration: 2000,
        })
      } catch (error) {
        // En desarrollo, solo actualizar localmente
        if (import.meta.env.DEV) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === id
                ? { ...n, status: 'read' as NotificationStatus, readAt: new Date() }
                : n,
            ),
          )
        } else {
          toast({
            title: 'Error',
            description: 'No se pudo marcar la notificación como leída',
            variant: 'destructive',
          })
        }
      }
    },
    [toast],
  )

  // Marcar todas como leídas
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      // TODO: Llamar a API
      await api.post('/notifications/mark-all-read')

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          status: 'read' as NotificationStatus,
          readAt: n.readAt || new Date(),
        })),
      )

      toast({
        title: 'Todas las notificaciones marcadas como leídas',
        duration: 2000,
      })
    } catch (error) {
      // En desarrollo, solo actualizar localmente
      if (import.meta.env.DEV) {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            status: 'read' as NotificationStatus,
            readAt: n.readAt || new Date(),
          })),
        )
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron marcar todas como leídas',
          variant: 'destructive',
        })
      }
    }
  }, [toast])

  // Archivar
  const handleArchive = useCallback(
    async (id: string) => {
      try {
        // TODO: Llamar a API
        await api.delete(`/notifications/${id}`)

        setNotifications((prev) => prev.filter((n) => n.id !== id))

        toast({
          title: 'Notificación archivada',
          duration: 2000,
        })
      } catch (error) {
        // En desarrollo, solo actualizar localmente
        if (import.meta.env.DEV) {
          setNotifications((prev) => prev.filter((n) => n.id !== id))
        } else {
          toast({
            title: 'Error',
            description: 'No se pudo archivar la notificación',
            variant: 'destructive',
          })
        }
      }
    },
    [toast],
  )

  // Acción de notificación
  const handleAction = useCallback(
    (notification: Notification) => {
      if (notification.actionUrl) {
        navigate(notification.actionUrl)
        if (notification.status === 'unread') {
          handleRead(notification.id)
        }
      }
    },
    [navigate, handleRead],
  )

  // Reset filtros
  const handleResetFilters = useCallback(() => {
    setFilterValues({
      type: 'all',
      status: 'all',
      dateRange: 'all',
    })
  }, [])

  const handleApplyFilters = useCallback(() => {
    setShowFilters(false)
  }, [])

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {/* Filter Chips */}
      {Object.keys(filterValues).filter(
        (key) =>
          filterValues[key] !== undefined &&
          filterValues[key] !== null &&
          filterValues[key] !== '' &&
          filterValues[key] !== 'all',
      ).length > 0 && (
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background px-4 py-2">
          <FilterChips
            filters={filterConfigs}
            values={filterValues}
            onRemove={(filterId) => {
              setFilterValues((prev) => {
                const newValues = { ...prev }
                newValues[filterId] = 'all'
                return newValues
              })
            }}
            onClearAll={handleResetFilters}
          />
        </div>
      )}

      {/* Header */}
      <div
        className={cn(
          'sticky z-10 flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3',
          Object.keys(filterValues).filter(
            (key) =>
              filterValues[key] !== undefined &&
              filterValues[key] !== null &&
              filterValues[key] !== '' &&
              filterValues[key] !== 'all',
          ).length > 0
            ? 'top-[4rem]'
            : 'top-0',
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-xl font-bold">Notificaciones</h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-6 min-w-6">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(true)}
            className="h-9 w-9"
          >
            <Filter className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mobile/settings')}
            className="h-9 w-9"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Acciones rápidas */}
      {unreadCount > 0 && (
        <div className="border-b bg-muted/30 px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como leídas ({unreadCount})
          </Button>
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="h-5 w-5 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar notificaciones</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => loadNotifications()}>Reintentar</Button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {notifications.length === 0
                ? 'No hay notificaciones'
                : 'No hay notificaciones con estos filtros'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {notifications.length === 0
                ? 'Cuando recibas notificaciones, aparecerán aquí'
                : 'Intenta cambiar los filtros'}
            </p>
            {notifications.length > 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleResetFilters}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hoy */}
            {groupedNotifications.hoy.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
                  Hoy
                </h2>
                <div className="space-y-3">
                  {groupedNotifications.hoy.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onRead={handleRead}
                      onArchive={handleArchive}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Ayer */}
            {groupedNotifications.ayer.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
                  Ayer
                </h2>
                <div className="space-y-3">
                  {groupedNotifications.ayer.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onRead={handleRead}
                      onArchive={handleArchive}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Esta semana */}
            {groupedNotifications['esta semana'].length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
                  Esta semana
                </h2>
                <div className="space-y-3">
                  {groupedNotifications['esta semana'].map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onRead={handleRead}
                      onArchive={handleArchive}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Este mes */}
            {groupedNotifications['este mes'].length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
                  Este mes
                </h2>
                <div className="space-y-3">
                  {groupedNotifications['este mes'].map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onRead={handleRead}
                      onArchive={handleArchive}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Más antiguo */}
            {groupedNotifications['más antiguo'].length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
                  Más antiguo
                </h2>
                <div className="space-y-3">
                  {groupedNotifications['más antiguo'].map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onRead={handleRead}
                      onArchive={handleArchive}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Filtros Sheet */}
      <FilterSystem
        filters={filterConfigs}
        values={filterValues}
        onChange={setFilterValues}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        open={showFilters}
        onClose={() => setShowFilters(false)}
        storageKey="notifications-filters"
        persistInUrl={true}
        resultCount={filteredNotifications.length}
      />
    </div>
  )
}

export default Notifications

