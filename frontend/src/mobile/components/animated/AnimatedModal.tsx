import { ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { slideInFromBottom, fadeIn, getReducedMotionVariants } from '../../utils/animations'

interface AnimatedModalProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  showBackdrop?: boolean
  className?: string
  backdropClassName?: string
  contentClassName?: string
}

/**
 * Modal animado que se desliza desde abajo con backdrop fade
 */
export const AnimatedModal = ({
  children,
  isOpen,
  onClose,
  showBackdrop = true,
  className,
  backdropClassName,
  contentClassName,
  ...props
}: AnimatedModalProps) => {
  const backdropVariants = getReducedMotionVariants(fadeIn)
  const contentVariants = getReducedMotionVariants(slideInFromBottom)

  if (!isOpen) return null

  return (
    <div className={cn('fixed inset-0 z-50 flex items-end', className)} {...props}>
      {/* Backdrop */}
      {showBackdrop && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={backdropVariants}
          onClick={onClose}
          className={cn(
            'absolute inset-0 bg-black/50 backdrop-blur-sm',
            backdropClassName
          )}
        />
      )}

      {/* Content */}
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={contentVariants}
        className={cn(
          'relative z-10 w-full max-h-[90vh] overflow-auto bg-white rounded-t-2xl shadow-2xl',
          'safe-top safe-bottom',
          contentClassName
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  )
}

