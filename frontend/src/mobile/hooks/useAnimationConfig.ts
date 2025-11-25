import { useEffect, useState } from 'react'
import { getAnimationConfig, prefersReducedMotion, isLowEndDevice } from '../utils/animations'

/**
 * Hook para detectar y obtener configuración de animaciones
 * Respeta preferencias del usuario y detecta dispositivos de baja potencia
 */
export const useAnimationConfig = () => {
  const [config, setConfig] = useState(getAnimationConfig())

  useEffect(() => {
    // Escuchar cambios en preferencias de movimiento reducido
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = () => {
      setConfig(getAnimationConfig())
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return {
    enabled: config.enabled,
    duration: config.duration,
    reduceAnimations: config.reduceAnimations,
    prefersReducedMotion: prefersReducedMotion(),
    isLowEndDevice: isLowEndDevice(),
  }
}

