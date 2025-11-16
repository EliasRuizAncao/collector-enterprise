import { useState, useCallback, useRef, useMemo } from 'react'

/**
 * Tipo para la ubicación geográfica
 */
export interface GeolocationPosition {
  latitude: number
  longitude: number
}

/**
 * Opciones para la solicitud de geolocalización
 */
export interface GeolocationOptions {
  /** Timeout en milisegundos (default: 10000) */
  timeout?: number
  /** Máxima edad de la posición en caché en milisegundos (default: 0) */
  maximumAge?: number
  /** Si se debe usar alta precisión (default: true) */
  enableHighAccuracy?: boolean
}

/**
 * Hook para gestionar la geolocalización del navegador
 * 
 * @example
 * ```tsx
 * const { location, error, loading, requestLocation } = useGeolocation()
 * 
 * useEffect(() => {
 *   requestLocation()
 * }, [])
 * ```
 */
export const useGeolocation = (options?: GeolocationOptions) => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Referencia para el watchId (si se usa watchPosition)
  const watchIdRef = useRef<number | null>(null)

  // Opciones por defecto - usar useMemo para evitar recrear en cada render
  const geolocationOptions: PositionOptions = useMemo(() => ({
    timeout: options?.timeout ?? 10000, // 10 segundos
    maximumAge: options?.maximumAge ?? 0, // No usar caché
    enableHighAccuracy: options?.enableHighAccuracy ?? true,
  }), [options?.timeout, options?.maximumAge, options?.enableHighAccuracy])

  /**
   * Verifica si el navegador soporta geolocalización
   */
  const isSupported = useCallback(() => {
    return 'geolocation' in navigator
  }, [])

  /**
   * Obtiene un mensaje de error legible según el código de error
   */
  const getErrorMessage = useCallback((error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permiso de geolocalización denegado. Por favor, habilita la geolocalización en tu navegador.'
      case error.POSITION_UNAVAILABLE:
        return 'No se pudo obtener la ubicación. Verifica tu conexión o configuración de GPS.'
      case error.TIMEOUT:
        return 'Tiempo de espera agotado al obtener la ubicación. Intenta nuevamente.'
      default:
        return 'Error desconocido al obtener la ubicación.'
    }
  }, [])

  /**
   * Solicita la ubicación actual del usuario
   */
  const requestLocation = useCallback(() => {
    // Verificar soporte del navegador
    if (!isSupported()) {
      setError('Tu navegador no soporta geolocalización.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: GeolocationPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setLocation(newLocation)
        setError(null)
        setLoading(false)
      },
      (err: GeolocationPositionError) => {
        const errorMessage = getErrorMessage(err)
        setError(errorMessage)
        setLocation(null)
        setLoading(false)
        console.error('Error de geolocalización:', err)
      },
      geolocationOptions,
    )
  }, [isSupported, getErrorMessage, geolocationOptions])

  /**
   * Observa cambios en la ubicación del usuario (watchPosition)
   * Útil para aplicaciones que necesitan actualizar la ubicación en tiempo real
   */
  const watchLocation = useCallback(() => {
    // Verificar soporte del navegador
    if (!isSupported()) {
      setError('Tu navegador no soporta geolocalización.')
      return
    }

    // Detener cualquier observación previa
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    setLoading(true)
    setError(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: GeolocationPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setLocation(newLocation)
        setError(null)
        setLoading(false)
      },
      (err: GeolocationPositionError) => {
        const errorMessage = getErrorMessage(err)
        setError(errorMessage)
        setLocation(null)
        setLoading(false)
        console.error('Error de geolocalización:', err)
      },
      geolocationOptions,
    )
  }, [isSupported, getErrorMessage, geolocationOptions])

  /**
   * Detiene la observación de la ubicación
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setLoading(false)
    }
  }, [])

  /**
   * Limpia el estado de ubicación y errores
   */
  const clearLocation = useCallback(() => {
    setLocation(null)
    setError(null)
    stopWatching()
  }, [stopWatching])

  return {
    /** Ubicación actual (latitud y longitud) */
    location,
    /** Mensaje de error si hubo algún problema */
    error,
    /** Si está cargando la ubicación */
    loading,
    /** Solicita la ubicación actual una vez */
    requestLocation,
    /** Observa cambios en la ubicación (actualización continua) */
    watchLocation,
    /** Detiene la observación de la ubicación */
    stopWatching,
    /** Limpia el estado de ubicación y errores */
    clearLocation,
    /** Verifica si el navegador soporta geolocalización */
    isSupported: isSupported(),
  }
}

export default useGeolocation

