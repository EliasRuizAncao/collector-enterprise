import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Opciones para el hook usePullToRefresh
 */
interface UsePullToRefreshOptions {
  /**
   * Función async que se ejecuta al hacer refresh
   */
  onRefresh: () => Promise<void> | void
  /**
   * Si true, deshabilita el pull-to-refresh
   */
  disabled?: boolean
  /**
   * Distancia en pixels para activar el refresh (default: 80px)
   */
  threshold?: number
  /**
   * Si true, muestra feedback háptico al alcanzar el threshold
   */
  hapticFeedback?: boolean
}

/**
 * Retorno del hook usePullToRefresh
 */
interface UsePullToRefreshReturn {
  /**
   * Si true, el usuario está tirando hacia abajo
   */
  isPulling: boolean
  /**
   * Si true, está ejecutando el refresh
   */
  refreshing: boolean
  /**
   * Distancia actual del pull en pixels
   */
  pullDistance: number
  /**
   * Props para aplicar al contenedor
   */
  containerProps: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
  }
}

/**
 * Hook personalizado para pull-to-refresh en mobile
 * Detecta gesto de tirar hacia abajo y ejecuta función de refresh
 * Inspirado en Instagram y Twitter mobile
 */
export const usePullToRefresh = ({
  onRefresh,
  disabled = false,
  threshold = 80,
  hapticFeedback = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn => {
  const [isPulling, setIsPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const touchStartY = useRef<number>(0)
  const startScrollTop = useRef<number>(0)
  const animationFrameId = useRef<number | null>(null)
  const hasReachedThreshold = useRef<boolean>(false)
  const isTouchDevice = useRef<boolean>(false)

  // Detectar si es un dispositivo táctil
  useEffect(() => {
    isTouchDevice.current =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - navigator.msMaxTouchPoints existe en IE/Edge antiguos
      (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
  }, [])

  // Función para animar el pull distance suavemente
  const animatePull = useCallback((distance: number) => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
    }

    animationFrameId.current = requestAnimationFrame(() => {
      setPullDistance(distance)

      // Feedback háptico al alcanzar el threshold
      if (hapticFeedback && distance >= threshold && !hasReachedThreshold.current) {
        hasReachedThreshold.current = true
        if ('vibrate' in navigator) {
          navigator.vibrate(20) // Vibración corta al alcanzar threshold
        }
      } else if (distance < threshold) {
        hasReachedThreshold.current = false
      }
    })
  }, [threshold, hapticFeedback])

  // Manejar inicio del touch
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || refreshing || !isTouchDevice.current) return

      const touch = e.touches[0]
      touchStartY.current = touch.clientY
      startScrollTop.current = window.scrollY || document.documentElement.scrollTop

      // Solo activar si está en el top del scroll
      if (startScrollTop.current === 0) {
        setIsPulling(true)
        hasReachedThreshold.current = false
      }
    },
    [disabled, refreshing],
  )

  // Manejar movimiento del touch
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || refreshing || !isPulling || !isTouchDevice.current) return

      const touch = e.touches[0]
      const currentY = touch.clientY
      const distance = currentY - touchStartY.current

      // Solo permitir pull hacia abajo
      if (distance > 0 && window.scrollY === 0) {
        // Resistencia: hacer más difícil tirar después del threshold
        const resistance = distance > threshold ? 0.5 : 1
        const adjustedDistance = threshold + (distance - threshold) * resistance

        animatePull(Math.min(adjustedDistance, threshold * 2)) // Max 2x threshold

        // Prevenir scroll mientras tira
        e.preventDefault()
      } else if (distance <= 0) {
        // Si tira hacia arriba, resetear
        setIsPulling(false)
        animatePull(0)
      }
    },
    [disabled, refreshing, isPulling, threshold, animatePull],
  )

  // Manejar fin del touch
  const handleTouchEnd = useCallback(
    async () => {
      if (!isPulling || !isTouchDevice.current) return

      const shouldRefresh = pullDistance >= threshold && !disabled && !refreshing

      // Resetear estado de pulling
      setIsPulling(false)

      if (shouldRefresh) {
        // Ejecutar refresh
        setRefreshing(true)
        hasReachedThreshold.current = false

        try {
          await onRefresh()
        } catch (error) {
          console.error('Error en pull-to-refresh:', error)
        } finally {
          setRefreshing(false)
          // Animar pull distance a 0
          animatePull(0)
        }
      } else {
        // Animar pull distance a 0 sin refresh
        animatePull(0)
      }
    },
    [isPulling, pullDistance, threshold, disabled, refreshing, onRefresh, animatePull],
  )

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [])

  // Resetear pull distance cuando termine el refreshing
  useEffect(() => {
    if (!refreshing && pullDistance > 0) {
      const timer = setTimeout(() => {
        animatePull(0)
      }, 300) // Delay para animación suave

      return () => clearTimeout(timer)
    }
  }, [refreshing, pullDistance, animatePull])

  return {
    isPulling,
    refreshing,
    pullDistance,
    containerProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

