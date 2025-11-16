/**
 * CameraCapture - Componente de captura de fotos optimizado para mobile
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  Camera,
  RotateCcw,
  Zap,
  ZapOff,
  Grid,
  ZoomIn,
  ZoomOut,
  Check,
  X as XIcon,
  Loader2,
  AlertCircle,
  Settings,
  Image as ImageIcon,
  Maximize2,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Slider } from '@/shared/components/ui/slider'
import { Progress } from '@/shared/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { hapticFeedback } from '../hooks/useGestures'
import {
  supportsCamera,
  checkCameraPermission,
  getCameraStream,
  stopCameraStream,
  capturePhotoFromStream,
  switchCamera,
  playShutterSound,
  type CameraFacingMode,
  type FlashMode,
} from '../utils/cameraUtils'
import {
  compressImage,
  formatFileSize,
  type CompressionResult,
} from '../utils/imageCompression'
import { dataManager } from '../utils/dataManager'
import PhotoEditor from './PhotoEditor'

export interface CapturedPhoto {
  id: string
  file: File
  previewUrl: string
  compressed?: CompressionResult
  metadata?: {
    width: number
    height: number
    timestamp: Date
    geolocation?: {
      latitude: number
      longitude: number
    }
  }
}

export interface CameraCaptureProps {
  /** Callback cuando se capturan fotos */
  onCapture: (photos: File[]) => void
  /** Callback para cerrar */
  onClose: () => void
  /** Máximo de fotos (default: 1) */
  maxPhotos?: number
  /** Calidad de compresión (0-1, default: 0.8) */
  compressQuality?: number
  /** Si está abierto */
  open?: boolean
}

