import { useState, useCallback, useEffect, useRef } from 'react'

interface UseLoadingStateOptions {
  /**
   * Tiempo mínimo de loading antes de mostrar (ms)
   * Para evitar parpadeo en cargas rápidas
   */
  minLoadingTime?: number
  /**
   * Delay antes de mostrar loading (ms)
   * Para no mostrar loading en operaciones <1s
   */
  delay?: number
}

/**
 * Hook para manejar estados de loading con optimizaciones
 * - Delay para no mostrar loading en operaciones rápidas
 * - Tiempo mínimo para evitar parpadeo
 * - Estados de loading, error, success
 */
export const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const { minLoadingTime = 300, delay = 1000 } = options
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [success, setSuccess] = useState(false)
  
  const loadingStartTime = useRef<number>(0)
  const loadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const minTimeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Inicia el loading state
   */
  const startLoading = useCallback(() => {
    setError(null)
    setSuccess(false)
    loadingStartTime.current = Date.now()

    // Delay antes de mostrar loading (para operaciones <1s)
    loadingTimeout.current = setTimeout(() => {
      setIsLoading(true)
    }, delay)
  }, [delay])

  /**
   * Detiene el loading state
   */
  const stopLoading = useCallback(() => {
    const elapsed = Date.now() - loadingStartTime.current
    
    // Cancelar timeout si aún no se ha mostrado
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current)
      loadingTimeout.current = null
    }

    // Si ya pasó el tiempo mínimo, esperar el resto
    if (elapsed < minLoadingTime && isLoading) {
      minTimeTimeout.current = setTimeout(() => {
        setIsLoading(false)
        minTimeTimeout.current = null
      }, minLoadingTime - elapsed)
    } else {
      setIsLoading(false)
    }
  }, [minLoadingTime, isLoading])

  /**
   * Muestra error
   */
  const setErrorState = useCallback((err: Error | string) => {
    const errorObj = typeof err === 'string' ? new Error(err) : err
    setError(errorObj)
    setSuccess(false)
    
    // Cancelar timeout si aún no se ha mostrado
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current)
      loadingTimeout.current = null
    }
    
    setIsLoading(false)
  }, [])

  /**
   * Muestra success
   */
  const setSuccessState = useCallback(() => {
    setSuccess(true)
    setError(null)
    
    // Cancelar timeout si aún no se ha mostrado
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current)
      loadingTimeout.current = null
    }
    
    const elapsed = Date.now() - loadingStartTime.current
    
    // Si ya pasó el tiempo mínimo, esperar el resto
    if (elapsed < minLoadingTime && isLoading) {
      minTimeTimeout.current = setTimeout(() => {
        setIsLoading(false)
        minTimeTimeout.current = null
      }, minLoadingTime - elapsed)
    } else {
      setIsLoading(false)
    }
    
    // Auto-ocultar success después de 2 segundos
    setTimeout(() => {
      setSuccess(false)
    }, 2000)
  }, [minLoadingTime, isLoading])

  /**
   * Ejecuta una función async con loading automático
   */
  const executeAsync = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    startLoading()
    try {
      const result = await asyncFn()
      setSuccessState()
      onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setErrorState(error)
      onError?.(error)
      return null
    }
  }, [startLoading, stopLoading, setErrorState, setSuccessState])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current)
      }
      if (minTimeTimeout.current) {
        clearTimeout(minTimeTimeout.current)
      }
    }
  }, [])

  return {
    isLoading,
    error,
    success,
    startLoading,
    stopLoading,
    setError: setErrorState,
    setSuccess: setSuccessState,
    executeAsync,
    reset: useCallback(() => {
      setIsLoading(false)
      setError(null)
      setSuccess(false)
    }, []),
  }
}

