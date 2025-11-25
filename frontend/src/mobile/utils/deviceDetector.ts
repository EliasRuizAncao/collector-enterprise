/**
 * Utilidades para detección de dispositivos móviles
 * Detecta tipo de dispositivo, OS, PWA status, etc.
 */

/**
 * Tipo para información completa del dispositivo
 */
export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isIOS: boolean
  isAndroid: boolean
  isPWA: boolean
  isTouchDevice: boolean
  orientation: 'portrait' | 'landscape'
  userAgent: string
  platform: string
  screenWidth: number
  screenHeight: number
}

/**
 * Detecta si el dispositivo es móvil basado en touch y tamaño de pantalla
 * @returns true si es dispositivo móvil
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false

  const hasTouchScreen =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - navigator.msMaxTouchPoints existe en IE/Edge antiguos
    (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)

  const screenWidth = window.innerWidth || window.screen.width

  // Dispositivo móvil: tiene touch y ancho <= 768px
  return hasTouchScreen && screenWidth <= 768
}

/**
 * Detecta si es una tablet
 * @returns true si es tablet
 */
export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false

  const hasTouchScreen =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - navigator.msMaxTouchPoints existe en IE/Edge antiguos
    (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)

  const screenWidth = window.innerWidth || window.screen.width

  // Tablet: tiene touch y ancho entre 768px y 1024px
  return hasTouchScreen && screenWidth > 768 && screenWidth <= 1024
}

/**
 * Detecta si el dispositivo es iOS
 * @returns true si es iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false

  const userAgent = window.navigator.userAgent.toLowerCase()
  const platform = window.navigator.platform.toLowerCase()

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === 'macintel' && navigator.maxTouchPoints > 1) || // iPad iOS 13+
    /iPad/.test(navigator.userAgent) // iPad iOS 12 y anteriores
  )
}

/**
 * Detecta si el dispositivo es Android
 * @returns true si es Android
 */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false

  const userAgent = window.navigator.userAgent.toLowerCase()

  return /android/.test(userAgent)
}

/**
 * Detecta si la PWA está instalada (modo standalone)
 * @returns true si está instalada como PWA
 */
export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false

  // Verificar si está en modo standalone (PWA instalada)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - window.navigator.standalone existe en iOS
    (window.navigator.standalone === true) ||
    document.referrer.includes('android-app://')

  return isStandalone
}

/**
 * Detecta si el dispositivo tiene pantalla táctil
 * @returns true si tiene touch
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - navigator.msMaxTouchPoints existe en IE/Edge antiguos
    (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
  )
}

/**
 * Obtiene la orientación actual del dispositivo
 * @returns 'portrait' | 'landscape'
 */
export const getDeviceOrientation = (): 'portrait' | 'landscape' => {
  if (typeof window === 'undefined') return 'portrait'

  const width = window.innerWidth || window.screen.width
  const height = window.innerHeight || window.screen.height

  return width > height ? 'landscape' : 'portrait'
}

/**
 * Obtiene información completa del dispositivo
 * @returns DeviceInfo con toda la información del dispositivo
 */
export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
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
  }

  const mobile = isMobileDevice()
  const tablet = isTablet()
  const ios = isIOS()
  const android = isAndroid()
  const pwa = isPWAInstalled()
  const touch = isTouchDevice()
  const orientation = getDeviceOrientation()

  return {
    isMobile: mobile,
    isTablet: tablet,
    isIOS: ios,
    isAndroid: android,
    isPWA: pwa,
    isTouchDevice: touch,
    orientation,
    userAgent: window.navigator.userAgent,
    platform: window.navigator.platform,
    screenWidth: window.innerWidth || window.screen.width,
    screenHeight: window.innerHeight || window.screen.height,
  }
}

/**
 * Clave para guardar preferencia de usuario en localStorage
 */
const PREFERENCE_KEYS = {
  ADMIN_USE_MOBILE: 'collector-pref-admin-use-mobile',
  OPERATOR_USE_DESKTOP: 'collector-pref-operator-use-desktop',
} as const

/**
 * Guarda la preferencia del usuario de usar mobile en admin
 * @param preferMobile true si prefiere usar mobile
 */
export const setAdminMobilePreference = (preferMobile: boolean): void => {
  if (typeof window === 'undefined') return

  if (preferMobile) {
    localStorage.setItem(PREFERENCE_KEYS.ADMIN_USE_MOBILE, 'true')
  } else {
    localStorage.removeItem(PREFERENCE_KEYS.ADMIN_USE_MOBILE)
  }
}

/**
 * Obtiene la preferencia del admin de usar mobile
 * @returns true si prefiere usar mobile
 */
export const getAdminMobilePreference = (): boolean => {
  if (typeof window === 'undefined') return false

  return localStorage.getItem(PREFERENCE_KEYS.ADMIN_USE_MOBILE) === 'true'
}

/**
 * Guarda la preferencia del operador de usar desktop
 * @param preferDesktop true si prefiere usar desktop
 */
export const setOperatorDesktopPreference = (preferDesktop: boolean): void => {
  if (typeof window === 'undefined') return

  if (preferDesktop) {
    localStorage.setItem(PREFERENCE_KEYS.OPERATOR_USE_DESKTOP, 'true')
  } else {
    localStorage.removeItem(PREFERENCE_KEYS.OPERATOR_USE_DESKTOP)
  }
}

/**
 * Obtiene la preferencia del operador de usar desktop
 * @returns true si prefiere usar desktop
 */
export const getOperatorDesktopPreference = (): boolean => {
  if (typeof window === 'undefined') return false

  return localStorage.getItem(PREFERENCE_KEYS.OPERATOR_USE_DESKTOP) === 'true'
}

