import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Separator } from '@/shared/components/ui/separator'
import { cn } from '@/shared/lib/utils'
import { useNotifications } from '@/shared/hooks/useNotifications'

/**
 * Componente de campana de notificaciones para el header
 * Muestra un badge con el conteo de notificaciones no leídas
 * Al hacer clic, abre un popover con la lista de notificaciones
 */
const NotificationBell = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startPolling,
    stopPolling,
  } = useNotifications()

  // Iniciar polling cuando el componente se monta
  useEffect(() => {
    startPolling()

    return () => {
      stopPolling()
    }
  }, [startPolling, stopPolling])

  /**
   * Maneja el clic en una notificación
   * Marca como leída y navega al link si existe
   */
  const handleNotificationClick = async (notification: {
    id: string
    link: string | null
    read: boolean
  }) => {
    // Marcar como leída si no está leída
    if (!notification.read) {
      try {
        await markAsRead(notification.id)
      } catch (error) {
        console.error('Error al marcar notificación como leída:', error)
      }
    }

    // Navegar al link si existe
    if (notification.link) {
      setIsOpen(false)
      navigate(notification.link)
    }
  }

  /**
   * Maneja marcar una notificación como leída
   */
  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    try {
      await markAsRead(notificationId)
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
    }
  }

  /**
   * Maneja eliminar una notificación
   */
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    try {
      await deleteNotification(notificationId)
    } catch (error) {
      console.error('Error al eliminar notificación:', error)
    }
  }

  /**
   * Maneja marcar todas como leídas
   */
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error)
    }
  }

  /**
   * Navega a la página de todas las notificaciones
   */
  const handleViewAll = () => {
    setIsOpen(false)
    navigate('/admin/notificaciones')
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full border border-border/60"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Ver notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No hay notificaciones</p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Cuando tengas notificaciones, aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'relative cursor-pointer px-4 py-3 transition-colors hover:bg-accent/50',
                    !notification.read && 'bg-primary/5',
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Indicador de no leída */}
                  {!notification.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={cn(
                            'text-sm font-semibold truncate',
                            !notification.read && 'text-foreground',
                            notification.read && 'text-muted-foreground',
                          )}
                        >
                          {notification.title}
                        </h4>
                        {notification.link && (
                          <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground mt-0.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                          title="Marcar como leída"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDelete(e, notification.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between gap-2 p-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Marcar todas como leídas
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleViewAll}
              >
                Ver todas
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default NotificationBell

