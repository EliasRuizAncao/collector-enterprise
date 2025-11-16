import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  ClipboardList,
  Clock,
  Bell,
  QrCode,
  Camera,
  MapPin,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  Edit,
  Wifi,
  WifiOff,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { useAuth } from '@/shared/hooks/useAuth'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { slideInFromLeft, staggerContainer, staggerItem, tapScale, bounceIn, getReducedMotionVariants } from '../utils/animations'

/**
 * Tipo para un item del menú
 */
interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  to?: string
  action?: () => void
  badge?: number | boolean
  showDot?: boolean
  section: 'main' | 'tools' | 'settings'
  danger?: boolean
}

/**
 * Props del componente MobileDrawer
 */
interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * Componente MobileDrawer - Menú lateral deslizable
 * Inspirado en Gmail mobile y Slack mobile drawers
 */
const MobileDrawer = ({ open, onClose }: MobileDrawerProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  // Detectar si está offline
  const [isOffline, setIsOffline] = useState(false)

  // Detectar estado offline/online
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Cerrar drawer cuando se navega a otra ruta
  useEffect(() => {
    if (open) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Iniciales del usuario para el avatar
  const userInitials = useMemo(() => {
    const source = user?.name ?? user?.email ?? 'U'
    return source
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }, [user?.name, user?.email])

  // Verificar si la ruta está activa
  const isActiveRoute = (path?: string) => {
    if (!path) return false
    if (path === '/mobile/dashboard') {
      return location.pathname === path || location.pathname === '/mobile'
    }
    return location.pathname.startsWith(path)
  }

  // Manejar navegación
  const handleNavigation = (item: MenuItem) => {
    if (item.action) {
      item.action()
    } else if (item.to) {
      navigate(item.to)
    }
    onClose()
  }

  // Manejar logout
  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
      onClose()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  // Items del menú
  const menuItems: MenuItem[] = useMemo(
    () => [
      // Sección Principal
      {
        id: 'home',
        label: 'Inicio',
        icon: Home,
        to: '/mobile/dashboard',
        section: 'main',
      },
      {
        id: 'tasks',
        label: 'Mis Tareas',
        icon: ClipboardList,
        to: '/mobile/assignments',
        badge: 3, // TODO: Obtener de API
        section: 'main',
      },
      {
        id: 'history',
        label: 'Historial',
        icon: Clock,
        to: '/mobile/history',
        section: 'main',
      },
      {
        id: 'notifications',
        label: 'Notificaciones',
        icon: Bell,
        to: '/mobile/notifications',
        badge: 2, // TODO: Obtener de API
        section: 'main',
      },

      // Sección Herramientas
      {
        id: 'qr',
        label: 'Escanear QR',
        icon: QrCode,
        action: () => navigate('/mobile/camera?mode=qr'),
        section: 'tools',
      },
      {
        id: 'camera',
        label: 'Capturar Foto',
        icon: Camera,
        action: () => navigate('/mobile/camera'),
        section: 'tools',
      },
      {
        id: 'location',
        label: 'Mi Ubicación',
        icon: MapPin,
        action: () => {
          // TODO: Abrir modal de ubicación
          console.log('Mostrar ubicación')
        },
        section: 'tools',
      },

      // Sección Configuración
      {
        id: 'settings',
        label: 'Ajustes',
        icon: Settings,
        to: '/mobile/settings',
        section: 'settings',
      },
      {
        id: 'help',
        label: 'Ayuda',
        icon: HelpCircle,
        to: '/mobile/tutorials',
        section: 'settings',
      },
      {
        id: 'about',
        label: 'Acerca de',
        icon: Info,
        action: () => {
          // Navegar a perfil donde está la sección "Acerca de"
          navigate('/mobile/profile')
          // Scroll a sección "Acerca de" podría hacerse con hash
        },
        section: 'settings',
      },
    ],
    [navigate],
  )

  // Agrupar items por sección
  const mainItems = menuItems.filter((item) => item.section === 'main')
  const toolItems = menuItems.filter((item) => item.section === 'tools')
  const settingsItems = menuItems.filter((item) => item.section === 'settings')

  return (
    <Sheet open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <SheetContent
        side="left"
        className="w-[280px] border-r border-border/60 bg-background p-0 sm:w-[320px]"
      >
        <div className="flex h-full flex-col">
          {/* Header con usuario */}
          <SheetHeader className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-4 py-6">
            <div className="space-y-4">
              {/* Avatar y Edit button */}
              <div className="flex items-start justify-between">
                <Avatar className="h-16 w-16 ring-4 ring-background">
                  <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full touch-manipulation"
                  onClick={() => {
                    navigate('/mobile/profile')
                    onClose()
                  }}
                  aria-label="Editar perfil"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              {/* Nombre y email */}
              <div className="space-y-1">
                <SheetTitle className="text-lg font-semibold text-foreground">
                  {user?.name ?? 'Usuario'}
                </SheetTitle>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email ?? ''}
                </p>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {user?.role?.toLowerCase() ?? 'sin rol'}
                </Badge>
              </div>
            </div>
          </SheetHeader>

          {/* Menu Items - Scrollable */}
          <div className="flex-1 overflow-y-auto py-2">
            {/* Sección Principal */}
            <motion.nav 
              className="px-2 py-2"
              variants={getReducedMotionVariants(staggerContainer)}
              initial="initial"
              animate="animate"
            >
              {mainItems.map((item, index) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.to)
                const hasBadge = typeof item.badge === 'number' && item.badge > 0
                const showDot = item.showDot === true

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigation(item)}
                    variants={getReducedMotionVariants(staggerItem)}
                    {...tapScale}
                    custom={index}
                    className={cn(
                      'mobile-list-item w-full touch-manipulation',
                      isActive && 'bg-accent text-accent-foreground',
                    )}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {hasBadge && (
                      <motion.div
                        initial="initial"
                        animate="animate"
                        variants={bounceIn}
                      >
                        <Badge
                          variant="destructive"
                          className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] font-semibold"
                        >
                          {typeof item.badge === 'number' && item.badge > 9 ? '9+' : String(item.badge)}
                        </Badge>
                      </motion.div>
                    )}
                    {showDot && !hasBadge && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="h-2 w-2 rounded-full bg-destructive"
                      />
                    )}
                  </motion.button>
                )
              })}
            </motion.nav>

            <Separator className="my-2" />

            {/* Sección Herramientas */}
            <nav className="px-2 py-2">
              <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                Herramientas
              </p>
              {toolItems.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigation(item)}
                    className="mobile-list-item w-full touch-manipulation"
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                )
              })}
            </nav>

            <Separator className="my-2" />

            {/* Sección Configuración */}
            <nav className="px-2 py-2">
              <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                Configuración
              </p>
              {settingsItems.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.to)

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigation(item)}
                    className={cn(
                      'mobile-list-item w-full touch-manipulation',
                      isActive && 'bg-accent text-accent-foreground',
                    )}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t border-border/60 bg-muted/30 p-4 space-y-3">
            {/* Modo offline indicator */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-background/50">
              {isOffline ? (
                <>
                  <WifiOff className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Modo offline</span>
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">En línea</span>
                </>
              )}
            </div>

            {/* Versión de la app */}
            <p className="px-2 text-xs text-muted-foreground text-center">
              Collector v1.0.0
            </p>

            {/* Logout */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive touch-manipulation"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileDrawer

