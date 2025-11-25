import { useCallback } from 'react'
import { haptics, type HapticPreferences } from '../utils/haptics'

/**
 * Hook para usar feedback háptico en componentes
 * Facilita el uso de haptics con callbacks
 */
export const useHaptics = () => {
  const light = useCallback((throttleKey?: string) => {
    haptics.light(throttleKey)
  }, [])

  const medium = useCallback((throttleKey?: string) => {
    haptics.medium(throttleKey)
  }, [])

  const heavy = useCallback((throttleKey?: string) => {
    haptics.heavy(throttleKey)
  }, [])

  const success = useCallback(() => {
    haptics.success()
  }, [])

  const warning = useCallback(() => {
    haptics.warning()
  }, [])

  const error = useCallback(() => {
    haptics.error()
  }, [])

  const notification = useCallback(() => {
    haptics.notification()
  }, [])

  const selection = useCallback((throttleKey?: string) => {
    haptics.selection(throttleKey)
  }, [])

  const cancel = useCallback(() => {
    haptics.cancel()
  }, [])

  const test = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'notification' | 'selection') => {
    haptics.test(type)
  }, [])

  const setPreferences = useCallback((preferences: Partial<HapticPreferences>) => {
    haptics.savePreferences(preferences)
  }, [])

  const getPreferences = useCallback((): HapticPreferences => {
    return haptics.getPreferences() as HapticPreferences
  }, [])

  const isSupported = haptics.isVibrationSupported()
  const isEnabled = haptics.isVibrationEnabled()

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    notification,
    selection,
    cancel,
    test,
    setPreferences,
    getPreferences,
    isSupported,
    isEnabled,
  }
}

