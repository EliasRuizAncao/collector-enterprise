/**
 * Coach Mark - Indicador contextual con flecha
 * Aparece una vez por sesión para guiar al usuario
 */

import { useState, useEffect, useRef } from 'react'
import { X, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import {
  canShowCoachMark,
  markCoachMarkShown,
} from '../utils/tutorialManager'

/**
 * Props del Coach Mark
 */
interface CoachMarkProps {
  /** ID único del coach mark */
  id: string
  /** Mensaje a mostrar */
  message: string
  /** Selector CSS del elemento objetivo */
  target: string
  /** Posición relativa al elemento */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Si está activo */
  active?: boolean
  /** Callback cuando se cierra */
  onDismiss?: () => void
  /** Si se cierra automáticamente al usar el elemento */
  dismissOnUse?: boolean
}

/**
 * Componente Coach Mark
 */
export const CoachMark = ({
  id,
  message,
  target,
  position = 'bottom',
  active = true,
  onDismiss,
  dismissOnUse = true,
}: CoachMarkProps) => {
  const [visible, setVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const targetElementRef = useRef<HTMLElement | null>(null)

  // Verificar si se puede mostrar
  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }

    if (!canShowCoachMark(id)) {
      setVisible(false)
      return
    }

    const element = document.querySelector(target) as HTMLElement
    if (element) {
      targetElementRef.current = element
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)
      setVisible(true)
      markCoachMarkShown(id)

      // Cerrar automáticamente si se usa el elemento
      if (dismissOnUse) {
        const handleClick = () => {
          setVisible(false)
          onDismiss?.()
        }
        element.addEventListener('click', handleClick, { once: true })
        return () => {
          element.removeEventListener('click', handleClick)
        }
      }
    } else {
      setVisible(false)
    }
  }, [active, id, target, dismissOnUse, onDismiss])

  // Actualizar posición en scroll/resize
  useEffect(() => {
    if (!visible || !targetElementRef.current) return

    const updatePosition = () => {
      if (targetElementRef.current) {
        const rect = targetElementRef.current.getBoundingClientRect()
        setTargetRect(rect)
      }
    }

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [visible])

  // Cerrar al hacer tap fuera
  useEffect(() => {
    if (!visible) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        targetElementRef.current &&
        !targetElementRef.current.contains(target) &&
        !target.closest('[data-coachmark]')
      ) {
        setVisible(false)
        onDismiss?.()
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [visible, onDismiss])

  if (!visible || !targetRect) return null

  // Calcular posición del tooltip
  const getTooltipStyle = () => {
    const padding = 12
    const arrowSize = 8

    switch (position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        }
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        }
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
          transform: 'translateY(-50%)',
        }
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: 'translateY(-50%)',
        }
    }
  }

  // Obtener ícono de flecha según posición
  const getArrowIcon = () => {
    switch (position) {
      case 'top':
        return <ArrowDown className="h-4 w-4" />
      case 'bottom':
        return <ArrowUp className="h-4 w-4" />
      case 'left':
        return <ArrowRight className="h-4 w-4" />
      case 'right':
        return <ArrowLeft className="h-4 w-4" />
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={getTooltipStyle()}
          className="absolute z-[9998] pointer-events-auto"
          data-coachmark
        >
          <div className="relative bg-primary text-primary-foreground rounded-lg shadow-xl p-4 max-w-xs">
            {/* Flecha */}
            <div
              className={cn(
                'absolute text-primary',
                position === 'top' && 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full',
                position === 'bottom' && 'top-0 left-1/2 -translate-x-1/2 -translate-y-full',
                position === 'left' && 'right-0 top-1/2 -translate-y-1/2 translate-x-full',
                position === 'right' && 'left-0 top-1/2 -translate-y-1/2 -translate-x-full',
              )}
            >
              {getArrowIcon()}
            </div>

            {/* Contenido */}
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{message}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => {
                  setVisible(false)
                  onDismiss?.()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

