/**
 * LocationPicker - Componente de geolocalización mejorado para mobile
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Navigation,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings,
  Map as MapIcon,
  X,
  AlertTriangle,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { hapticFeedback } from '../hooks/useGestures'
import { reverseGeocode, formatAddress, type GeocodingResult } from '../utils/geocoding'
import {
  saveLastLocation,
  getLastLocation,
  addToHistory,
  type StoredLocation,
} from '../utils/locationStorage'

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: Date
  address?: GeocodingResult
  isCached?: boolean
}

export interface LocationPickerProps {
  /** Callback cuando se selecciona una ubicación */
  onLocationSelect: (location: LocationData) => void
  /** Ubicación inicial */
  initialLocation?: LocationData | null
  /** Si es requerido */
  required?: boolean
  /** Si mostrar en modal */
  modal?: boolean
  /** Si mostrar mapa interactivo */
  showMap?: boolean
  /** Área permitida (opcional) */
  allowedArea?: {
    center: { latitude: number; longitude: number }
    radius: number // en metros
  }
  /** Accuracy mínima requerida (en metros) */
  minAccuracy?: number
}

type LocationState = 'idle' | 'loading' | 'success' | 'error' | 'denied'

const LocationPicker = ({
  onLocationSelect,
  initialLocation,
  required = false,
  modal = false,
  showMap = false,
  allowedArea,
  minAccuracy = 100,
}: LocationPickerProps) => {
  const [state, setState] = useState<LocationState>('idle')
  const [location, setLocation] = useState<LocationData | null>(initialLocation || null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const MAX_RETRIES = 3
  const TIMEOUT = 30000 // 30 segundos

  // Cargar última ubicación conocida al montar
  useEffect(() => {
    if (!location) {
      const lastLocation = getLastLocation()
      if (lastLocation) {
        setLocation({
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          accuracy: lastLocation.accuracy,
          timestamp: lastLocation.timestamp,
          isCached: true,
        })
      }
    }
  }, [])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Obtener ubicación con retries
  const getCurrentLocation = useCallback(async (attempt: number = 1, useHighAccuracy: boolean = true) => {
    if (!navigator.geolocation) {
      setError('Geolocalización no está disponible en este dispositivo')
      setState('error')
      return
    }

    setState('loading')
    setError(null)
    hapticFeedback('light')

    // Timeout
    timeoutRef.current = setTimeout(() => {
      if (attempt < MAX_RETRIES) {
        // Intentar con menor accuracy
        getCurrentLocation(attempt + 1, false)
      } else {
        setError('Tiempo de espera agotado. Intenta nuevamente.')
        setState('error')
        hapticFeedback('error')
      }
    }, TIMEOUT)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: useHighAccuracy,
            timeout: TIMEOUT,
            maximumAge: useHighAccuracy ? 0 : 60000, // 0 para high accuracy, 1 min para low
          },
        )
      })

      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      const { latitude, longitude, accuracy } = position.coords

      // Validar accuracy mínima
      if (accuracy && accuracy > minAccuracy && attempt < MAX_RETRIES) {
        // Intentar de nuevo con high accuracy
        getCurrentLocation(attempt + 1, true)
        return
      }

      // Validar área permitida
      if (allowedArea) {
        const distance = calculateDistance(
          latitude,
          longitude,
          allowedArea.center.latitude,
          allowedArea.center.longitude,
        )

        if (distance > allowedArea.radius) {
          setError(
            `La ubicación está fuera del área permitida. Distancia: ${Math.round(distance)}m (máx: ${allowedArea.radius}m)`,
          )
          setState('error')
          hapticFeedback('error')
          return
        }
      }

      // Obtener dirección
      const address = await reverseGeocode(latitude, longitude)

      const locationData: LocationData = {
        latitude,
        longitude,
        accuracy,
        timestamp: new Date(),
        address: address || undefined,
        isCached: false,
      }

      setLocation(locationData)
      setState('success')
      setRetryCount(0)

      // Guardar en storage
      saveLastLocation({
        latitude,
        longitude,
        accuracy,
        timestamp: new Date(),
        address: address ? formatAddress(address) : undefined,
      })
      addToHistory({
        latitude,
        longitude,
        accuracy,
        timestamp: new Date(),
        address: address ? formatAddress(address) : undefined,
      })

      // Notificar
      onLocationSelect(locationData)
      hapticFeedback('success')
    } catch (err: any) {
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      console.error('Error al obtener ubicación:', err)

      let errorMessage = 'Error al obtener ubicación'
      if (err.code === 1) {
        errorMessage = 'Permiso de ubicación denegado'
        setState('denied')
      } else if (err.code === 2) {
        errorMessage = 'No se pudo determinar la ubicación'
        if (attempt < MAX_RETRIES) {
          // Retry con menor accuracy
          setTimeout(() => getCurrentLocation(attempt + 1, false), 1000)
          return
        }
        setState('error')
      } else if (err.code === 3) {
        errorMessage = 'Tiempo de espera agotado'
        if (attempt < MAX_RETRIES) {
          setTimeout(() => getCurrentLocation(attempt + 1, false), 1000)
          return
        }
        setState('error')
      } else {
        setState('error')
      }

      setError(errorMessage)
      setRetryCount(attempt)
      hapticFeedback('error')
    }
  }, [allowedArea, minAccuracy, onLocationSelect])

  // Calcular distancia entre dos puntos (Haversine)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371000 // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Obtener color según accuracy
  const getAccuracyColor = (accuracy?: number): string => {
    if (!accuracy) return 'text-muted-foreground'
    if (accuracy < 10) return 'text-green-600'
    if (accuracy < 50) return 'text-amber-600'
    return 'text-red-600'
  }

  // Obtener label de accuracy
  const getAccuracyLabel = (accuracy?: number): string => {
    if (!accuracy) return 'Precisión desconocida'
    if (accuracy < 10) return 'Excelente'
    if (accuracy < 50) return 'Buena'
    return 'Pobre'
  }

  // Abrir configuración
  const handleOpenSettings = () => {
    alert(
      'Para habilitar la ubicación:\n\n' +
        'iOS: Configuración → Privacidad → Ubicación → Collector → Permitir siempre\n' +
        'Android: Configuración → Apps → Collector → Permisos → Ubicación → Permitir siempre',
    )
  }

  // Formatear coordenadas
  const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  // Renderizar contenido
  const renderContent = () => (
    <div className="space-y-4">
      {/* Botón obtener ubicación */}
      {state !== 'success' && (
        <Button
          onClick={() => getCurrentLocation(1, true)}
          disabled={state === 'loading'}
          className="w-full"
          size="lg"
        >
          {state === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Obteniendo ubicación...
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-5 w-5" />
              Obtener ubicación actual
            </>
          )}
        </Button>
      )}

      {/* Estado de error */}
      {state === 'error' && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
              {retryCount < MAX_RETRIES && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getCurrentLocation(retryCount + 1, false)}
                  className="mt-2"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estado denied */}
      {state === 'denied' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Permiso de ubicación denegado
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Por favor, habilita el permiso de ubicación en la configuración de tu dispositivo.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenSettings}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Abrir configuración
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualInput(true)}
                >
                  Ingresar manualmente
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ubicación obtenida */}
      {state === 'success' && location && (
        <div className="space-y-3">
          {/* Badge de cached */}
          {location.isCached && (
            <Badge variant="secondary" className="w-full justify-center">
              Ubicación en caché (sin conexión)
            </Badge>
          )}

          {/* Dirección */}
          {location.address && (
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{formatAddress(location.address)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Coordenadas */}
          <div className="rounded-lg border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Coordenadas:</span>
              <span className="text-sm font-mono">
                {formatCoordinates(location.latitude, location.longitude)}
              </span>
            </div>

            {/* Accuracy */}
            {location.accuracy !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precisión:</span>
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-medium', getAccuracyColor(location.accuracy))}>
                    {getAccuracyLabel(location.accuracy)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(location.accuracy)}m)
                  </span>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Capturado:</span>
              <span className="text-xs text-muted-foreground">
                {location.timestamp.toLocaleString('es-CL')}
              </span>
            </div>

            {/* Advertencia de accuracy pobre */}
            {location.accuracy && location.accuracy > 50 && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                La precisión es baja. Considera obtener una nueva ubicación.
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => getCurrentLocation(1, true)}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            {showMap && (
              <Button
                variant="outline"
                onClick={() => setIsMapOpen(true)}
                className="flex-1"
              >
                <MapIcon className="mr-2 h-4 w-4" />
                Ver mapa
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Input manual */}
      {showManualInput && (
        <div className="rounded-lg border bg-background p-4 space-y-2">
          <label className="text-sm font-medium">Ingresar dirección manualmente</label>
          <Input
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="Ej: Av. Principal 123, Santiago"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowManualInput(false)
                setManualAddress('')
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (manualAddress.trim()) {
                  // Aquí se podría hacer geocoding forward para obtener coordenadas
                  // Por ahora, solo guardamos la dirección
                  const manualLocation: LocationData = {
                    latitude: 0,
                    longitude: 0,
                    timestamp: new Date(),
                    address: {
                      formatted: manualAddress,
                      address: manualAddress,
                    },
                  }
                  setLocation(manualLocation)
                  onLocationSelect(manualLocation)
                  setShowManualInput(false)
                }
              }}
              className="flex-1"
              disabled={!manualAddress.trim()}
            >
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  if (modal) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar ubicación</DialogTitle>
            <DialogDescription>
              Obtén tu ubicación actual o ingrésala manualmente
            </DialogDescription>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="w-full">
      {renderContent()}

      {/* Modal de mapa (si está habilitado) */}
      {showMap && isMapOpen && location && (
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
          <DialogContent className="max-w-[95vw] h-[90vh] p-0">
            <div className="relative w-full h-full">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm border-b">
                <h3 className="font-semibold">Mapa de ubicación</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMapOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mapa */}
              <div className="w-full h-full pt-14">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=15`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  <img
                    src={`https://staticmap.openstreetmap.de/staticmap.php?center=${location.latitude},${location.longitude}&zoom=15&size=800x600&markers=${location.latitude},${location.longitude},red-pushpin`}
                    alt="Mapa de ubicación"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex items-center justify-center h-full text-muted-foreground">
                            <a href="https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=15" target="_blank" class="text-primary underline">
                              Ver en OpenStreetMap
                            </a>
                          </div>
                        `
                      }
                    }}
                  />
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default LocationPicker

