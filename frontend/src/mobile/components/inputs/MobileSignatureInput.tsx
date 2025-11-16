/**
 * MobileSignatureInput - Canvas para firma digital
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Pen, RotateCcw, X, Check, AlertCircle, Maximize2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { hapticFeedback } from '../../hooks/useGestures'
import './inputStyles.css'

export interface MobileSignatureInputProps {
  /** Valor (base64 de la imagen) */
  value: string | null
  /** Callback cuando cambia el valor */
  onChange: (value: string | null) => void
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
  /** Ancho del canvas */
  width?: number
  /** Alto del canvas */
  height?: number
  /** ID del campo */
  id?: string
  /** Name del campo */
  name?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileSignatureInput = ({
  value,
  onChange,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  width = 400,
  height = 200,
  id,
  name,
  onBlur,
  onFocus,
}: MobileSignatureInputProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(!!value)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar canvas
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Estilos de dibujo
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Cargar firma existente si hay
    if (value) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
        setHasSignature(true)
      }
      img.src = value
    } else {
      // Línea guía
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, rect.height * 0.8)
      ctx.lineTo(rect.width, rect.height * 0.8)
      ctx.stroke()
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
    }
  }, [value, isOpen])

  // Inicializar canvas de firma (preview)
  useEffect(() => {
    const canvas = signatureCanvasRef.current
    if (!canvas || !value) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = 200
      canvas.height = 100
      ctx.drawImage(img, 0, 0, 200, 100)
    }
    img.src = value
  }, [value])

  const getPointFromEvent = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY

    if (clientX === undefined || clientY === undefined) return null

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const point = getPointFromEvent(e)
    if (!point) return

    setIsDrawing(true)
    lastPointRef.current = point
    hapticFeedback('light')
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPointRef.current) return

    const point = getPointFromEvent(e)
    if (!point) return

    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()

    lastPointRef.current = point
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    lastPointRef.current = null
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redibujar línea guía
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, rect.height * 0.8)
    ctx.lineTo(rect.width, rect.height * 0.8)
    ctx.stroke()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2

    setHasSignature(false)
    hapticFeedback('light')
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataURL = canvas.toDataURL('image/png')
    onChange(dataURL)
    setIsOpen(false)
    onBlur?.()
    hapticFeedback('success')
  }

  const handleOpen = () => {
    if (disabled) return
    setIsOpen(true)
    onFocus?.()
  }

  const handleClose = () => {
    setIsOpen(false)
    onBlur?.()
  }

  const inputId = id || `mobile-signature-input-${name || Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="mobile-input-container">
      {label && (
        <label htmlFor={inputId} className="mobile-input-label">
          {label}
          {required && <span className="mobile-input-label-required">*</span>}
        </label>
      )}

      {/* Preview o botón para abrir */}
      {value ? (
        <div className="space-y-2">
          <div className="relative rounded-xl border border-input bg-background p-4">
            <canvas
              ref={signatureCanvasRef}
              className="w-full h-32 border border-dashed border-muted-foreground/20 rounded-lg"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleOpen}
                className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 hover:opacity-100 transition-opacity rounded-lg"
              >
                <Maximize2 className="h-6 w-6 text-muted-foreground" />
              </button>
            )}
          </div>
          {!disabled && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleOpen}
                className="flex-1"
              >
                Editar firma
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onChange(null)
                  setHasSignature(false)
                }}
              >
                Eliminar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          id={inputId}
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={cn(
            inputBaseClasses,
            getInputStateClasses(error, false, false, false),
            'flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[200px]',
            disabled && 'cursor-not-allowed',
          )}
        >
          <Pen className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">Firmar aquí</span>
          <span className="text-xs text-muted-foreground">Toca para abrir el editor de firma</span>
        </button>
      )}

      {/* Modal de firma */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Firma digital</DialogTitle>
            <DialogDescription>
              Firma en el área de abajo. Gira tu dispositivo horizontalmente para mejor experiencia.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col p-6">
            {/* Canvas */}
            <div className="flex-1 relative border-2 border-dashed border-input rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ touchAction: 'none' }}
              />
            </div>

            {/* Controles */}
            <div className="flex items-center justify-between gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={clear}
                disabled={!hasSignature}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpiar
              </Button>

              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={save}
                  disabled={!hasSignature}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Helper text */}
      {helperText && !error && (
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

export default MobileSignatureInput

