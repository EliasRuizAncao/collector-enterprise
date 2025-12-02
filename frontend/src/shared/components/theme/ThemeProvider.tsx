import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Tipos de tema disponibles
type Theme = 'light' | 'dark' | 'system'

// Interfaz para el contexto del tema
interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark' // El tema real aplicado (resuelve 'system')
}

// Crear el contexto con valores por defecto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Clave para almacenar la preferencia en localStorage
const STORAGE_KEY = 'collector-enterprise-theme'

// Props del provider
interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

/**
 * ThemeProvider - Proveedor de contexto para el sistema de temas
 * 
 * Características:
 * - Soporta light, dark y system (detecta preferencia del SO)
 * - Persiste la selección en localStorage
 * - Aplica transiciones suaves entre temas
 * - TypeScript estricto
 * - Detecta cambios en la preferencia del sistema
 */
export const ThemeProvider = ({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Inicializar desde localStorage o usar el valor por defecto
    if (typeof window === 'undefined') {
      return defaultTheme
    }
    
    const stored = window.localStorage.getItem(storageKey) as Theme | null
    return stored ?? defaultTheme
  })

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    // Determinar el tema real inicial
    if (typeof window === 'undefined') {
      return 'light'
    }

    const stored = window.localStorage.getItem(storageKey) as Theme | null
    const themeToUse = stored ?? defaultTheme

    if (themeToUse === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    return themeToUse
  })

  // Detectar cambios en la preferencia del sistema
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      // Solo actualizar si el usuario tiene seleccionado 'system'
      if (theme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light'
        setActualTheme(newTheme)
        applyTheme(newTheme)
      }
    }

    // Usar addEventListener/removeEventListener para mejor compatibilidad
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Aplicar el tema al DOM
  const applyTheme = (themeToApply: 'light' | 'dark') => {
    const root = document.documentElement
    
    // Remover ambas clases primero
    root.classList.remove('light', 'dark')
    
    // Agregar la clase correspondiente
    root.classList.add(themeToApply)
    
    // Actualizar el color del theme-color meta tag (para PWA)
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      const color = themeToApply === 'dark' ? '#0f172a' : '#ffffff'
      themeColorMeta.setAttribute('content', color)
    }
  }

  // Efecto para aplicar el tema cuando cambia
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let themeToApply: 'light' | 'dark'

    if (theme === 'system') {
      // Detectar preferencia del sistema
      themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      themeToApply = theme
    }

    setActualTheme(themeToApply)
    applyTheme(themeToApply)
  }, [theme])

  // Función para cambiar el tema
  const setTheme = (newTheme: Theme) => {
    if (typeof window === 'undefined') {
      return
    }

    setThemeState(newTheme)
    window.localStorage.setItem(storageKey, newTheme)
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    actualTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook para usar el contexto del tema
 * 
 * @throws Error si se usa fuera de ThemeProvider
 * @returns Contexto del tema con theme, setTheme y actualTheme
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider')
  }

  return context
}

