import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface PageLoaderProps {
  message?: string
  icon?: ReactNode
  fullScreen?: boolean
  className?: string
}

/**
 * Componente de loading animado para páginas principales
 * Muestra un spinner animado con mensaje personalizable
 */
const PageLoader = ({ message = 'Cargando...', icon, fullScreen = true, className }: PageLoaderProps) => {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="relative"
      >
        {icon || <Loader2 className="h-12 w-12 text-primary" />}
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-medium text-muted-foreground"
      >
        {message}
      </motion.p>
      {/* Puntos animados */}
      <motion.div
        className="flex gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

export default PageLoader

