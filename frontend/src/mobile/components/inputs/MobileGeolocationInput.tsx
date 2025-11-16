/**
 * MobileGeolocationInput - Input de geolocalización con mapa preview
 */

import { useState, useRef, useEffect } from 'react'
import { MapPin, RefreshCw, AlertCircle, Loader2, Navigation } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { inputBaseClasses, getInputStateClasses } from './inputUtils'
import { hapticFeedback } from '../../hooks/useGestures'
import './inputStyles.css'

export interface GeolocationData {
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
  timestamp: Date
}

export interface MobileGeolocationInputProps {
  /** Valor (datos de geolocalización) */
  value: GeolocationData | null
  /** Callback cuando cambia el valor */
  onChange: (value: GeolocationData | null) => void
  /** Label del campo */
  label?: string
  /** Texto de ayuda */
  helperText?: string
  /** Mensaje de error */
  error?: string
  /** Si el campo es requerido */
  required?: boolean
  /** Si el campo está deshabilitado */
  disabled?: boolean
  /** Si mostrar mini mapa preview */
  showMap?: boolean
  /** ID del campo */
  id?: string
  /** Name del campo */
  name?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileGeolocationInput = ({
  value,
  onChange,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  showMap = false,
  id,
  name,
  onBlur,
  onFocus,
}: MobileGeolocationInputProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(value?.address || null)
  const watchIdRef = useRef<number | null>(null)

  // Reverse geocoding
  const getAddress = async (lat: number, lng: number): Promise<string | null> => {
    try {
      // Usar Nominatim (OpenStreetMap) para reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Collector Enterprise Mobile App',
          },
        },
      )

      if (!response.ok) return null

      const data = await response.json()
      if (data.address) {
        const parts: string[] = []
        if (data.address.road) parts.push(data.address.road)
        if (data.address.house_number) parts.push(data.address.house_number)
        if (data.address.suburb) parts.push(data.address.suburb)
        if (data.address.city || data.address.town) {
          parts.push(data.address.city || data.address.town)
        }
        return parts.join(', ') || data.display_name || null
      }

      return data.display_name || null
    } catch (e) {
      console.warn('Error en reverse geocoding:', e)
      return null
    }
  }

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalización no está disponible en este dispositivo')
      return
    }

    setIsLoading(true)
    setLocationError(null)
    onFocus?.()
    hapticFeedback('light')

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
          },
        )
      })

      const { latitude, longitude, accuracy } = position.coords

      // Obtener dirección
      const locationAddress = await getAddress(latitude, longitude)
      setAddress(locationAddress)

      const locationData: GeolocationData = {
        latitude,
        longitude,
        accuracy,
        address: locationAddress || undefined,
        timestamp: new Date(),
      }

      onChange(locationData)
      hapticFeedback('success')
    } catch (err: any) {
      console.error('Error al obtener ubicación:', err)
      
      let errorMessage = 'Error al obtener ubicación'
      if (err.code === 1) {
        errorMessage = 'Permiso de ubicación denegado. Por favor habilítalo en configuración.'
      } else if (err.code === 2) {
        errorMessage = 'No se pudo determinar la ubicación. Verifica tu conexión GPS.'
      } else if (err.code === 3) {
        errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.'
      }

      setLocationError(errorMessage)
      hapticFeedback('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    onChange(null)
    setAddress(null)
    setLocationError(null)
  }

  const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const getAccuracyColor = (accuracy?: number): string => {
    if (!accuracy) return 'text-muted-foreground'
    if (accuracy < 10) return 'text-green-600'
    if (accuracy < 50) return 'text-amber-600'
    return 'text-red-600'
  }

  const getAccuracyLabel = (accuracy?: number): string => {
    if (!accuracy) return 'Precisión desconocida'
    if (accuracy < 10) return 'Excelente'
    if (accuracy < 50) return 'Buena'
    return 'Pobre'
  }

  const inputId = id || `mobile-geolocation-input-${name || Math.random().toString(36).substr(2, 9)}`
  const hasLocation = !!value

  return (
    <div className="mobile-input-container">
      {label && (
        <label htmlFor={inputId} className="mobile-input-label">
          {label}
          {required && <span className="mobile-input-label-required">*</span>}
        </label>
      )}

      <div className="space-y-3">
        {/* Botón para obtener ubicación */}
        {!hasLocation && (
          <button
            id={inputId}
            type="button"
            onClick={getCurrentLocation}
            disabled={disabled || isLoading}
            className={cn(
              inputBaseClasses,
              getInputStateClasses(error || locationError || undefined, false, false, false),
              'flex items-center justify-center gap-2 cursor-pointer',
              disabled && 'cursor-not-allowed',
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Obteniendo ubicación...</span>
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5" />
                <span>Obtener ubicación actual</span>
              </>
            )}
          </button>
        )}

        {/* Información de ubicación */}
        {hasLocation && value && (
          <div className="space-y-3 rounded-xl border border-input bg-background p-4">
            {/* Dirección */}
            {address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{address}</p>
                </div>
              </div>
            )}

            {/* Coordenadas */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Coordenadas:</p>
              <p className="text-sm font-mono">
                {formatCoordinates(value.latitude, value.longitude)}
              </p>
            </div>

            {/* Precisión */}
            {value.accuracy !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Precisión:</span>
                <span className={cn('text-xs font-medium', getAccuracyColor(value.accuracy))}>
                  {getAccuracyLabel(value.accuracy)} ({Math.round(value.accuracy)}m)
                </span>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground">
              Capturado: {value.timestamp.toLocaleString('es-CL')}
            </div>

            {/* Mini mapa (opcional) */}
            {showMap && (
              <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg bg-muted border border-input">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${value.latitude}&mlon=${value.longitude}&zoom=15`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  <img
                    src={`https://staticmap.openstreetmap.de/staticmap.php?center=${value.latitude},${value.longitude}&zoom=15&size=400x200&markers=${value.latitude},${value.longitude},red-pushpin`}
                    alt="Mapa de ubicación"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback simple si el mapa falla
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex items-center justify-center h-full text-muted-foreground text-sm">
                            <MapPin class="h-5 w-5 mr-2" />
                            Ver en mapa
                          </div>
                        `
                      }
                    }}
                  />
                </a>
              </div>
            )}

            {/* Botones de acción */}
            {!disabled && (
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
                  Actualizar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClear}
                >
                  Limpiar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Error de ubicación */}
        {locationError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive">{locationError}</p>
                {locationError.includes('Permiso') && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ve a Configuración → Collector → Ubicación → Permitir siempre
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      {helperText && !error && !locationError && (
        <p className="mobile-input-helper">{helperText}</p>
      )}

      {/* Error message */}
      {error && (
        <div className="mobile-input-error" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default MobileGeolocationInput

