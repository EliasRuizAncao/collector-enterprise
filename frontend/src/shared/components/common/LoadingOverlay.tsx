import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, FileSpreadsheet, FileText, BarChart3 } from 'lucide-react'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  type?: 'default' | 'excel' | 'pdf' | 'generating'
}

/**
 * Componente de overlay de carga profesional
 * Muestra un overlay semitransparente con animaciones suaves
 */
const LoadingOverlay = ({ isLoading, message, type = 'default' }: LoadingOverlayProps) => {
  const getIcon = () => {
    switch (type) {
      case 'excel':
        return <FileSpreadsheet className="h-8 w-8 text-blue-600" />
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />
      case 'generating':
        return <BarChart3 className="h-8 w-8 text-primary" />
      default:
        return <Loader2 className="h-8 w-8 text-primary animate-spin" />
    }
  }

  const getMessage = () => {
    if (message) return message
    switch (type) {
      case 'excel':
        return 'Generando archivo Excel...'
      case 'pdf':
        return 'Generando archivo PDF...'
      default:
        return 'Cargando...'
    }
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col items-center justify-center gap-4 rounded-lg bg-card p-8 shadow-lg border"
          >
            <motion.div
              animate={
                type === 'default'
                  ? { rotate: 360 }
                  : type === 'generating'
                    ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }
                    : {
                        scale: [1, 1.1, 1],
                      }
              }
              transition={
                type === 'default'
                  ? { duration: 1, repeat: Infinity, ease: 'linear' }
                  : {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
            >
              {getIcon()}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm font-medium text-foreground"
            >
              {getMessage()}
            </motion.p>
            {(type === 'default' || type === 'generating') && (
              <motion.div
                className="flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoadingOverlay

