import { ReactNode, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { tapScale, bounce, shake, pulse } from '../../utils/animations'
import { Button, ButtonProps } from '@/shared/components/ui/button'

interface AnimatedButtonProps extends ButtonProps {
  loading?: boolean
  success?: boolean
  error?: boolean
  children: ReactNode
}

/**
 * Botón animado con estados de loading, success y error
 */
export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ loading, success, error, children, className, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading

    // Determinar variantes según estado
    const variants = error ? shake : success ? bounce : undefined

    return (
      <motion.div
        variants={variants}
        animate={variants ? 'animate' : undefined}
        whileTap={isDisabled ? undefined : tapScale.whileTap}
        transition={tapScale.transition}
        className="inline-block"
      >
        <Button
          ref={ref}
          disabled={isDisabled}
          className={cn(
            'relative overflow-hidden',
            loading && 'cursor-wait',
            className
          )}
          {...props}
        >
          {loading && (
            <motion.div
              variants={pulse}
              animate="animate"
              className="absolute inset-0 flex items-center justify-center bg-inherit"
            >
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </motion.div>
          )}
          
          <span className={cn(loading && 'opacity-0')}>
            {children}
          </span>
        </Button>
      </motion.div>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

