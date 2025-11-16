import { ReactNode, Children } from 'react'
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { staggerContainer, staggerItem, getReducedMotionVariants } from '../../utils/animations'

interface AnimatedListProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  enableStagger?: boolean
  className?: string
  keyExtractor?: (item: ReactNode, index: number) => string | number
}

/**
 * Lista animada con stagger effect y fade in sequence
 */
export const AnimatedList = ({
  children,
  enableStagger = true,
  className,
  keyExtractor,
  ...props
}: AnimatedListProps) => {
  const containerVariants = getReducedMotionVariants(staggerContainer)
  const itemVariants = getReducedMotionVariants(staggerItem)

  // Convertir children a array
  const childrenArray = Children.toArray(children)

  if (!enableStagger || childrenArray.length === 0) {
    return (
      <div className={cn(className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={containerVariants}
      className={cn(className)}
      {...props}
    >
      <AnimatePresence mode="popLayout">
        {childrenArray.map((child, index) => {
          const key = keyExtractor ? keyExtractor(child, index) : index
          
          return (
            <motion.div
              key={key}
              variants={itemVariants}
              layout
            >
              {child}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}

