import { ReactNode } from 'react'
import { motion, AnimatePresence, HTMLMotionProps, Variants } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { useNavigationDirection } from '../../hooks/useNavigationDirection'
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation'
import {
  pageTransitionForward,
  pageTransitionBackward,
  pageTransitionFade,
  slideInFromBottom,
  getReducedMotionVariants,
  prefersReducedMotion,
} from '../../utils/animations'

interface PageTransitionProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  /**
   * Tipo de transición forzado (sobrescribe detección automática)
   */
  transitionType?: 'push' | 'pop' | 'fade' | 'modal'
  /**
   * Si habilitar swipe navigation (default: true)
   */
  enableSwipeNavigation?: boolean
  className?: string
}

/**
 * Variantes de transición basados en dirección
 */
const pageVariants: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
    opacity: direction === 0 ? 0 : 1,
  }),
  animate: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : direction < 0 ? '100%' : 0,
    opacity: direction === 0 ? 0 : 1,
  }),
}

/**
 * Variantes para modales (desde bottom)
 */
const modalVariants = getReducedMotionVariants(slideInFromBottom)

/**
 * Variantes para fade (tabs, replace)
 */
const fadeVariants = getReducedMotionVariants(pageTransitionFade)

/**
 * Componente PageTransition
 * Wrapper para páginas con transiciones suaves
 * Detecta dirección de navegación automáticamente y aplica animación apropiada
 * Soporta gestos de swipe para navegación back (iOS style)
 */
export const PageTransition = ({
  children,
  transitionType: forcedTransitionType,
  enableSwipeNavigation = true,
  className,
  ...props
}: PageTransitionProps) => {
  const location = useLocation()
  const { direction, transitionType: detectedTransitionType } = useNavigationDirection()
  const swipeHandlers = useSwipeNavigation({ enabled: enableSwipeNavigation })
  
  // Usar tipo forzado o detectado
  const transitionType = forcedTransitionType || detectedTransitionType
  const reducedMotion = prefersReducedMotion()

  // Determinar variantes según tipo de transición
  let variants: Variants = fadeVariants
  let custom: number = 0

  switch (transitionType) {
    case 'push':
      variants = getReducedMotionVariants(pageVariants)
      custom = 1 // forward
      break
    case 'pop':
      variants = getReducedMotionVariants(pageVariants)
      custom = -1 // backward
      break
    case 'modal':
      variants = modalVariants
      break
    case 'fade':
    default:
      variants = fadeVariants
      break
  }

  // No animación si reduce motion está activado o si es splash
  if (reducedMotion || location.pathname === '/' || location.pathname === '/login') {
    return (
      <div 
        className={cn('w-full h-full', className)}
        style={{ 
          touchAction: enableSwipeNavigation ? 'pan-y' : 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      {...swipeHandlers}
      className={cn('w-full h-full relative', className)}
      style={{ 
        touchAction: enableSwipeNavigation ? 'pan-y' : 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      {...props}
    >
      <AnimatePresence mode="wait" custom={custom}>
        <motion.div
          key={location.pathname}
          custom={custom}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

