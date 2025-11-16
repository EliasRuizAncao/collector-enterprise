import { useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface UseSwipeNavigationOptions {
  /**
   * Umbral de distancia para activar swipe (default: 50% de pantalla)
   */
  threshold?: number
  /**
   * Velocidad mínima para activar swipe rápido (default: 0.5)
   */
  velocityThreshold?: number
  /**
   * Si está habilitado (default: true)
   */
  enabled?: boolean
}

/**
 * Hook para gestos de swipe para navegación
 * Swipe desde borde izquierdo = back
 * Estilo iOS con threshold y velocity based
 */
export const useSwipeNavigation = (options: UseSwipeNavigationOptions = {}) => {
  const navigate = useNavigate()
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)
  const isSwiping = useRef<boolean>(false)
  const swipeDistance = useRef<number>(0)

  const {
    threshold = window.innerWidth * 0.5, // 50% de pantalla
    velocityThreshold = 0.5,
    enabled = true,
  } = options

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return

    const touch = e.touches[0]
    // Solo detectar swipe desde el borde izquierdo (primeros 20px)
    if (touch.clientX > 20) return

    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    touchStartTime.current = Date.now()
    isSwiping.current = true
    swipeDistance.current = 0
  }, [enabled])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !isSwiping.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = Math.abs(touch.clientY - touchStartY.current)

    // Solo permitir swipe horizontal (deltaY < deltaX)
    if (deltaY > Math.abs(deltaX)) {
      isSwiping.current = false
      return
    }

    // Solo swipe hacia la derecha (back navigation)
    if (deltaX < 0) {
      isSwiping.current = false
      return
    }

    swipeDistance.current = deltaX

    // Prevenir scroll si está haciendo swipe
    if (Math.abs(deltaX) > 10) {
      e.preventDefault()
    }
  }, [enabled])

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isSwiping.current) return

    const timeElapsed = Date.now() - touchStartTime.current
    const distance = swipeDistance.current
    const velocity = distance / timeElapsed

    // Determinar si se debe navegar back
    const shouldNavigate = 
      distance >= threshold || // Threshold alcanzado
      (distance > 50 && velocity > velocityThreshold) // Swipe rápido

    if (shouldNavigate) {
      navigate(-1)
    }

    // Reset
    isSwiping.current = false
    swipeDistance.current = 0
  }, [enabled, threshold, velocityThreshold, navigate])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}

