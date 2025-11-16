import { RefreshCw, ArrowDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { 
  getPullRotate,
  getPullScale,
  pullToRefreshRelease, 
  pullToRefreshComplete,
  getReducedMotionVariants 
} from '../utils/animations'

/**
 * Props del componente RefreshIndicator
 */
interface RefreshIndicatorProps {
  /**
   * Distancia actual del pull en pixels
   */
  pullDistance: number
  /**
   * Si true, está ejecutando el refresh
   */
  refreshing: boolean
  /**
   * Si true, refresh completado
   */
  completed?: boolean
  /**
   * Distancia threshold para activar (default: 80px)
   */
  threshold?: number
}

/**
 * Componente RefreshIndicator
 * Muestra indicador visual del estado de pull-to-refresh
 * Con animaciones suaves: Pull (rotate arrow), Release (spin), Complete (check + fade)
 * Inspirado en Instagram y Twitter mobile
 */
const RefreshIndicator = ({
  pullDistance,
  refreshing,
  completed = false,
  threshold = 80,
}: RefreshIndicatorProps) => {
  const isVisible = pullDistance > 0 || refreshing || completed
  const shouldRotate = pullDistance >= threshold || refreshing
  const opacity = Math.min(pullDistance / threshold, 1)
  
  const releaseVariants = getReducedMotionVariants(pullToRefreshRelease)
  const completeVariants = getReducedMotionVariants(pullToRefreshComplete)

  if (!isVisible) return null

  return (
    <motion.div
      className={cn(
        'absolute left-1/2 top-0 z-50 -translate-x-1/2',
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: completed ? 0 : opacity,
        y: completed ? -20 : Math.min(pullDistance, threshold * 1.5),
      }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col items-center gap-2 rounded-full bg-background/90 p-3 shadow-lg backdrop-blur-md">
        <AnimatePresence mode="wait">
          {completed ? (
            <motion.div
              key="complete"
              variants={completeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Check className="h-6 w-6 text-green-500" />
            </motion.div>
          ) : refreshing ? (
            <motion.div
              key="refreshing"
              variants={releaseVariants}
              animate="animate"
            >
              <RefreshCw className="h-6 w-6 text-primary" />
            </motion.div>
          ) : (
            <motion.div
              key="pulling"
              animate={{
                rotate: getPullRotate(pullDistance),
                scale: getPullScale(pullDistance),
              }}
              transition={{ duration: 0.1 }}
            >
              <ArrowDown className="h-6 w-6 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.span 
          className="text-xs font-medium text-muted-foreground"
          animate={{ opacity }}
        >
          {refreshing 
            ? 'Actualizando...' 
            : completed
            ? 'Actualizado'
            : shouldRotate 
            ? 'Suelta para actualizar' 
            : 'Tira para actualizar'}
        </motion.span>
      </div>
    </motion.div>
  )
}

export default RefreshIndicator

