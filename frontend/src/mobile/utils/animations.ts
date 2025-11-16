import { Variants, Transition } from 'framer-motion'

/**
 * Sistema de animaciones consistente para mobile
 * Optimizado para performance (GPU) y respeta preferencias de usuario
 */

// ============================================
// FADE ANIMATIONS
// ============================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.2 },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
}

// ============================================
// SLIDE ANIMATIONS
// ============================================

export const slideInFromBottom: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
  transition: { type: 'spring', damping: 25, stiffness: 200 },
}

export const slideInFromTop: Variants = {
  initial: { y: '-100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '-100%', opacity: 0 },
  transition: { type: 'spring', damping: 25, stiffness: 200 },
}

export const slideInFromRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: { type: 'spring', damping: 25, stiffness: 200 },
}

export const slideInFromLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
  transition: { type: 'spring', damping: 25, stiffness: 200 },
}

// ============================================
// SCALE ANIMATIONS
// ============================================

export const scaleIn: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  transition: { duration: 0.2 },
}

export const scaleInCenter: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  transition: { type: 'spring', damping: 20, stiffness: 300 },
}

// ============================================
// LIST ANIMATIONS (STAGGER)
// ============================================

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
}

export const staggerItemHorizontal: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
}

// ============================================
// INTERACTIVE ANIMATIONS
// ============================================

export const tapScale = {
  whileTap: { scale: 0.95 },
  transition: { duration: 0.1 },
}

export const tapScaleLight = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.1 },
}

export const swipeable = {
  drag: 'x' as const,
  dragConstraints: { left: -100, right: 100 },
  dragElastic: 0.2,
}

export const swipeableFull = {
  drag: 'x' as const,
  dragConstraints: { left: -300, right: 300 },
  dragElastic: 0.1,
}

export const longPress = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.5 },
}

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransitionForward: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
  transition: { type: 'tween', duration: 0.3, ease: 'easeInOut' },
}

export const pageTransitionBackward: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: { type: 'tween', duration: 0.3, ease: 'easeInOut' },
}

export const pageTransitionFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

// ============================================
// MICRO-INTERACTIONS
// ============================================

export const bounce: Variants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },
}

export const shake: Variants = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
}

export const pulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const bounceIn: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 15,
    },
  },
}

// ============================================
// SKELETON LOADERS
// ============================================

export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['0% 0%', '100% 0%'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

export const skeletonPulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ============================================
// PULL-TO-REFRESH
// ============================================

/**
 * Funciones para calcular animaciones de pull-to-refresh
 */
export const getPullRotate = (distance: number): number => {
  return Math.min(distance * 0.5, 180)
}

export const getPullScale = (distance: number): number => {
  return 1 + Math.min(distance * 0.001, 0.1)
}

export const pullToRefreshRelease: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

export const pullToRefreshComplete: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0],
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

// ============================================
// TRANSITION PRESETS
// ============================================

export const springTransition: Transition = {
  type: 'spring',
  damping: 25,
  stiffness: 200,
}

export const smoothTransition: Transition = {
  type: 'tween',
  duration: 0.3,
  ease: 'easeInOut',
}

export const fastTransition: Transition = {
  type: 'tween',
  duration: 0.15,
  ease: 'easeOut',
}

export const slowTransition: Transition = {
  type: 'tween',
  duration: 0.5,
  ease: 'easeInOut',
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Detecta si el usuario prefiere movimiento reducido
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Obtiene variantes de animación respetando preferencias del usuario
 */
export const getReducedMotionVariants = <T extends Variants>(variants: T): T => {
  if (prefersReducedMotion()) {
    return {
      ...variants,
      animate: {
        ...variants.animate,
        transition: { duration: 0.01 },
      },
      exit: {
        ...variants.exit,
        transition: { duration: 0.01 },
      },
    } as T
  }
  return variants
}

/**
 * Detecta si es un dispositivo de baja potencia (heurística simple)
 */
export const isLowEndDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false
  
  // Detectar por hardwareConcurrency (núcleos de CPU)
  const cores = navigator.hardwareConcurrency || 4
  if (cores < 4) return true
  
  // Detectar por memoria (si disponible)
  const memory = (navigator as any).deviceMemory
  if (memory && memory < 4) return true
  
  return false
}

/**
 * Obtiene configuración de animación basada en preferencias y dispositivo
 */
export const getAnimationConfig = () => {
  const reducedMotion = prefersReducedMotion()
  const lowEnd = isLowEndDevice()
  
  return {
    enabled: !reducedMotion && !lowEnd,
    duration: reducedMotion || lowEnd ? 0.01 : undefined,
    reduceAnimations: reducedMotion || lowEnd,
  }
}

