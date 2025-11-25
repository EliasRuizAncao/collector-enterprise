import { useCallback, useRef, useState, useEffect } from 'react'

/**
 * Tipos para feedback háptico
 */
export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

/**
 * Opciones para useSwipe
 */
interface UseSwipeOptions {
  /**
   * Callback cuando se detecta swipe izquierda
   */
  onSwipeLeft?: () => void
  /**
   * Callback cuando se detecta swipe derecha
   */
  onSwipeRight?: () => void
  /**
   * Callback cuando se detecta swipe arriba
   */
  onSwipeUp?: () => void
  /**
   * Callback cuando se detecta swipe abajo
   */
  onSwipeDown?: () => void
  /**
   * Distancia mínima en pixels para detectar swipe (default: 50px)
   */
  threshold?: number
  /**
   * Velocidad mínima en pixels/ms para detectar swipe rápido (default: 0.3)
   */
  velocityThreshold?: number
  /**
   * Si true, previene el comportamiento default del navegador
   */
  preventDefault?: boolean
}

/**
 * Opciones para useLongPress
 */
interface UseLongPressOptions {
  /**
   * Callback cuando se detecta long press
   */
  onLongPress: () => void
  /**
   * Delay en ms antes de activar long press (default: 500ms)
   */
  delay?: number
  /**
   * Si true, previene el context menu nativo
   */
  preventContextMenu?: boolean
  /**
   * Si true, muestra feedback háptico al activar
   */
  hapticFeedback?: boolean
}

/**
 * Opciones para useDoubleTap
 */
interface UseDoubleTapOptions {
  /**
   * Callback cuando se detecta double tap
   */
  onDoubleTap: () => void
  /**
   * Callback cuando se detecta single tap (opcional)
   */
  onSingleTap?: () => void
  /**
   * Delay máximo en ms entre taps para considerar double tap (default: 300ms)
   */
  delay?: number
  /**
   * Distancia máxima en pixels entre taps para considerar double tap (default: 10px)
   */
  distanceThreshold?: number
}

/**
 * Retorno del hook useSwipe
 */
interface UseSwipeReturn {
  /**
   * Props para aplicar al elemento
   */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
  }
  /**
   * Estado actual del swipe
   */
  isSwiping: boolean
  /**
   * Dirección actual del swipe (si está en progreso)
   */
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null
}

/**
 * Retorno del hook useLongPress
 */
interface UseLongPressReturn {
  /**
   * Props para aplicar al elemento
   */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onContextMenu?: (e: React.MouseEvent) => void
  }
  /**
   * Si true, el long press está activo
   */
  isLongPressing: boolean
}

/**
 * Retorno del hook useDoubleTap
 */
interface UseDoubleTapReturn {
  /**
   * Props para aplicar al elemento
   */
  handlers: {
    onClick: (e: React.MouseEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
  }
}

/**
 * Utility para feedback háptico
 * Usa Vibration API si está disponible
 * Inspirado en patrones de iOS y Android
 */
export const hapticFeedback = (type: HapticFeedbackType = 'medium'): void => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return // Fallback silencioso si no está soportado
  }

  const patterns: Record<HapticFeedbackType, number | number[]> = {
    light: 10, // Vibración muy corta y suave
    medium: 20, // Vibración media
    heavy: 30, // Vibración más fuerte
    success: [20, 50, 20], // Patrón de éxito: vib-vib-vib
    warning: [30, 100, 30, 100, 30], // Patrón de advertencia
    error: [40, 80, 40, 80, 40], // Patrón de error
  }

  const pattern = patterns[type]
  navigator.vibrate(pattern)
}

/**
 * Utility para prevenir zoom con pinch
 * Útil en formularios y áreas interactivas
 */
export const preventZoom = (element: HTMLElement | null): (() => void) => {
  if (!element) return () => {}

  // Aplicar touch-action para prevenir zoom
  const originalTouchAction = element.style.touchAction
  element.style.touchAction = 'manipulation' // Previene pinch-zoom

  // También prevenir gestos de zoom con meta key
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault() // Previene pinch-zoom
    }
  }

  element.addEventListener('wheel', handleWheel, { passive: false })
  element.addEventListener('touchstart', handleTouchStart, { passive: false })

  // Cleanup function
  return () => {
    element.style.touchAction = originalTouchAction
    element.removeEventListener('wheel', handleWheel)
    element.removeEventListener('touchstart', handleTouchStart)
  }
}

/**
 * Hook para detectar swipe gestures en 4 direcciones
 * Detecta swipe left, right, up, down con threshold y velocidad
 */
