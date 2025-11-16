/**
 * SignaturePreview - Preview de firma guardada con opciones de editar/eliminar
 */

import { useState } from 'react'
import { Edit2, Trash2, Maximize2, X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/shared/components/ui/dialog'
import { hapticFeedback } from '../hooks/useGestures'

export interface SignaturePreviewProps {
  /** URL de la firma (base64) */
  signatureUrl: string
  /** Callback para editar */
  onEdit?: () => void
  /** Callback para eliminar */
  onDelete?: () => void
  /** Si está deshabilitado */
  disabled?: boolean
  /** Tamaño del thumbnail */
  thumbnailSize?: 'sm' | 'md' | 'lg'
}

const SignaturePreview = ({
  signatureUrl,
  onEdit,
  onDelete,
  disabled = false,
  thumbnailSize = 'md',
}: SignaturePreviewProps) => {
  const [showFullSize, setShowFullSize] = useState(false)

  const sizeClasses = {
    sm: 'h-16',
    md: 'h-24',
    lg: 'h-32',
  }

  const handleEdit = () => {
    if (disabled || !onEdit) return
    hapticFeedback('light')
    onEdit()
  }

  const handleDelete = () => {
    if (disabled || !onDelete) return
    hapticFeedback('medium')
    if (confirm('¿Estás seguro de que quieres eliminar esta firma?')) {
      onDelete()
    }
  }

  const handleViewFullSize = () => {
    hapticFeedback('light')
    setShowFullSize(true)
  }

  return (
    <>
      <div className="relative inline-block">
        {/* Thumbnail */}
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed border-gray-300 bg-white overflow-hidden cursor-pointer group',
            sizeClasses[thumbnailSize],
            'w-auto aspect-video',
            !disabled && 'hover:border-primary transition-colors',
          )}
          onClick={handleViewFullSize}
        >
          <img
            src={signatureUrl}
            alt="Firma digital"
            className="w-full h-full object-contain"
          />

          {/* Overlay con acciones */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewFullSize()
                }}
                className="bg-white/80 text-black hover:bg-white"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit()
                  }}
                  className="bg-blue-500/80 text-white hover:bg-blue-600/80"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                  className="bg-red-500/80 text-white hover:bg-red-600/80"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal full size */}
      <Dialog open={showFullSize} onOpenChange={setShowFullSize}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <div className="relative bg-white rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Firma digital</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFullSize(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Imagen */}
            <div className="p-8 flex items-center justify-center bg-gray-50 min-h-[400px]">
              <img
                src={signatureUrl}
                alt="Firma digital - vista completa"
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>

            {/* Footer con acciones */}
            {!disabled && (
              <div className="flex items-center justify-center gap-2 p-4 border-t">
                {onEdit && (
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                )}
                {onDelete && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SignaturePreview

