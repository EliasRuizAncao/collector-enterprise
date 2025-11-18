import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ClipboardList, Camera, User } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import { tapScale, bounceIn } from '../utils/animations'
import { useHaptics } from '../hooks/useHaptics'
import api from '@/shared/lib/api'

/**
 * Tipo para los items de bottom navigation
 */
interface BottomNavItem {
  id: string
  label: string
  to?: string
  icon: React.ComponentType<{ className?: string }>
  action?: () => void
  badge?: number | boolean
  showDot?: boolean
}

/**
 * Componente Bottom Navigation Bar
 * Navegación principal para la versión mobile
 * Diseño nativo inspirado en iOS y Android
 */
const BottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const haptics = useHaptics()
  const [pendingCount, setPendingCount] = useState(0)
  const [hasNotifications, setHasNotifications] = useState(false)

  // Cargar contador de tareas pendientes
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        // TODO: Reemplazar con endpoint real cuando esté disponible
        const response = await api.get('/assignments/stats')
        const data = response.data

        setPendingCount(data.pending || 0)
        setHasNotifications(data.notifications || false)
      } catch (error: any) {
        // En desarrollo, usar valores mock
        if (import.meta.env.DEV) {
          setPendingCount(3)
          setHasNotifications(false)
        }
        // Solo loggear errores que no sean 404 (endpoint no implementado aún)
        if (error?.response?.status !== 404) {
          console.error('Error loading pending count:', error)
        }
      }
    }

    loadPendingCount()
  }, [location.pathname])

  // Función para manejar tap con feedback háptico
  const handleTap = (callback: () => void) => {
    haptics.selection('bottom-nav')
    callback()
  }

  // Función para abrir cámara (modal en lugar de navegar)
  const handleCameraPress = () => {
    // TODO: Abrir modal de cámara cuando esté implementado
    // Por ahora, navegar a la página de cámara
    navigate('/mobile/camera')
  }

  // Verificar si la ruta está activa
  const isActiveRoute = (path?: string) => {
    if (!path) return false
    if (path === '/mobile/dashboard') {
      return location.pathname === path || location.pathname === '/mobile'
    }
    return location.pathname.startsWith(path)
  }

  // Items de navegación
  const navItems: BottomNavItem[] = [
    {
      id: 'home',
      label: 'Inicio',
      to: '/mobile/dashboard',
      icon: Home,
    },
    {
      id: 'tasks',
      label: 'Tareas',
      to: '/mobile/assignments',
      icon: ClipboardList,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'camera',
      label: 'Cámara',
      icon: Camera,
      action: handleCameraPress,
    },
    {
      id: 'profile',
      label: 'Perfil',
      to: '/mobile/profile',
      icon: User,
      showDot: hasNotifications,
    },
  ]

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal"
      data-tutorial="bottom-navigation"
      className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = isActiveRoute(item.to)
        const hasBadge = typeof item.badge === 'number' && item.badge > 0
        const showDot = item.showDot === true

        const handleClick = () => {
          if (item.action) {
            handleTap(item.action)
          } else if (item.to) {
            handleTap(() => navigate(item.to!))
          }
        }

        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={handleClick}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            {...tapScale}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors duration-200 touch-manipulation',
              // Ripple effect sutil
              'before:absolute before:inset-0 before:rounded-full before:bg-primary/10 before:opacity-0 before:transition-opacity before:duration-200',
              'active:before:opacity-100',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground active:text-foreground',
            )}
          >
            {/* Indicador activo superior */}
            {isActive && (
              <div className="absolute top-0 h-0.5 w-12 rounded-b-full bg-primary animate-in slide-in-from-top duration-200" />
            )}

            {/* Ícono */}
            <div className="relative">
              <Icon
                className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isActive ? 'scale-110' : 'scale-100',
                )}
              />

              {/* Badge numérico (tareas pendientes) */}
              {hasBadge && (
                <motion.div
                  initial="initial"
                  animate="animate"
                  variants={bounceIn}
                >
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] font-semibold"
                  >
                    {typeof item.badge === 'number' && item.badge > 9 ? '9+' : String(item.badge)}
                  </Badge>
                </motion.div>
              )}

              {/* Dot rojo (notificaciones) */}
              {showDot && !hasBadge && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive"
                />
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                'text-[10px] font-medium transition-all duration-200',
                isActive
                  ? 'scale-105 text-primary'
                  : 'scale-100 text-muted-foreground',
              )}
            >
              {item.label}
            </span>
          </motion.button>
        )
      })}
    </nav>
  )
}

export default BottomNav

