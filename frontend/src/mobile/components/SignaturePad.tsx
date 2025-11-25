/**
 * SignaturePad - Componente de firma digital optimizado para mobile
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  Check,
  RotateCcw,
  Undo2,
  Palette,
  Minus,
  Maximize2,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { hapticFeedback } from '../hooks/useGestures'
import { isMobileDevice } from '../utils/deviceDetector'

export interface SignatureData {
  /** Base64 de la imagen PNG */
  dataUrl: string
  /** Timestamp de creación */
  timestamp: Date
  /** Información del dispositivo */
  deviceInfo?: {
    userAgent: string
    platform: string
    screenWidth: number
    screenHeight: number
  }
}

export interface SignaturePadProps {
  /** Callback cuando se guarda la firma */
  onSave: (signature: SignatureData) => void
  /** Callback para cerrar */
  onClose: () => void
  /** Firma existente (si hay) */
  value?: string | null
  /** Si está abierto */
  open?: boolean
  /** Validar que la firma no esté vacía */
  validate?: boolean
  /** Mínimo de trazos requeridos */
  minStrokes?: number
}

type PenColor = 'black' | 'blue'
type PenSize = 'thin' | 'medium' | 'thick'

interface Point {
  x: number
  y: number
  pressure?: number
}

interface Stroke {
  points: Point[]
  color: PenColor
  size: PenSize
}

