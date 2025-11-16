/**
 * Utilidades para geocoding y reverse geocoding
 */

export interface GeocodingResult {
  address: string
  street?: string
  city?: string
  region?: string
  country?: string
  postalCode?: string
  formatted: string
}

// Cache simple en memoria
const geocodingCache = new Map<string, { result: GeocodingResult; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Reverse geocoding usando Nominatim (OpenStreetMap)
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<GeocodingResult | null> => {
  // Verificar cache
  const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`
  const cached = geocodingCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Collector Enterprise Mobile App',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Error en reverse geocoding')
    }

    const data = await response.json()

    if (!data.address) {
      return null
    }

    const address = data.address
    const result: GeocodingResult = {
      address: address.road || '',
      street: address.road || address.pedestrian || '',
      city: address.city || address.town || address.village || address.municipality || '',
      region: address.state || address.region || '',
      country: address.country || '',
      postalCode: address.postcode || '',
      formatted: data.display_name || '',
    }

    // Guardar en cache
    geocodingCache.set(cacheKey, { result, timestamp: Date.now() })

    return result
  } catch (error) {
    console.warn('Error en reverse geocoding:', error)
    return null
  }
}

/**
 * Limpiar cache antiguo
 */
export const clearGeocodingCache = (): void => {
  const now = Date.now()
  for (const [key, value] of geocodingCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      geocodingCache.delete(key)
    }
  }
}

/**
 * Formatear dirección para mostrar
 */
export const formatAddress = (result: GeocodingResult | null): string => {
  if (!result) return 'Dirección no disponible'

  const parts: string[] = []
  if (result.street) parts.push(result.street)
  if (result.city) parts.push(result.city)
  if (result.region) parts.push(result.region)

  return parts.length > 0 ? parts.join(', ') : result.formatted || 'Dirección no disponible'
}

