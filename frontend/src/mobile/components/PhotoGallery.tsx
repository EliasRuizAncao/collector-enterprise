/**
 * PhotoGallery - Galería de fotos con lightbox
 */

import { useState, useEffect, useRef } from 'react'
import { X, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { useSwipe } from '../hooks/useGestures'
import { hapticFeedback } from '../hooks/useGestures'

export interface Photo {
  id: string
  url: string
  file?: File
  thumbnailUrl?: string
}

export interface PhotoGalleryProps {
  /** Fotos a mostrar */
  photos: Photo[]
  /** Callback cuando se elimina una foto */
  onDelete?: (photoId: string) => void
  /** Callback cuando se descarga una foto */
  onDownload?: (photo: Photo) => void
  /** Si permite eliminar */
  allowDelete?: boolean
  /** Si permite descargar */
  allowDownload?: boolean
  /** Columnas en grid (default: 3) */
  columns?: number
  /** Si mostrar en modo lightbox */
  showLightbox?: boolean
}

const PhotoGallery = ({
  photos,
  onDelete,
  onDownload,
  allowDelete = true,
  allowDownload = false,
  columns = 3,
  showLightbox = true,
}: PhotoGalleryProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const lightboxRef = useRef<HTMLDivElement>(null)

  // Swipe para navegar en lightbox
  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => {
      if (selectedPhoto && lightboxIndex < photos.length - 1) {
        setLightboxIndex(lightboxIndex + 1)
        setSelectedPhoto(photos[lightboxIndex + 1])
        hapticFeedback('light')
      }
    },
    onSwipeRight: () => {
      if (selectedPhoto && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1)
        setSelectedPhoto(photos[lightboxIndex - 1])
        hapticFeedback('light')
      }
    },
  })

  // Cerrar lightbox con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPhoto) {
        setSelectedPhoto(null)
      } else if (e.key === 'ArrowLeft' && selectedPhoto && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1)
        setSelectedPhoto(photos[lightboxIndex - 1])
      } else if (
        e.key === 'ArrowRight' &&
        selectedPhoto &&
        lightboxIndex < photos.length - 1
      ) {
        setLightboxIndex(lightboxIndex + 1)
        setSelectedPhoto(photos[lightboxIndex + 1])
      }
    }

    if (selectedPhoto) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedPhoto, lightboxIndex, photos])

  // Abrir lightbox
  const handleOpenLightbox = (photo: Photo, index: number) => {
    if (!showLightbox) return
    setSelectedPhoto(photo)
    setLightboxIndex(index)
    hapticFeedback('light')
  }

  // Cerrar lightbox
  const handleCloseLightbox = () => {
    setSelectedPhoto(null)
  }

  // Navegar en lightbox
  const handlePrevious = () => {
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1
      setLightboxIndex(newIndex)
      setSelectedPhoto(photos[newIndex])
      hapticFeedback('light')
    }
  }

  const handleNext = () => {
    if (lightboxIndex < photos.length - 1) {
      const newIndex = lightboxIndex + 1
      setLightboxIndex(newIndex)
      setSelectedPhoto(photos[newIndex])
      hapticFeedback('light')
    }
  }

  // Eliminar foto
  const handleDelete = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(photoId)
      hapticFeedback('medium')
    }
  }

  // Descargar foto
  const handleDownload = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation()
    if (onDownload) {
      onDownload(photo)
    } else if (photo.url) {
      // Descarga directa
      const link = document.createElement('a')
      link.href = photo.url
      link.download = photo.file?.name || `photo-${photo.id}.jpg`
      link.click()
    }
    hapticFeedback('light')
  }

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <p>No hay fotos para mostrar</p>
      </div>
    )
  }

  return (
    <>
      {/* Grid de fotos */}
      <div
        className={cn(
          'grid gap-2',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-3',
          columns === 4 && 'grid-cols-4',
        )}
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group"
            onClick={() => handleOpenLightbox(photo, index)}
          >
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />

            {/* Overlay con acciones */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {allowDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(e, photo.id)}
                  className="bg-red-500/80 text-white hover:bg-red-600/80"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {allowDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDownload(e, photo)}
                  className="bg-white/80 text-black hover:bg-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && showLightbox && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 bg-black flex flex-col"
          {...swipeHandlers}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 safe-area-top bg-gradient-to-b from-black/80 to-transparent">
            <div className="text-white">
              {lightboxIndex + 1} / {photos.length}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseLightbox}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Imagen */}
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={selectedPhoto.url}
              alt={`Foto ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Navegación */}
          {photos.length > 1 && (
            <>
              {lightboxIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}
              {lightboxIndex < photos.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}
            </>
          )}

          {/* Footer con acciones */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 p-4 safe-area-bottom bg-gradient-to-t from-black/80 to-transparent">
            {allowDownload && (
              <Button
                variant="outline"
                onClick={(e) => handleDownload(e, selectedPhoto)}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            )}
            {allowDelete && onDelete && (
              <Button
                variant="outline"
                onClick={(e) => {
                  handleDelete(e, selectedPhoto.id)
                  if (lightboxIndex === photos.length - 1 && lightboxIndex > 0) {
                    setLightboxIndex(lightboxIndex - 1)
                    setSelectedPhoto(photos[lightboxIndex - 1])
                  } else if (photos.length > 1) {
                    setSelectedPhoto(photos[lightboxIndex])
                  } else {
                    handleCloseLightbox()
                  }
                }}
                className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default PhotoGallery

