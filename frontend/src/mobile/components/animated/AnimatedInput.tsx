import { forwardRef, useState, FocusEvent } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { scaleIn, shake, bounce } from '../../utils/animations'
import { Input, InputProps } from '@/shared/components/ui/input'

interface AnimatedInputProps extends InputProps {
  success?: boolean
  error?: boolean
  errorMessage?: string
  showFeedback?: boolean
}

/**
 * Input animado con feedback visual en focus, success y error
 */
export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  (
    {
      success,
      error,
      errorMessage,
      showFeedback = true,
      className,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    return (
      <div className="w-full">
        <motion.div
          variants={error ? shake : success && showFeedback ? bounce : undefined}
          animate={error || (success && showFeedback) ? 'animate' : undefined}
          className="relative"
        >
          <Input
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'transition-all duration-200',
              isFocused && 'ring-2 ring-primary ring-offset-2',
              error && 'border-red-500 focus:ring-red-500',
              success && showFeedback && 'border-green-500 focus:ring-green-500',
              className
            )}
            {...props}
          />
          
          {success && showFeedback && (
            <motion.div
              initial="initial"
              animate="animate"
              variants={scaleIn}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
          )}
        </motion.div>
        
        {error && errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1 text-sm text-red-500"
          >
            {errorMessage}
          </motion.p>
        )}
      </div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'

