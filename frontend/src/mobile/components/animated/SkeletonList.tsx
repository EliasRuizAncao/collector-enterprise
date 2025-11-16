import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { staggerContainer, staggerItem, getReducedMotionVariants } from '../../utils/animations'
import { SkeletonCard } from './SkeletonCard'

interface SkeletonListProps extends HTMLMotionProps<'div'> {
  count?: number
  className?: string
  itemClassName?: string
  showShimmer?: boolean
}

/**
 * Lista de skeleton cards con stagger effect
 */
export const SkeletonList = ({
  count = 5,
  className,
  itemClassName,
  showShimmer = true,
  ...props
}: SkeletonListProps) => {
  const containerVariants = getReducedMotionVariants(staggerContainer)
  const itemVariants = getReducedMotionVariants(staggerItem)

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      className={cn('space-y-3', className)}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          className={itemClassName}
        >
          <SkeletonCard showShimmer={showShimmer} />
        </motion.div>
      ))}
    </motion.div>
  )
}

