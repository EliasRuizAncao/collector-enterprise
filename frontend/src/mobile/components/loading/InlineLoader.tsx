import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { fadeIn, getReducedMotionVariants } from '../../utils/animations'

interface InlineLoaderProps {
  /**
   * Texto a mostrar junto al spinner
   */
  text?: string
  /**
   * Tamaño del spinner (default: 'sm')
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /**
   * Si mostrar solo el spinner sin texto
   */
  spinnerOnly?: boolean
  /**
   * Clase adicional
   */
  className?: string
  /**
   * Alineación del contenido
   */
  align?: 'left' | 'center' | 'right'
}

/**
 * InlineLoader - Spinner pequeño inline con texto opcional
 * Ej: "Cargando..." junto al spinner
 * Útil para loading states inline en la UI
 */
export const InlineLoader = ({
  text = 'Cargando...',
  size = 'sm',
  spinnerOnly = false,
  className,
  align = 'left',
}: InlineLoaderProps) => {
  const variants = getReducedMotionVariants(fadeIn)

  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      className={cn(
        'flex items-center gap-2',
        alignClasses[align],
        className
      )}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {!spinnerOnly && text && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {text}
        </span>
      )}
    </motion.div>
  )
}

