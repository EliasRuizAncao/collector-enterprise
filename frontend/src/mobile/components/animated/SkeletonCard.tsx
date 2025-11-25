import { motion } from 'framer-motion'
import { type HTMLMotionProps } from '../../utils/animations'
import { cn } from '@/shared/lib/utils'
import { shimmer, skeletonPulse, getReducedMotionVariants } from '../../utils/animations'

interface SkeletonCardProps extends HTMLMotionProps<'div'> {
  className?: string
  showShimmer?: boolean
  lines?: number
}

/**
 * Skeleton card con shimmer o pulse effect
 */
export const SkeletonCard = ({
  className,
  showShimmer = true,
  lines = 3,
  ...props
}: SkeletonCardProps) => {
  const shimmerVariants = getReducedMotionVariants(shimmer)
  const pulseVariants = getReducedMotionVariants(skeletonPulse)

  return (
    <motion.div
      className={cn(
        'rounded-lg bg-muted p-4',
        showShimmer && 'shimmer-bg',
        !showShimmer && 'animate-pulse',
        className
      )}
      {...(showShimmer ? shimmerVariants : pulseVariants)}
      animate={showShimmer ? 'animate' : 'animate'}
      {...props}
    >
      <div className="space-y-3">
        {/* Header line */}
        <div className={cn(
          'h-4 w-3/4 rounded',
          showShimmer ? 'bg-muted-foreground/20' : 'bg-muted-foreground/10'
        )} />
        
        {/* Body lines */}
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-3 rounded',
              showShimmer ? 'bg-muted-foreground/20' : 'bg-muted-foreground/10',
              index === lines - 1 && 'w-5/6'
            )}
          />
        ))}
      </div>
    </motion.div>
  )
}

