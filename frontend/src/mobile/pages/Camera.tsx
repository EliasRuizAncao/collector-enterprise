import { Camera } from 'lucide-react'

/**
 * Cámara - Mobile
 * Vista para captura de fotos/videos desde la cámara
 * TODO: Implementar acceso a cámara con MediaDevices API
 */
const MobileCamera = () => {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Cámara</h1>
        <p className="text-muted-foreground">
          Vista para captura de fotos y videos
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          TODO: Implementar acceso a cámara
        </p>
      </div>
    </div>
  )
}

export default MobileCamera

