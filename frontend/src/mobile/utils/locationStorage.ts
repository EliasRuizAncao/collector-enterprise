/**
 * Utilidades para almacenar ubicaciones en localStorage (offline)
 */

export interface StoredLocation {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: Date
  address?: string
  isCached?: boolean
}

const STORAGE_KEY = 'collector_last_location'
const HISTORY_KEY = 'collector_location_history'
const MAX_HISTORY = 50

/**
 * Guardar última ubicación conocida
 */
export const saveLastLocation = (location: StoredLocation): void => {
  try {
    const data = {
      ...location,
      timestamp: location.timestamp.toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Error al guardar ubicación:', error)
  }
}

/**
 * Obtener última ubicación conocida
 */
export const getLastLocation = (): StoredLocation | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null

    const location = JSON.parse(data)
    return {
      ...location,
      timestamp: new Date(location.timestamp),
      isCached: true,
    }
  } catch (error) {
    console.warn('Error al leer ubicación:', error)
    return null
  }
}

/**
 * Agregar a historial de ubicaciones
 */
export const addToHistory = (location: StoredLocation): void => {
  try {
    const history = getHistory()
    history.unshift({
      ...location,
      timestamp: location.timestamp,
    })

    // Mantener solo las últimas MAX_HISTORY
    if (history.length > MAX_HISTORY) {
      history.splice(MAX_HISTORY)
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.map((l) => ({
      ...l,
      timestamp: l.timestamp.toISOString(),
    }))))
  } catch (error) {
    console.warn('Error al guardar historial:', error)
  }
}

/**
 * Obtener historial de ubicaciones
 */
export const getHistory = (): StoredLocation[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    if (!data) return []

    const history = JSON.parse(data)
    return history.map((l: any) => ({
      ...l,
      timestamp: new Date(l.timestamp),
    }))
  } catch (error) {
    console.warn('Error al leer historial:', error)
    return []
  }
}

/**
 * Limpiar historial
 */
export const clearHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (error) {
    console.warn('Error al limpiar historial:', error)
  }
}

