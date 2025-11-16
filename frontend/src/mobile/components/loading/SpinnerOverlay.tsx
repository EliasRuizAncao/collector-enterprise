import { ReactNode } from 'react'
import { Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { fadeIn, getReducedMotionVariants } from '../../utils/animations'
import { Button } from '@/shared/components/ui/button'

interface SpinnerOverlayProps {
  /**
   * Si el overlay está visible
   */
  isVisible: boolean
  /**
   * Mensaje opcional a mostrar
   */
  message?: string
  /**
   * Si mostrar botón de cerrar
   */
  showCloseButton?: boolean
  /**
   * Callback cuando se cierra
   */
  onClose?: () => void
  /**
   * Clase adicional
   */
  className?: string
  /**
   * Si permitir interacción (default: false)
   */
  allowInteraction?: boolean
}

/**
 * SpinnerOverlay - Overlay de pantalla completa con spinner
 * Full screen overlay con backdrop semi-transparente
 * Spinner centrado con mensaje opcional
 * No permite interacción por defecto
 */
export const SpinnerOverlay = ({
  isVisible,
  message,
  showCloseButton = false,
  onClose,
  className,
  allowInteraction = false,
}: SpinnerOverlayProps) => {
  const variants = getReducedMotionVariants(fadeIn)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            !allowInteraction && 'pointer-events-auto',
            allowInteraction && 'pointer-events-none',
            className
          )}
          onClick={!allowInteraction ? (e) => e.stopPropagation() : undefined}
        >
          {/* Backdrop semi-transparente */}
          <div
            className={cn(
              'absolute inset-0 bg-background/80 backdrop-blur-sm',
              !allowInteraction && 'pointer-events-auto',
              allowInteraction && 'pointer-events-none'
            )}
            onClick={!allowInteraction ? (e) => e.stopPropagation() : undefined}
          />

          {/* Contenido centrado */}
          <div className="relative z-10 flex flex-col items-center gap-4 rounded-lg bg-card p-6 shadow-lg">
            {showCloseButton && onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Spinner */}
            <Loader2 className="h-8 w-8 animate-spin text-primary" />

            {/* Mensaje */}
            {message && (
              <p className="text-sm font-medium text-foreground max-w-xs text-center">
                {message}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

