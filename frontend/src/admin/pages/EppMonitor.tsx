import { useState, useEffect, useRef } from 'react'
import { Camera, HardHat, Shield, Hand, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'

// Interfaz actualizada con clases en español del modelo de Roboflow
interface EPPDetection {
  casco: number
  chaleco: number
  guante: number
  zapato: number
  'no casco': number
  'no chaleco': number
  'no guante': number
}

interface EPPStatus {
  timestamp: string
  imageUrl: string | null
  processedImageUrl: string | null
  detections: EPPDetection
  isCompliant: boolean
  missingItems: string[]
}

interface ProcessedImage {
  filename: string
  url: string
  timestamp: string
  detections: EPPDetection | null
  hasDetections: boolean
}

const EppMonitor = () => {
  const [status, setStatus] = useState<EPPStatus | null>(null)
  const [images, setImages] = useState<ProcessedImage[]>([])
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null)
  const selectedImageRef = useRef<ProcessedImage | null>(null)

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const pollingIntervalRef = useRef<number | null>(null)

  // Función para obtener el estado
  const fetchStatus = async () => {
    try {
      const response = await api.get('/v1/epp/status')
      if (response.data.success) {
        if (response.data.status) {
          setStatus(response.data.status)
        }
        // Actualizar lista de imágenes
        if (response.data.images && Array.isArray(response.data.images)) {
          const newImages = response.data.images as ProcessedImage[]
          console.log('[EPP Monitor] Imágenes recibidas:', newImages.length, newImages)
          setImages(newImages)

          // Lógica de selección persistente usando Ref para evitar stale closure
          const currentSelected = selectedImageRef.current

          if (currentSelected) {
            // Si ya hay una seleccionada, intentar mantenerla (actualizando sus datos)
            const updatedSelected = newImages.find(img => img.filename === currentSelected.filename)
            if (updatedSelected) {
              setSelectedImage(updatedSelected)
            } else {
              // Si la seleccionada ya no existe, volver a la primera
              if (newImages.length > 0) setSelectedImage(newImages[0])
              else setSelectedImage(null)
            }
          } else {
            // Si no hay selección, seleccionar la primera por defecto
            if (newImages.length > 0) {
              setSelectedImage(newImages[0])
            }
          }
        }
        setError(null)
      } else {
        // No hay análisis aún, no es un error
        setStatus(null)
      }
    } catch (err: any) {
      console.error('Error al obtener estado EPP:', err)
      // Solo mostrar error si no es el primer intento
      if (status !== null) {
        setError(err.response?.data?.error || 'Error al obtener estado')
      }
    } finally {
      setLoading(false)
    }
  }

  // Mantener ref sincronizada
  useEffect(() => {
    selectedImageRef.current = selectedImage
  }, [selectedImage])

  // Reset zoom cuando cambia la imagen
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [selectedImage?.filename])

  // Handlers para Zoom y Pan
  const handleWheel = (e: React.WheelEvent) => {
    // Solo hacer zoom si el mouse está sobre la imagen
    if (zoom > 1 || e.deltaY < 0) {
      // e.preventDefault() // React synthetic events don't support this for passive listeners usually, but we can try stopping propagation
      e.stopPropagation()
    }

    const scale = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.max(1, Math.min(5, z * scale)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      e.preventDefault()
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // Polling cada 1 segundo
  useEffect(() => {
    // Cargar inmediatamente
    fetchStatus()

    // Configurar polling
    pollingIntervalRef.current = window.setInterval(() => {
      fetchStatus()
    }, 1000)

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, []) // Remove dependency on selectedImage to avoid resetting poll loop

  // Determinar color de borde según compliance
  const borderColor = status
    ? status.isCompliant
      ? 'border-green-500'
      : 'border-red-500'
    : 'border-border'

  // Calcular totales: contar cuántas IMÁGENES tienen cada tipo de detección
  const totalDetections = images.reduce(
    (acc, img) => {
      if (img.detections) {
        // Contar imagen si tiene al menos 1 detección de cada tipo
        if (img.detections.casco > 0) acc.casco++
        if (img.detections.chaleco > 0) acc.chaleco++
        if (img.detections.guante > 0) acc.guante++
        if (img.detections['no casco'] > 0) acc['no casco']++
        if (img.detections['no chaleco'] > 0) acc['no chaleco']++
        if (img.detections['no guante'] > 0) acc['no guante']++
      }
      return acc
    },
    { casco: 0, chaleco: 0, guante: 0, 'no casco': 0, 'no chaleco': 0, 'no guante': 0 },
  )

  return (
    <div className={cn('space-y-6', status && !status.isCompliant && 'ring-4 ring-red-500/20 rounded-lg p-2')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Camera className="h-8 w-8 text-primary" />
            Centro de Control EPP
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitoreo en tiempo real de Equipos de Protección Personal
          </p>
        </div>
        {status && (
          <Badge
            variant={status.isCompliant ? 'default' : 'destructive'}
            className="text-sm px-4 py-2"
          >
            {status.isCompliant ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Cumplimiento OK
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Falta EPP
              </>
            )}
          </Badge>
        )}
      </div>

      {/* Alerta si falta EPP */}
      {status && !status.isCompliant && (
        <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>¡Alerta de Seguridad!</AlertTitle>
          <AlertDescription>
            Se detectó que falta el siguiente equipo de protección personal:{' '}
            <strong>{status.missingItems.join(', ')}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Grid principal */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Galería de imágenes - Ocupa 2 columnas */}
        <Card className={cn('md:col-span-2 lg:col-span-2', borderColor, 'border-2')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Imágenes Procesadas
            </CardTitle>
            <CardDescription>
              {images.length > 0
                ? `${images.length} imagen${images.length > 1 ? 'es' : ''} disponible${images.length > 1 ? 's' : ''}`
                : 'No hay imágenes disponibles'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[400px] rounded-lg" />
            ) : images.length > 0 ? (
              <div className="space-y-4">
                {/* Imagen principal (seleccionada o más reciente) */}
                {/* Imagen principal (seleccionada o más reciente) */}
                {selectedImage && (
                  <div
                    className="relative w-full rounded-lg overflow-hidden border-2 border-primary bg-muted h-[400px] flex items-center justify-center"
                    ref={imageContainerRef}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                  >
                    {imageError ? (
                      <div className="flex items-center justify-center flex-col gap-2 text-muted-foreground">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                        <p>Error al cargar la imagen</p>
                      </div>
                    ) : (
                      <div
                        className="transition-transform duration-75 ease-out"
                        style={{
                          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
                        }}
                        onClick={() => {
                          if (zoom === 1) setZoom(1.5) // Click to zoom in if not zoomed
                        }}
                      >
                        <img
                          src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${selectedImage.url}`}
                          alt={`Detección EPP - ${selectedImage.filename}`}
                          className="max-w-full max-h-[400px] object-contain select-none"
                          draggable={false}
                          onError={() => setImageError(true)}
                          onLoad={() => setImageError(false)}
                        />
                      </div>
                    )}

                    {/* Controles de Zoom */}
                    <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground select-none"
                        onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(1, z - 0.5)) }}
                      >
                        -
                      </Badge>
                      <Badge variant="outline" className="bg-background/80 backdrop-blur select-none">
                        {Math.round(zoom * 100)}%
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground select-none"
                        onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(5, z + 0.5)) }}
                      >
                        +
                      </Badge>
                      {zoom > 1 && (
                        <Badge
                          variant="destructive"
                          className="cursor-pointer select-none"
                          onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }) }}
                        >
                          Reset
                        </Badge>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant={selectedImage.hasDetections ? 'default' : 'secondary'}>
                        {selectedImage.hasDetections ? 'Con detecciones' : 'Sin detecciones'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs z-10">
                      {format(new Date(selectedImage.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </div>
                  </div>
                )}

                {/* Galería de miniaturas (scroll horizontal) */}
                {images.length > 1 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Todas las imágenes ({images.length})</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((image) => {
                        const imageUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${image.url}`
                        // Verificar si tiene detecciones negativas
                        const hasNegativeDetections = image.detections && (
                          image.detections['no casco'] > 0 ||
                          image.detections['no chaleco'] > 0 ||
                          image.detections['no guante'] > 0
                        )
                        return (
                          <div
                            key={image.filename}
                            onClick={() => setSelectedImage(image)}
                            className={cn(
                              'relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105',
                              selectedImage?.filename === image.filename ? 'border-primary ring-2 ring-primary/50' : hasNegativeDetections ? 'border-red-500' : 'border-border',
                              !image.hasDetections && 'opacity-60',
                            )}
                          >
                            <img
                              src={imageUrl}
                              alt={image.filename}
                              className="w-full h-full object-cover"
                            />
                            {!image.hasDetections && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-xs text-white">Sin detecciones</span>
                              </div>
                            )}
                            {hasNegativeDetections && (
                              <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                !
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-1 py-0.5 text-[10px] text-center">
                              {format(new Date(image.timestamp), 'HH:mm', { locale: es })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Esperando imagen de la cámara...</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Las imágenes aparecerán aquí una vez procesadas
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cards de contadores */}
        <div className="space-y-4">
          {/* Casco */}
          <Card className={cn(totalDetections['no casco'] > 0 && 'border-red-500 border-2')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <HardHat className="h-5 w-5" />
                Cascos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {totalDetections.casco}
                </span>
                <span className="text-sm text-muted-foreground">detectados</span>
              </div>
              {totalDetections['no casco'] > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-semibold">
                  ⚠️ {totalDetections['no casco']} sin casco
                </p>
              )}
              {images.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  En {images.length} imagen{images.length > 1 ? 'es' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Chaleco */}
          <Card className={cn(totalDetections['no chaleco'] > 0 && 'border-red-500 border-2')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Chalecos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {totalDetections.chaleco}
                </span>
                <span className="text-sm text-muted-foreground">detectados</span>
              </div>
              {totalDetections['no chaleco'] > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-semibold">
                  ⚠️ {totalDetections['no chaleco']} sin chaleco
                </p>
              )}
              {images.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  En {images.length} imagen{images.length > 1 ? 'es' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Guantes */}
          <Card className={cn(totalDetections['no guante'] > 0 && 'border-amber-500 border-2')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hand className="h-5 w-5" />
                Guantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {totalDetections.guante}
                </span>
                <span className="text-sm text-muted-foreground">detectados</span>
              </div>
              {totalDetections['no guante'] > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 font-semibold">
                  ⚠️ {totalDetections['no guante']} sin guantes
                </p>
              )}
              {images.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  En {images.length} imagen{images.length > 1 ? 'es' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Información adicional */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Detección</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Zapatos de Seguridad</p>
                <p className="text-lg font-semibold">{status.detections.zapato}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant={status.isCompliant ? 'default' : 'destructive'}>
                  {status.isCompliant ? 'Cumplimiento OK' : 'Falta EPP'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última actualización</p>
                <p className="text-lg font-semibold">
                  {format(new Date(status.timestamp), 'HH:mm:ss', { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Elementos faltantes</p>
                <p className="text-lg font-semibold">
                  {status.missingItems.length > 0 ? status.missingItems.join(', ') : 'Ninguno'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state inicial */}
      {loading && !status && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Cargando estado del sistema...</p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default EppMonitor