export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
  preventDefault = true,
}: UseSwipeOptions = {}): UseSwipeReturn => {
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
      touchStartTime.current = Date.now()
      setIsSwiping(false)
      setSwipeDirection(null)
    },
    [],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartX.current
      const deltaY = touch.clientY - touchStartY.current
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Solo activar si se ha movido una distancia mínima
      if (distance > 10) {
        setIsSwiping(true)

        // Determinar dirección dominante
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          setSwipeDirection(deltaX > 0 ? 'right' : 'left')
        } else {
          setSwipeDirection(deltaY > 0 ? 'down' : 'up')
        }

        if (preventDefault) {
          e.preventDefault()
        }
      }
    },
    [preventDefault],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartX.current || !touchStartY.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartX.current
      const deltaY = touch.clientY - touchStartY.current
      const deltaTime = Date.now() - touchStartTime.current
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const velocity = distance / deltaTime

      // Resetear estado
      setIsSwiping(false)
      setSwipeDirection(null)
      touchStartX.current = 0
      touchStartY.current = 0
      touchStartTime.current = 0

      // Verificar si cumple threshold de distancia o velocidad
      if (distance >= threshold || (velocity >= velocityThreshold && distance >= threshold * 0.5)) {
        // Determinar dirección final
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) {
            onSwipeRight?.()
          } else {
            onSwipeLeft?.()
          }
        } else {
          if (deltaY > 0) {
            onSwipeDown?.()
          } else {
            onSwipeUp?.()
          }
        }
      }
    },
    [threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, swipeDirection],
  )

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwiping,
    swipeDirection,
  }
}

/**
 * Hook para detectar long press (press & hold)
 * Detecta cuando el usuario mantiene presionado por un tiempo determinado
 */
export const useLongPress = ({
  onLongPress,
  delay = 500,
  preventContextMenu = true,
  hapticFeedback: useHaptic = true,
}: UseLongPressOptions): UseLongPressReturn => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const touchStartPosition = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      touchStartPosition.current = { x: touch.clientX, y: touch.clientY }

      // Iniciar timer para long press
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true)
        if (useHaptic) {
          hapticFeedback('medium')
        }
        onLongPress()
      }, delay)
    },
    [onLongPress, delay, useHaptic],
  )

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPosition.current) return

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPosition.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPosition.current.y)
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Cancelar long press si el usuario se mueve más de 10px
    if (distance > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      setIsLongPressing(false)
      touchStartPosition.current = null
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setIsLongPressing(false)
    touchStartPosition.current = null
  }, [])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (preventContextMenu) {
        e.preventDefault()
      }
    },
    [preventContextMenu],
  )

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onContextMenu: preventContextMenu ? handleContextMenu : undefined,
    },
    isLongPressing,
  }
}

/**
 * Hook para detectar double tap
 * Distingue entre single tap y double tap
 */
export const useDoubleTap = ({
  onDoubleTap,
  onSingleTap,
  delay = 300,
  distanceThreshold = 10,
}: UseDoubleTapOptions): UseDoubleTapReturn => {
  const lastTapTime = useRef<number>(0)
  const lastTapPosition = useRef<{ x: number; y: number } | null>(null)
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTap = useCallback(
    (x: number, y: number) => {
      const currentTime = Date.now()
      const timeDiff = currentTime - lastTapTime.current

      if (lastTapPosition.current) {
        const distance = Math.sqrt(
          Math.pow(x - lastTapPosition.current.x, 2) + Math.pow(y - lastTapPosition.current.y, 2),
        )

        // Verificar si es double tap (dentro del delay y distancia threshold)
        if (timeDiff < delay && distance < distanceThreshold) {
          // Es double tap
          if (singleTapTimer.current) {
            clearTimeout(singleTapTimer.current)
            singleTapTimer.current = null
          }
          onDoubleTap()
          lastTapTime.current = 0
          lastTapPosition.current = null
          return
        }
      }

      // No es double tap, podría ser single tap
      lastTapTime.current = currentTime
      lastTapPosition.current = { x, y }

      // Esperar para ver si viene un segundo tap
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current)
      }

      singleTapTimer.current = setTimeout(() => {
        // Es single tap después del delay
        onSingleTap?.()
        lastTapTime.current = 0
        lastTapPosition.current = null
        singleTapTimer.current = null
      }, delay)
    },
    [onDoubleTap, onSingleTap, delay, distanceThreshold],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      handleTap(e.clientX, e.clientY)
    },
    [handleTap],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0]
      handleTap(touch.clientX, touch.clientY)
    },
    [handleTap],
  )

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current)
      }
    }
  }, [])

  return {
    handlers: {
      onClick: handleClick,
      onTouchEnd: handleTouchEnd,
    },
  }
}

