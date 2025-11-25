/**
 * PhotoEditor - Editor básico de fotos (crop, rotate, brightness, contrast)
 */

import { useState, useRef, useEffect } from 'react'
import { RotateCw, Sun, Contrast, Check, X, Maximize2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Slider } from '@/shared/components/ui/slider'
import { hapticFeedback } from '../hooks/useGestures'

export interface PhotoEditorProps {
  /** URL de la imagen a editar */
  imageUrl: string
  /** Callback cuando se guarda la edición */
  onSave: (editedImageUrl: string) => void
  /** Callback para cancelar */
  onCancel: () => void
}

const PhotoEditor = ({ imageUrl, onSave, onCancel }: PhotoEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)

  // Cargar imagen
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      drawImage()
    }
    img.src = imageUrl
  }, [imageUrl])

  // Redibujar cuando cambian los ajustes
  useEffect(() => {
    if (imageRef.current) {
      drawImage()
    }
  }, [rotation, brightness, contrast])

  const drawImage = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calcular dimensiones con rotación
    const rad = (rotation * Math.PI) / 180
    const cos = Math.abs(Math.cos(rad))
    const sin = Math.abs(Math.sin(rad))
    const newWidth = img.width * cos + img.height * sin
    const newHeight = img.width * sin + img.height * cos

    canvas.width = newWidth
    canvas.height = newHeight

    // Aplicar filtros
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`

    // Rotar y dibujar
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(rad)
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
    ctx.restore()
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          onSave(url)
          hapticFeedback('success')
        }
      },
      'image/jpeg',
      0.92,
    )
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
    hapticFeedback('light')
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Controles */}
      <div className="p-4 space-y-4 bg-gradient-to-t from-black/90 to-black/70">
        {/* Rotación */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              <span className="text-sm">Rotación</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
            >
              Rotar 90°
            </Button>
          </div>
        </div>

        {/* Brillo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span className="text-sm">Brillo</span>
            </div>
            <span className="text-sm text-white/70">{brightness}%</span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={([value]) => {
              setBrightness(value)
              hapticFeedback('light')
            }}
            min={0}
            max={200}
            step={1}
            className="w-full"
          />
        </div>

        {/* Contraste */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Contrast className="h-4 w-4" />
              <span className="text-sm">Contraste</span>
            </div>
            <span className="text-sm text-white/70">{contrast}%</span>
          </div>
          <Slider
            value={[contrast]}
            onValueChange={([value]) => {
              setContrast(value)
              hapticFeedback('light')
            }}
            min={0}
            max={200}
            step={1}
            className="w-full"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Check className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PhotoEditor

