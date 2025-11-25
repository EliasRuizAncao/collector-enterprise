import { useEffect, useState } from 'react'

import {
  getDeviceInfo,
  type DeviceInfo,
} from '../utils/deviceDetector'

/**
 * Hook para detección reactiva de dispositivo
 * Actualiza automáticamente cuando cambia orientación o tamaño de pantalla
 * @returns Información del dispositivo actualizada en tiempo real
 */
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window !== 'undefined') {
      return getDeviceInfo()
    }
    return {
      isMobile: false,
      isTablet: false,
      isIOS: false,
      isAndroid: false,
      isPWA: false,
      isTouchDevice: false,
      orientation: 'portrait',
      userAgent: '',
      platform: '',
      screenWidth: 0,
      screenHeight: 0,
    }
  })

  const updateDeviceInfo = () => {
    setDeviceInfo(getDeviceInfo())
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Actualizar al montar
    updateDeviceInfo()

    // Media queries para cambios de tamaño y orientación
    const mediaQueries = {
      mobile: window.matchMedia('(max-width: 768px)'),
      tablet: window.matchMedia('(min-width: 769px) and (max-width: 1024px)'),
      orientation: window.matchMedia('(orientation: portrait)'),
    }

    // Handlers para cambios
    const handleResize = () => {
      updateDeviceInfo()
    }

    const handleOrientationChange = () => {
      // Pequeño delay para que el navegador actualice las dimensiones
      setTimeout(() => {
        updateDeviceInfo()
      }, 100)
    }

    // Listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    // Media query listeners (más eficientes que resize)
    if (mediaQueries.mobile.matches) {
      mediaQueries.mobile.addEventListener('change', handleResize)
    }
    if (mediaQueries.tablet.matches) {
      mediaQueries.tablet.addEventListener('change', handleResize)
    }
    mediaQueries.orientation.addEventListener('change', handleOrientationChange)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      mediaQueries.mobile.removeEventListener('change', handleResize)
      mediaQueries.tablet.removeEventListener('change', handleResize)
      mediaQueries.orientation.removeEventListener('change', handleOrientationChange)
    }
  }, [])

  return {
    ...deviceInfo,
    // Helpers para fácil acceso
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isIOS: deviceInfo.isIOS,
    isAndroid: deviceInfo.isAndroid,
    isPWA: deviceInfo.isPWA,
    orientation: deviceInfo.orientation,
  }
}