const SignaturePad = ({
  onSave,
  onClose,
  value,
  open = true,
  validate = true,
  minStrokes = 1,
}: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [penColor, setPenColor] = useState<PenColor>('black')
  const [penSize, setPenSize] = useState<PenSize>('medium')
  const [isLandscape, setIsLandscape] = useState(false)
  const [showOrientationHint, setShowOrientationHint] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Configuración de lápiz
  const penConfig = {
    black: { thin: 1.5, medium: 2.5, thick: 4 },
    blue: { thin: 1.5, medium: 2.5, thick: 4 },
  }

  // Inicializar canvas
  useEffect(() => {
    if (!open || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // Configurar tamaño del canvas
    const updateCanvasSize = () => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      // Redibujar si hay strokes
      if (strokes.length > 0 || value) {
        redrawCanvas()
      } else {
        drawGuideLine(ctx, rect.width, rect.height)
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    window.addEventListener('orientationchange', updateCanvasSize)

    // Cargar firma existente si hay
    if (value) {
      loadExistingSignature(value)
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      window.removeEventListener('orientationchange', updateCanvasSize)
    }
  }, [open, value])

  // Detectar orientación
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight
      setIsLandscape(isLandscapeMode)

      // Mostrar hint si está en portrait y es mobile
      if (isMobileDevice() && !isLandscapeMode && strokes.length === 0) {
        setShowOrientationHint(true)
        setTimeout(() => setShowOrientationHint(false), 5000)
      }
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [strokes.length])

  // Redibujar canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redibujar todos los strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke)
    })

    // Dibujar stroke actual
    if (currentStroke.length > 0) {
      const tempStroke: Stroke = {
        points: currentStroke,
        color: penColor,
        size: penSize,
      }
      drawStroke(ctx, tempStroke)
    }

    // Si no hay nada, dibujar línea guía
    if (strokes.length === 0 && currentStroke.length === 0 && !value) {
      const rect = canvas.getBoundingClientRect()
      drawGuideLine(ctx, rect.width, rect.height)
    }
  }, [strokes, currentStroke, penColor, penSize, value])

  // Dibujar línea guía
  const drawGuideLine = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, height * 0.8)
    ctx.lineTo(width, height * 0.8)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Dibujar un stroke
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return

    const size = penConfig[stroke.color][stroke.size]
    ctx.strokeStyle = stroke.color === 'black' ? '#000000' : '#2563eb'
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Usar cuadrática de Bézier para líneas suaves
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1]
      const curr = stroke.points[i]

      if (i === 1) {
        ctx.lineTo(curr.x, curr.y)
      } else {
        const midX = (prev.x + curr.x) / 2
        const midY = (prev.y + curr.y) / 2
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY)
      }
    }

    ctx.stroke()
  }

  // Cargar firma existente
  const loadExistingSignature = (dataUrl: string) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const rect = canvas.getBoundingClientRect()
      ctx.drawImage(img, 0, 0, rect.width, rect.height)
    }
    img.src = dataUrl
  }

  // Obtener punto desde evento
  const getPointFromEvent = (e: React.TouchEvent | React.MouseEvent): Point | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    let clientX: number
    let clientY: number
    let pressure = 0.5

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      if (!touch) return null
      clientX = touch.clientX
      clientY = touch.clientY
      // Intentar obtener presión (si está disponible)
      pressure = (touch as any).force || 0.5
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width / dpr),
      y: (clientY - rect.top) * (canvas.height / rect.height / dpr),
      pressure,
    }
  }

  // Iniciar dibujo
  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const point = getPointFromEvent(e)
    if (!point) return

    setIsDrawing(true)
    setCurrentStroke([point])
    setValidationError(null)
    hapticFeedback('light')
  }

  // Dibujar
  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return
    e.preventDefault()

    const point = getPointFromEvent(e)
    if (!point) return

    setCurrentStroke((prev) => {
      const newStroke = [...prev, point]
      
      // Redibujar inmediatamente para feedback visual usando requestAnimationFrame
      requestAnimationFrame(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (canvas && ctx) {
          // Limpiar y redibujar
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          
          // Redibujar todos los strokes guardados
          strokes.forEach((s) => drawStroke(ctx, s))
          
          // Dibujar stroke actual
          if (newStroke.length > 0) {
            const tempStroke: Stroke = {
              points: newStroke,
              color: penColor,
              size: penSize,
            }
            drawStroke(ctx, tempStroke)
          }
        }
      })
      
      return newStroke
    })
  }

  // Finalizar dibujo
  const handleEnd = () => {
    if (!isDrawing) return

    if (currentStroke.length > 0) {
      const newStroke: Stroke = {
        points: [...currentStroke],
        color: penColor,
        size: penSize,
      }
      setStrokes((prev) => [...prev, newStroke])
      setCurrentStroke([])
    }

    setIsDrawing(false)
  }

  // Limpiar canvas
  const handleClear = () => {
    setStrokes([])
    setCurrentStroke([])
    setValidationError(null)
    hapticFeedback('light')

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const rect = canvas.getBoundingClientRect()
      drawGuideLine(ctx, rect.width, rect.height)
    }
  }

  // Deshacer último trazo
  const handleUndo = () => {
    if (strokes.length === 0) return

    setStrokes((prev) => prev.slice(0, -1))
    hapticFeedback('light')
    setTimeout(redrawCanvas, 0)
  }

  // Validar firma
  const validateSignature = (): boolean => {
    if (!validate) return true

    if (strokes.length < minStrokes) {
      setValidationError(`La firma debe tener al menos ${minStrokes} trazo${minStrokes > 1 ? 's' : ''}`)
      return false
    }

    // Verificar que la firma no sea muy pequeña
    const canvas = canvasRef.current
    if (!canvas) return false

    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let nonTransparentPixels = 0

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) {
        nonTransparentPixels++
      }
    }

    const coverage = nonTransparentPixels / (canvas.width * canvas.height)
    if (coverage < 0.001) {
      setValidationError('La firma es muy pequeña. Por favor, firme más grande.')
      return false
    }

    return true
  }

  // Guardar firma
  const handleSave = async () => {
    if (!validateSignature()) {
      hapticFeedback('error')
      return
    }

    setIsSaving(true)

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      // Exportar a PNG con fondo transparente
      const dataUrl = canvas.toDataURL('image/png')

      // Comprimir si es muy grande (>500KB)
      let finalDataUrl = dataUrl
      if (dataUrl.length > 500 * 1024) {
        // Comprimir usando canvas con calidad reducida
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) {
          const img = new Image()
          await new Promise((resolve) => {
            img.onload = () => {
              tempCanvas.width = img.width
              tempCanvas.height = img.height
              tempCtx.drawImage(img, 0, 0)
              finalDataUrl = tempCanvas.toDataURL('image/png', 0.9)
              resolve(null)
            }
            img.src = dataUrl
          })
        }
      }

      const signatureData: SignatureData = {
        dataUrl: finalDataUrl,
        timestamp: new Date(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
        },
      }

      onSave(signatureData)
      hapticFeedback('success')
    } catch (error) {
      console.error('Error al guardar firma:', error)
      hapticFeedback('error')
    } finally {
      setIsSaving(false)
    }
  }

  // Redibujar cuando cambian strokes o currentStroke
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redibujar todos los strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke)
    })

    // Dibujar stroke actual
    if (currentStroke.length > 0) {
      const tempStroke: Stroke = {
        points: currentStroke,
        color: penColor,
        size: penSize,
      }
      drawStroke(ctx, tempStroke)
    }

    // Si no hay nada, dibujar línea guía
    if (strokes.length === 0 && currentStroke.length === 0 && !value) {
      const rect = canvas.getBoundingClientRect()
      drawGuideLine(ctx, rect.width, rect.height)
    }
  }, [strokes, currentStroke, penColor, penSize, value])

  if (!open) return null

  const hasSignature = strokes.length > 0 || value

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-screen max-h-screen p-0 m-0 rounded-none">
        <div className="relative w-full h-full flex flex-col bg-white">
          {/* Header */}
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>Firma digital</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <DialogDescription>
              {isLandscape
                ? 'Firme en el área de abajo'
                : 'Gira tu dispositivo horizontalmente para mejor experiencia'}
            </DialogDescription>
          </DialogHeader>

          {/* Controles */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              {/* Color picker */}
              <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
                <button
                  type="button"
                  onClick={() => {
                    setPenColor('black')
                    hapticFeedback('light')
                  }}
                  className={cn(
                    'w-8 h-8 rounded border-2 transition-all',
                    penColor === 'black'
                      ? 'border-primary bg-black scale-110'
                      : 'border-gray-300 bg-black hover:scale-105',
                  )}
                  aria-label="Color negro"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPenColor('blue')
                    hapticFeedback('light')
                  }}
                  className={cn(
                    'w-8 h-8 rounded border-2 transition-all',
                    penColor === 'blue'
                      ? 'border-primary bg-blue-600 scale-110'
                      : 'border-gray-300 bg-blue-600 hover:scale-105',
                  )}
                  aria-label="Color azul"
                />
              </div>

              {/* Tamaño de lápiz */}
              <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
                {(['thin', 'medium', 'thick'] as PenSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPenSize(size)
                      hapticFeedback('light')
                    }}
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium transition-all',
                      penSize === size
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100',
                    )}
                    aria-label={`Tamaño ${size}`}
                  >
                    {size === 'thin' && <Minus className="h-3 w-3" />}
                    {size === 'medium' && <Minus className="h-4 w-4" />}
                    {size === 'thick' && <Minus className="h-5 w-5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Undo */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                aria-label="Deshacer último trazo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>

              {/* Clear */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleClear}
                disabled={!hasSignature}
                aria-label="Limpiar"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Canvas container */}
          <div
            ref={containerRef}
            className="flex-1 relative bg-white overflow-hidden"
            style={{ touchAction: 'none' }}
          >
            {/* Hint de orientación */}
            {showOrientationHint && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg p-6 text-center max-w-xs mx-4">
                  <Maximize2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                  <p className="font-medium mb-2">Mejor experiencia en horizontal</p>
                  <p className="text-sm text-gray-600">
                    Gira tu dispositivo para una mejor experiencia de firma
                  </p>
                </div>
              </div>
            )}

            {/* Instrucción */}
            {!hasSignature && !isDrawing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-lg">Firme aquí</p>
              </div>
            )}

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full touch-none"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              aria-label="Área de firma digital"
            />

            {/* Error de validación */}
            {validationError && (
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 flex-1">{validationError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 safe-area-bottom">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={!hasSignature || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Guardar firma
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SignaturePad

