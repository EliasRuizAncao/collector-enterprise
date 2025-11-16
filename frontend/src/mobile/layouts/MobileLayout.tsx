import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { useToast } from '@/shared/components/ui/use-toast'
import BottomNav from '../components/BottomNav'
import MobileDrawer from '../components/MobileDrawer'
import { PageTransition } from '../components/animated'
import { OfflineBanner, SyncIndicator, ConnectionStatus } from '../components/offline'
import {
  isNotificationSupported,
  subscribeToNotifications,
  getNotificationPermission,
  getBadgeCount,
  clearBadge,
  setupNotificationListeners,
  setForegroundNotificationCallback,
  type NotificationData,
} from '../utils/pushNotifications'
import { serviceWorkerManager } from '../utils/serviceWorkerManager'
import { WelcomeTutorial } from '../components/Tutorial'
import { HelpButton } from '../components/HelpCenter'

/**
 * Layout base para la versión mobile
 * Diseño mobile-first optimizado para pantallas 320px-428px
 * Inspirado en: WhatsApp, Instagram, apps bancarias modernas
 */
const MobileLayout = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied'>('default')

  // Prevenir scroll del body cuando el drawer está abierto (mejora UX)
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  // Inicializar notificaciones push
  useEffect(() => {
    const initNotifications = async () => {
      // Verificar soporte
      if (!isNotificationSupported()) {
        console.log('Notificaciones push no soportadas')
        return
      }

      // Obtener estado de permisos
      const permission = getNotificationPermission()
      setNotificationPermission(permission)

      // Si ya tiene permiso, suscribirse automáticamente
      if (permission === 'granted') {
        try {
          // Obtener registration del service worker
          const registration = await serviceWorkerManager.getRegistration()
          if (registration) {
            // Configurar callback para notificaciones en foreground
            setForegroundNotificationCallback((payload) => {
              const data = payload.data as unknown as NotificationData

              // Actualizar badge
              updateBadgeCount()

              // Navegar si hay URL
              if (data?.url) {
                navigate(data.url)
              } else if (data?.assignmentId) {
                navigate(`/mobile/form/${data.assignmentId}`)
              }

              // Mostrar toast si está en foreground
              toast({
                title: data?.formName || payload.notification?.title || 'Nueva notificación',
                description: data?.message || payload.notification?.body || 'Tienes una nueva actualización',
              })
            })

            // Configurar listeners para notificaciones recibidas
            setupNotificationListeners()

            // Intentar suscribirse si no está suscrito
            await subscribeToNotifications()
          }
        } catch (error) {
          console.error('Error al inicializar notificaciones:', error)
        }
      }

      // Cargar badge count inicial
      updateBadgeCount()
    }

    void initNotifications()
  }, [navigate, toast])

  // Actualizar badge count
  const updateBadgeCount = useCallback(async () => {
    const count = getBadgeCount() // Es síncrono, retorna number
    setUnreadNotifications(count)
  }, [])

  // Manejar click en botón de notificaciones
  const handleNotificationsClick = useCallback(async () => {
    // Si no tiene permiso, pedirlo
    if (notificationPermission === 'default') {
      try {
        await subscribeToNotifications()
        setNotificationPermission('granted')
        toast({
          title: 'Notificaciones habilitadas',
          description: 'Ahora recibirás notificaciones de nuevas tareas y actualizaciones',
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo habilitar las notificaciones',
          variant: 'destructive',
        })
      }
    } else {
      // Limpiar badge y navegar a página de notificaciones
      await clearBadge()
      setUnreadNotifications(0)
      navigate('/mobile/notifications')
    }
  }, [notificationPermission, toast])

  // Actualizar badge periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      updateBadgeCount()
    }, 30000) // Cada 30 segundos

    return () => clearInterval(interval)
  }, [updateBadgeCount])

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background">
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header Mobile - Sticky con blur backdrop */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 safe-area-top">
        {/* Menú hamburguesa izquierda */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg touch-manipulation"
          aria-label="Abrir menú"
          onClick={() => setIsDrawerOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo centrado */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
            CE
          </div>
        </div>

        {/* Notificaciones y Connection Status */}
        <div className="flex items-center gap-2">
          <ConnectionStatus size="sm" showTooltip={true} />
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-lg touch-manipulation"
            aria-label="Notificaciones"
            onClick={handleNotificationsClick}
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] font-semibold"
              >
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Content Area - Scroll independiente con padding para bottom nav */}
      <main className="flex-1 overflow-y-auto overscroll-contain pb-20 safe-bottom">
        <PageTransition className="min-h-full">
          <div className="px-4 py-4">
            <Outlet />
          </div>
        </PageTransition>
      </main>

      {/* Bottom Navigation Bar - Componente separado */}
      <BottomNav />

      {/* Mobile Drawer - Menú lateral */}
      <MobileDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Sync Indicator - Badge flotante */}
      <SyncIndicator position="bottom-right" />

      {/* Help Button - Botón flotante de ayuda */}
      <HelpButton />

      {/* Welcome Tutorial - Tour inicial para nuevos usuarios */}
      <WelcomeTutorial />
    </div>
  )
}

export default MobileLayout
