import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { fadeIn, bounceIn, getReducedMotionVariants, type HTMLMotionProps } from '../utils/animations'

export interface EmptyStateProps extends HTMLMotionProps<'div'> {
  /**
   * Icono a mostrar (ReactNode)
   */
  icon?: ReactNode
  /**
   * Título del empty state (opcional si se usa componente específico)
   */
  title?: string
  /**
   * Descripción opcional
   */
  description?: string
  /**
   * Acción opcional con label y onClick
   */
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'ghost'
  }
  /**
   * URL de ilustración opcional
   */
  illustration?: string
  /**
   * Variante de tamaño (default: 'full')
   */
  variant?: 'full' | 'inline' | 'compact'
  /**
   * Clase adicional
   */
  className?: string
}

/**
 * Componente EmptyState genérico
 * Layout centrado vertical y horizontal
 * Icon/Ilustración arriba (grande)
 * Título y descripción
 * Botón de acción opcional
 * Padding generoso
 * Animaciones: Fade in al aparecer, bounce sutil en icono
 */
export const EmptyState = ({
  icon,
  title,
  description,
  action,
  illustration,
  variant = 'full',
  className,
  ...props
}: EmptyStateProps) => {
  const fadeVariants = getReducedMotionVariants(fadeIn)
  const bounceVariants = getReducedMotionVariants(bounceIn)

  const variantClasses = {
    full: 'min-h-[60vh] py-16 px-4',
    inline: 'min-h-[40vh] py-12 px-4',
    compact: 'min-h-[200px] py-8 px-4',
  }

  const iconSizeClasses = {
    full: 'h-24 w-24',
    inline: 'h-16 w-16',
    compact: 'h-12 w-12',
  }

  const titleSizeClasses = {
    full: 'text-lg font-semibold',
    inline: 'text-base font-semibold',
    compact: 'text-sm font-medium',
  }

  const descriptionSizeClasses = {
    full: 'text-sm',
    inline: 'text-xs',
    compact: 'text-xs',
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeVariants}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {/* Icono o Ilustración */}
      {illustration ? (
        <motion.img
          src={illustration}
          alt={title}
          className={cn('mb-6', iconSizeClasses[variant])}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
      ) : icon ? (
        <motion.div
          className={cn(
            'mb-6 text-muted-foreground flex items-center justify-center',
            iconSizeClasses[variant]
          )}
          variants={bounceVariants}
          initial="initial"
          animate="animate"
        >
          {icon}
        </motion.div>
      ) : null}

      {/* Título */}
      {title && (
        <motion.h3
          className={cn(
            'mb-2 text-foreground font-semibold',
            titleSizeClasses[variant]
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {title}
        </motion.h3>
      )}

      {/* Descripción */}
      {description && (
        <motion.p
          className={cn(
            'mb-6 max-w-sm text-muted-foreground',
            descriptionSizeClasses[variant]
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {description}
        </motion.p>
      )}

      {/* Acción */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Button
            variant={action.variant || 'default'}
            size={variant === 'compact' ? 'sm' : 'default'}
            onClick={action.onClick}
            className="touch-manipulation"
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

