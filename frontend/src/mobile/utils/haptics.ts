/**
 * Sistema de Feedback Háptico para Mobile
 * Wrapper de Vibration API con optimizaciones y configuración de usuario
 */

interface HapticPreferences {
  enabled: boolean
  intensity: 'light' | 'medium' | 'heavy'
}

interface VibrationPattern {
  duration: number
  pause?: number
}

/**
 * Clase para manejar feedback háptico
 */
class HapticFeedback {
  private isSupported: boolean
  private preferences: HapticPreferences
  private throttleMap: Map<string, number> = new Map()
  private queue: Array<() => void> = []
  private processingQueue: boolean = false

  constructor() {
    this.isSupported = 'vibrate' in navigator
    this.preferences = this.loadPreferences()
  }

  /**
   * Carga preferencias del usuario desde localStorage
   */
  private loadPreferences(): HapticPreferences {
    if (typeof window === 'undefined') {
      return { enabled: true, intensity: 'medium' }
    }

    try {
      const stored = localStorage.getItem('haptic-preferences')
      if (stored) {
        return JSON.parse(stored) as HapticPreferences
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error loading haptic preferences:', error)
      }
    }

    return { enabled: true, intensity: 'medium' }
  }

  /**
   * Guarda preferencias del usuario en localStorage
   */
  savePreferences(preferences: Partial<HapticPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences }
    
    try {
      localStorage.setItem('haptic-preferences', JSON.stringify(this.preferences))
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error saving haptic preferences:', error)
      }
    }
  }

  /**
   * Obtiene las preferencias actuales
   */
  getPreferences(): HapticPreferences {
    return { ...this.preferences }
  }

  /**
   * Verifica si se puede vibrar
   */
  private canVibrate(): boolean {
    return this.isSupported && this.preferences.enabled
  }

  /**
   * Aplica multiplicador de intensidad según preferencias
   */
  private applyIntensity(duration: number): number {
    const multipliers = {
      light: 0.7,
      medium: 1.0,
      heavy: 1.5,
    }
    return Math.round(duration * multipliers[this.preferences.intensity])
  }

  /**
   * Throttle para evitar vibración continua
   */
  private throttle(key: string, fn: () => void, delay: number = 100): void {
    const now = Date.now()
    const lastCall = this.throttleMap.get(key) || 0

    if (now - lastCall >= delay) {
      this.throttleMap.set(key, now)
      fn()
    }
  }

  /**
   * Procesa la cola de vibraciones
   */
  private processQueue(): void {
    if (this.processingQueue || this.queue.length === 0) {
      return
    }

    this.processingQueue = true
    const vibration = this.queue.shift()

    if (vibration) {
      vibration()
      // Procesar siguiente después de un delay
      setTimeout(() => {
        this.processingQueue = false
        this.processQueue()
      }, 50)
    } else {
      this.processingQueue = false
    }
  }

  /**
   * Añade vibración a la cola
   */
  private queueVibration(vibrationFn: () => void): void {
    this.queue.push(vibrationFn)
    this.processQueue()
  }

  /**
   * Vibración básica con duración
   */
  private vibrate(duration: number): void {
    if (!this.canVibrate()) {
      if (process.env.NODE_ENV === 'development' && !this.isSupported) {
        console.log('[Haptics] Not supported or disabled')
      }
      return
    }

    try {
      const adjustedDuration = this.applyIntensity(duration)
      navigator.vibrate(adjustedDuration)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Haptics] Error vibrating:', error)
      }
    }
  }

  /**
   * Vibración con patrón
   */
  private vibratePattern(pattern: number[]): void {
    if (!this.canVibrate()) {
      if (process.env.NODE_ENV === 'development' && !this.isSupported) {
        console.log('[Haptics] Not supported or disabled')
      }
      return
    }

    try {
      const adjustedPattern = pattern.map((duration, index) => 
        index % 2 === 0 ? this.applyIntensity(duration) : duration
      )
      navigator.vibrate(adjustedPattern)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Haptics] Error vibrating pattern:', error)
      }
    }
  }

  /**
   * Feedback ligero - tap en botón, select item
   */
  light(throttleKey?: string): void {
    if (throttleKey) {
      this.throttle(throttleKey, () => this.vibrate(10), 100)
    } else {
      this.queueVibration(() => this.vibrate(10))
    }
  }

  /**
   * Feedback medio - toggle switch, checkbox
   */
  medium(throttleKey?: string): void {
    if (throttleKey) {
      this.throttle(throttleKey, () => this.vibrate(20), 150)
    } else {
      this.queueVibration(() => this.vibrate(20))
    }
  }

  /**
   * Feedback pesado - long press, acción importante
   */
  heavy(throttleKey?: string): void {
    if (throttleKey) {
      this.throttle(throttleKey, () => this.vibrate(40), 200)
    } else {
      this.queueVibration(() => this.vibrate(40))
    }
  }

  /**
   * Feedback de éxito - formulario enviado, tarea completada
   */
  success(): void {
    this.queueVibration(() => this.vibratePattern([10, 50, 10]))
  }

  /**
   * Feedback de advertencia - advertencia, dato incorrecto
   */
  warning(): void {
    this.queueVibration(() => this.vibratePattern([20, 100, 20]))
  }

  /**
   * Feedback de error - error crítico, acción fallida
   */
  error(): void {
    this.queueVibration(() => this.vibratePattern([40, 100, 40, 100, 40]))
  }

  /**
   * Feedback de notificación - nueva notificación
   */
  notification(): void {
    this.queueVibration(() => this.vibratePattern([10, 100, 10]))
  }

  /**
   * Feedback de selección - scroll picker, selector
   */
  selection(throttleKey?: string): void {
    if (throttleKey) {
      this.throttle(throttleKey, () => this.vibrate(5), 50)
    } else {
      this.queueVibration(() => this.vibrate(5))
    }
  }

  /**
   * Cancela vibración en curso
   */
  cancel(): void {
    if (this.isSupported) {
      try {
        navigator.vibrate(0)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Haptics] Error canceling vibration:', error)
        }
      }
    }
  }

  /**
   * Prueba el feedback háptico actual
   */
  test(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'notification' | 'selection'): void {
    switch (type) {
      case 'light':
        this.light()
        break
      case 'medium':
        this.medium()
        break
      case 'heavy':
        this.heavy()
        break
      case 'success':
        this.success()
        break
      case 'warning':
        this.warning()
        break
      case 'error':
        this.error()
        break
      case 'notification':
        this.notification()
        break
      case 'selection':
        this.selection()
        break
    }
  }

  /**
   * Verifica si está soportado
   */
  isVibrationSupported(): boolean {
    return this.isSupported
  }

  /**
   * Verifica si está habilitado
   */
  isVibrationEnabled(): boolean {
    return this.preferences.enabled
  }
}

// Exportar instancia singleton
export const haptics = new HapticFeedback()

// Exportar tipos
export type { HapticPreferences }

