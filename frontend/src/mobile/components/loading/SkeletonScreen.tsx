import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { SkeletonCard } from '../animated/SkeletonCard'
import { fadeIn, getReducedMotionVariants } from '../../utils/animations'

interface SkeletonScreenProps {
  /**
   * Si mostrar skeleton del header
   */
  showHeader?: boolean
  /**
   * Número de cards a mostrar
   */
  cardCount?: number
  /**
   * Clase adicional
   */
  className?: string
  /**
   * Si mostrar shimmer effect
   */
  showShimmer?: boolean
}

/**
 * SkeletonScreen - Skeleton de página completa
 * Header + contenido con shimmer effect
 * Para loading states iniciales de páginas
 */
export const SkeletonScreen = ({
  showHeader = true,
  cardCount = 5,
  className,
  showShimmer = true,
}: SkeletonScreenProps) => {
  const variants = getReducedMotionVariants(fadeIn)

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      className={cn('w-full space-y-4', className)}
    >
      {/* Header Skeleton */}
      {showHeader && (
        <div className="space-y-3 border-b border-border pb-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      )}

      {/* Content Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <SkeletonCard
            key={index}
            showShimmer={showShimmer}
            className="h-32"
            lines={3}
          />
        ))}
      </div>
    </motion.div>
  )
}

