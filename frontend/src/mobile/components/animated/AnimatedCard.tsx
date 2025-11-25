import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { type HTMLMotionProps } from '../../utils/animations'
import { cn } from '@/shared/lib/utils'
import { fadeIn, tapScale, swipeable, getReducedMotionVariants } from '../../utils/animations'

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  enableSwipe?: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

/**
 * Card animado con fade in, scale on tap y soporte para swipe gestures
 */
export const AnimatedCard = ({
  children,
  enableSwipe = false,
  onSwipeLeft,
  onSwipeRight,
  className,
  ...props
}: AnimatedCardProps) => {
  const variants = getReducedMotionVariants(fadeIn)

  const handleDragEnd = (event: any, info: any) => {
    if (!enableSwipe) return

    const threshold = 100
    const velocity = 500

    if (info.offset.x > threshold || info.velocity.x > velocity) {
      onSwipeRight?.()
    } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      onSwipeLeft?.()
    }
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      {...(enableSwipe ? swipeable : {})}
      {...tapScale}
      onDragEnd={handleDragEnd}
      className={cn('rounded-lg shadow-sm', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

