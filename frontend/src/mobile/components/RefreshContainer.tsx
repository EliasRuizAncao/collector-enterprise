import { useRef } from 'react'

import { usePullToRefresh } from '../hooks/usePullToRefresh'
import RefreshIndicator from './RefreshIndicator'

/**
 * Props del componente RefreshContainer
 */
interface RefreshContainerProps {
  /**
   * Función async que se ejecuta al hacer refresh
   */
  onRefresh: () => Promise<void> | void
  /**
   * Si true, deshabilita el pull-to-refresh
   */
  disabled?: boolean
  /**
   * Distancia threshold para activar (default: 80px)
   */
  threshold?: number
  /**
   * Si true, muestra feedback háptico al alcanzar el threshold
   */
  hapticFeedback?: boolean
  /**
   * Contenido a envolver
   */
  children: React.ReactNode
  /**
   * Clases CSS adicionales
   */
  className?: string
}

/**
 * Componente RefreshContainer
 * Envuelve contenido y añade funcionalidad de pull-to-refresh
 * Solo visible y funcional en dispositivos móviles táctiles
 */
const RefreshContainer = ({
  onRefresh,
  disabled = false,
  threshold = 80,
  hapticFeedback = true,
  children,
  className,
}: RefreshContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isPulling, refreshing, pullDistance, containerProps } = usePullToRefresh({
    onRefresh,
    disabled,
    threshold,
    hapticFeedback,
  })

  // Detectar si es un dispositivo táctil
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - navigator.msMaxTouchPoints existe en IE/Edge antiguos
      (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0))

  // Si no es touch device, no aplicar eventos touch
  const touchProps = isTouchDevice ? containerProps : {}

  return (
    <div
      ref={containerRef}
      className={className}
      {...touchProps}
      style={{
        position: 'relative',
        minHeight: '100%',
      }}
    >
      {/* Refresh Indicator */}
      {isTouchDevice && (
        <RefreshIndicator
          pullDistance={pullDistance}
          refreshing={refreshing}
          threshold={threshold}
        />
      )}

      {/* Contenido */}
      <div
        style={{
          transform: refreshing
            ? `translateY(${threshold}px)`
            : isPulling
              ? `translateY(${Math.min(pullDistance, threshold)}px)`
              : 'translateY(0)',
          transition: refreshing || isPulling ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default RefreshContainer

