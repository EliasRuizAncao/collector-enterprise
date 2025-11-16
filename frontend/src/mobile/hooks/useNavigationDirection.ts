import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Hook para detectar dirección de navegación
 * Rastrea el history stack para determinar si es push, pop o replace
 * Usa popstate event y rastrea el stack manualmente
 */
export const useNavigationDirection = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [direction, setDirection] = useState<number>(0) // -1: back, 0: replace, 1: forward
  const historyStackRef = useRef<string[]>([])
  const previousPathRef = useRef<string>('')
  const isPopStateRef = useRef<boolean>(false)

  // Detectar popstate (navegación back/forward del navegador)
  useEffect(() => {
    const handlePopState = () => {
      isPopStateRef.current = true
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    const currentPath = location.pathname
    
    // Inicializar stack si está vacío
    if (historyStackRef.current.length === 0) {
      historyStackRef.current = [currentPath]
      previousPathRef.current = currentPath
      setDirection(0)
      return
    }

    const previousPath = previousPathRef.current
    
    // Si es popstate, es back navigation
    if (isPopStateRef.current) {
      const stackIndex = historyStackRef.current.indexOf(currentPath)
      if (stackIndex >= 0) {
        // Remover elementos después del índice actual
        historyStackRef.current = historyStackRef.current.slice(0, stackIndex + 1)
        setDirection(-1)
      } else {
        setDirection(0)
      }
      isPopStateRef.current = false
    } else {
      // Navegación programática
      const stackIndex = historyStackRef.current.indexOf(currentPath)

      if (stackIndex === -1) {
        // Nueva ruta: push (forward)
        historyStackRef.current.push(currentPath)
        setDirection(1)
      } else if (stackIndex === historyStackRef.current.length - 2) {
        // Ruta anterior en el stack: pop (back) - muy raro en navegación programática
        historyStackRef.current = historyStackRef.current.slice(0, stackIndex + 1)
        setDirection(-1)
      } else if (stackIndex === historyStackRef.current.length - 1) {
        // Misma ruta: no cambio (replace en la misma ruta)
        setDirection(0)
      } else {
        // Reemplazo o ruta no secuencial: fade
        historyStackRef.current = historyStackRef.current.slice(0, stackIndex + 1)
        setDirection(0)
      }
    }

    previousPathRef.current = currentPath
  }, [location.pathname])

  /**
   * Determina el tipo de transición basado en la ruta y dirección
   */
  const getTransitionType = (pathname: string): 'push' | 'pop' | 'fade' | 'modal' => {
    // Rutas de modales (siempre desde bottom)
    const modalRoutes = ['/mobile/camera', '/mobile/form/']
    if (modalRoutes.some(route => pathname.startsWith(route))) {
      return 'modal'
    }

    // Tabs (fade cross) - navegación entre tabs principales
    const tabRoutes = ['/mobile/dashboard', '/mobile/assignments', '/mobile/profile']
    const previousTab = historyStackRef.current
      .slice(-2, -1)[0]
      ?.split('/')
      .slice(0, 3)
      .join('/')
    const currentTab = pathname.split('/').slice(0, 3).join('/')
    
    if (tabRoutes.includes(pathname) && tabRoutes.includes(previousTab || '') && previousTab !== currentTab) {
      return 'fade'
    }

    // Splash/landing (fade, sin animación compleja)
    if (pathname === '/' || pathname === '/login') {
      return 'fade'
    }

    // Según dirección detectada
    if (direction > 0) return 'push'
    if (direction < 0) return 'pop'
    return 'fade'
  }

  return {
    direction,
    transitionType: getTransitionType(location.pathname),
    navigate,
  }
}