const CameraCapture = ({
  onCapture,
  onClose,
  maxPhotos = 1,
  compressQuality = 0.8,
  open = true,
}: CameraCaptureProps) => {
  // Estado de cámara
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Estado de captura
  const [facingMode, setFacingMode] = useState<CameraFacingMode>('environment')
  const [flashMode, setFlashMode] = useState<FlashMode>('auto')
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(false)
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [previewPhoto, setPreviewPhoto] = useState<CapturedPhoto | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Inicializar cámara
  useEffect(() => {
    if (!open) return

    const initCamera = async () => {
      setIsLoading(true)
      setCameraError(null)

      // Verificar soporte
      if (!supportsCamera()) {
        setCameraError('Tu navegador no soporta acceso a cámara')
        setIsLoading(false)
        return
      }

      // Verificar permisos
      const permission = await checkCameraPermission()
      setPermissionState(permission)

      if (permission === 'denied') {
        setCameraError('Permiso de cámara denegado. Por favor habilítalo en configuración.')
        setIsLoading(false)
        return
      }

      // Obtener stream
      try {
        const cameraStream = await getCameraStream({ facingMode, flashMode, zoom })
        setStream(cameraStream)

        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream
        }

        setIsLoading(false)
      } catch (error: any) {
        console.error('Error al acceder a cámara:', error)
        setCameraError(
          error.name === 'NotAllowedError'
            ? 'Permiso de cámara denegado'
            : error.name === 'NotFoundError'
              ? 'No se encontró cámara'
              : 'Error al acceder a cámara',
        )
        setIsLoading(false)
      }
    }

    initCamera()

    // Cleanup
    return () => {
      if (stream) {
        stopCameraStream(stream)
      }
    }
  }, [open, facingMode, flashMode, zoom])

  // Limpiar stream al cerrar
  useEffect(() => {
    if (!open && stream) {
      stopCameraStream(stream)
      setStream(null)
    }
  }, [open, stream])

  // Capturar foto
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || isCapturing || capturedPhotos.length >= maxPhotos) return

    setIsCapturing(true)
    hapticFeedback('medium')
    playShutterSound()

    try {
      // Capturar desde video
      const blob = await capturePhotoFromStream(videoRef.current, 0.92)
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })

      // Crear objeto de foto
      const photo: CapturedPhoto = {
        id: `photo-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(blob),
        metadata: {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
          timestamp: new Date(),
        },
      }

      // Mostrar preview
      setPreviewPhoto(photo)

      // Auto-aceptar después de 3 segundos si es single photo
      if (maxPhotos === 1) {
        setTimeout(() => {
          handleUsePhoto(photo)
        }, 3000)
      }
    } catch (error) {
      console.error('Error al capturar foto:', error)
      hapticFeedback('error')
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, capturedPhotos.length, maxPhotos])

  // Usar foto
  const handleUsePhoto = async (photo: CapturedPhoto) => {
    setIsCompressing(true)

    try {
      // Comprimir foto
      // Usar dataManager para compresión (respeta settings de usuario)
      const settings = dataManager.getSettings()
      const compressed = await dataManager.compressImageForStorage(photo.file, {
        quality: settings.photoQuality,
        maxDimension: 1920,
        convertToWebP: true,
      })
      
      // Convertir File a CompressionResult para compatibilidad
      const compressionResult: CompressionResult = {
        file: compressed,
        originalSize: photo.file.size,
        compressedSize: compressed.size,
        reductionPercent: ((photo.file.size - compressed.size) / photo.file.size) * 100,
        previewUrl: URL.createObjectURL(compressed),
      }

      const updatedPhoto: CapturedPhoto = {
        ...photo,
        file: compressed, // Usar archivo comprimido
        compressed: compressionResult,
        previewUrl: compressionResult.previewUrl, // Actualizar preview URL
      }

      const newPhotos = [...capturedPhotos, updatedPhoto]
      setCapturedPhotos(newPhotos)
      setPreviewPhoto(null)

      // Si alcanzó el máximo, finalizar
      if (newPhotos.length >= maxPhotos) {
        handleFinish()
      }
    } catch (error) {
      console.error('Error al comprimir foto:', error)
      // Usar foto sin comprimir
      const newPhotos = [...capturedPhotos, photo]
      setCapturedPhotos(newPhotos)
      setPreviewPhoto(null)
    } finally {
      setIsCompressing(false)
    }
  }

  // Retomar foto
  const handleRetake = () => {
    if (previewPhoto) {
      URL.revokeObjectURL(previewPhoto.previewUrl)
      setPreviewPhoto(null)
      setIsEditing(false)
    }
  }

  // Guardar edición
  const handleSaveEdit = (editedImageUrl: string) => {
    if (!previewPhoto) return

    // Convertir URL editada a File
    fetch(editedImageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const editedFile = new File([blob], previewPhoto.file.name, {
          type: previewPhoto.file.type,
        })

        const editedPhoto: CapturedPhoto = {
          ...previewPhoto,
          file: editedFile,
          previewUrl: editedImageUrl,
        }

        setPreviewPhoto(editedPhoto)
        setIsEditing(false)
      })
      .catch((error) => {
        console.error('Error al guardar edición:', error)
      })
  }

  // Cambiar cámara
  const handleSwitchCamera = async () => {
    if (!stream) return

    const newFacingMode: CameraFacingMode = facingMode === 'user' ? 'environment' : 'user'
    hapticFeedback('light')

    try {
      const newStream = await switchCamera(stream, newFacingMode)
      setStream(newStream)
      setFacingMode(newFacingMode)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
    } catch (error) {
      console.error('Error al cambiar cámara:', error)
    }
  }

  // Cambiar flash
  const handleToggleFlash = () => {
    const modes: FlashMode[] = ['auto', 'on', 'off']
    const currentIndex = modes.indexOf(flashMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setFlashMode(nextMode)
    hapticFeedback('light')
  }

  // Finalizar captura
  const handleFinish = () => {
    const files = capturedPhotos.map((photo) => photo.compressed?.file || photo.file)
    onCapture(files)

    // Limpiar URLs
    capturedPhotos.forEach((photo) => {
      URL.revokeObjectURL(photo.previewUrl)
      if (photo.compressed) {
        URL.revokeObjectURL(photo.compressed.previewUrl)
      }
    })

    onClose()
  }

  // Eliminar foto
  const handleDeletePhoto = (photoId: string) => {
    const photo = capturedPhotos.find((p) => p.id === photoId)
    if (photo) {
      URL.revokeObjectURL(photo.previewUrl)
      if (photo.compressed) {
        URL.revokeObjectURL(photo.compressed.previewUrl)
      }
    }

    setCapturedPhotos(capturedPhotos.filter((p) => p.id !== photoId))
    hapticFeedback('light')
  }

  // Reordenar fotos (drag)
  const handleReorderPhotos = (fromIndex: number, toIndex: number) => {
    const newPhotos = [...capturedPhotos]
    const [removed] = newPhotos.splice(fromIndex, 1)
    newPhotos.splice(toIndex, 0, removed)
    setCapturedPhotos(newPhotos)
  }

  // Fallback: file input
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const photos: CapturedPhoto[] = []

    for (const file of files.slice(0, maxPhotos - capturedPhotos.length)) {
      const photo: CapturedPhoto = {
        id: `photo-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }
      photos.push(photo)
    }

    setCapturedPhotos([...capturedPhotos, ...photos])
  }

  // Abrir configuración (para permisos)
  const handleOpenSettings = () => {
    // En mobile, no hay forma directa de abrir settings
    // Mostrar instrucciones
    alert(
      'Para habilitar la cámara:\n\n' +
        'iOS: Configuración → Safari → Cámara → Permitir\n' +
        'Android: Configuración → Apps → Collector → Permisos → Cámara',
    )
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-screen max-h-screen p-0 m-0 rounded-none">
        <div className="relative w-full h-full flex flex-col bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 safe-area-top">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
            >
              <X className="h-6 w-6" />
            </Button>

            {capturedPhotos.length > 0 && (
              <div className="bg-black/50 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                {capturedPhotos.length} / {maxPhotos}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGrid(!showGrid)}
                className={cn(
                  'bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm',
                  showGrid && 'bg-primary/50',
                )}
              >
                <Grid className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Video preview */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 text-white">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p>Cargando cámara...</p>
              </div>
            ) : cameraError ? (
              <div className="flex flex-col items-center justify-center gap-4 p-8 text-white text-center">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <p className="text-lg font-medium">{cameraError}</p>
                {permissionState === 'denied' && (
                  <Button onClick={handleOpenSettings} variant="outline" className="mt-4">
                    <Settings className="mr-2 h-4 w-4" />
                    Abrir configuración
                  </Button>
                )}
                <div className="mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple={maxPhotos > 1}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Seleccionar desde galería
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Grid overlay */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i}
                          className="border border-white/30"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview de foto capturada */}
                {previewPhoto && !isEditing && (
                  <div className="absolute inset-0 bg-black flex flex-col">
                    <img
                      src={previewPhoto.previewUrl}
                      alt="Preview"
                      className="flex-1 w-full object-contain"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleRetake}
                          className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                        >
                          <RotateCcw className="mr-2 h-5 w-5" />
                          Retomar
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setIsEditing(true)}
                          className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                        >
                          <Maximize2 className="mr-2 h-5 w-5" />
                          Editar
                        </Button>
                        <Button
                          size="lg"
                          onClick={() => handleUsePhoto(previewPhoto)}
                          disabled={isCompressing}
                        >
                          {isCompressing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-5 w-5" />
                          )}
                          Usar foto
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editor de foto */}
                {previewPhoto && isEditing && (
                  <div className="absolute inset-0 bg-black">
                    <PhotoEditor
                      imageUrl={previewPhoto.previewUrl}
                      onSave={handleSaveEdit}
                      onCancel={() => setIsEditing(false)}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controles */}
          {!isLoading && !cameraError && !previewPhoto && (
            <div className="absolute bottom-0 left-0 right-0 p-4 safe-area-bottom">
              {/* Thumbnails de fotos capturadas */}
              {capturedPhotos.length > 0 && (
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                  {capturedPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-white"
                    >
                      <img
                        src={photo.compressed?.previewUrl || photo.previewUrl}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Controles de cámara */}
              <div className="flex items-center justify-between">
                {/* Switch camera */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSwitchCamera}
                  className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                >
                  <RotateCcw className="h-6 w-6" />
                </Button>

                {/* Botón de captura */}
                <button
                  onClick={handleCapture}
                  disabled={isCapturing || capturedPhotos.length >= maxPhotos}
                  className={cn(
                    'w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm',
                    'flex items-center justify-center',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'active:scale-95 transition-transform',
                  )}
                >
                  {isCapturing ? (
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white" />
                  )}
                </button>

                {/* Flash toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFlash}
                  className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                >
                  {flashMode === 'off' ? (
                    <ZapOff className="h-6 w-6" />
                  ) : flashMode === 'on' ? (
                    <Zap className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <Zap className="h-6 w-6" />
                  )}
                </Button>
              </div>

              {/* Botón finalizar */}
              {capturedPhotos.length > 0 && (
                <div className="mt-4">
                  <Button
                    onClick={handleFinish}
                    className="w-full"
                    size="lg"
                  >
                    Finalizar ({capturedPhotos.length} foto{capturedPhotos.length > 1 ? 's' : ''})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CameraCapture

