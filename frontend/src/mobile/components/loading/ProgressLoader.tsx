import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { Progress } from '@/shared/components/ui/progress'
import { fadeIn, getReducedMotionVariants } from '../../utils/animations'

interface ProgressLoaderProps {
  /**
   * Porcentaje de progreso (0-100)
   */
  progress: number
  /**
   * Mensaje de progreso opcional
   */
  message?: string
  /**
   * Si mostrar porcentaje
   */
  showPercentage?: boolean
  /**
   * Clase adicional
   */
  className?: string
  /**
   * Variante de estilo
   */
  variant?: 'default' | 'success' | 'warning' | 'error'
}

/**
 * ProgressLoader - Barra de progreso con porcentaje
 * Para uploads/downloads y operaciones con progreso
 * Muestra mensaje y porcentaje opcionales
 */
export const ProgressLoader = ({
  progress,
  message,
  showPercentage = true,
  className,
  variant = 'default',
}: ProgressLoaderProps) => {
  const variants = getReducedMotionVariants(fadeIn)

  // Asegurar que el progreso esté entre 0 y 100
  const clampedProgress = Math.max(0, Math.min(100, progress))

  const variantClasses = {
    default: '',
    success: '[&>div]:bg-green-500',
    warning: '[&>div]:bg-yellow-500',
    error: '[&>div]:bg-red-500',
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      className={cn('w-full space-y-2', className)}
    >
      {/* Header con mensaje y porcentaje */}
      {(message || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {message && (
            <span className="text-muted-foreground font-medium">
              {message}
            </span>
          )}
          {showPercentage && (
            <span className="text-muted-foreground font-medium">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      {/* Barra de progreso */}
      <Progress
        value={clampedProgress}
        className={cn('h-2', variantClasses[variant])}
      />
    </motion.div>
  )
}

