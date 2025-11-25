/**
 * Utilidades para compresión y procesamiento de imágenes
 */

export interface CompressionOptions {
  /** Calidad de compresión (0-1, default: 0.8) */
  quality?: number
  /** Dimensión máxima (ancho o alto, default: 1920px) */
  maxDimension?: number
  /** Si convertir a WebP (default: true si soportado) */
  convertToWebP?: boolean
  /** Mantener EXIF metadata (default: false) */
  keepExif?: boolean
}

export interface CompressionResult {
  /** Archivo comprimido */
  file: File
  /** Tamaño original en bytes */
  originalSize: number
  /** Tamaño comprimido en bytes */
  compressedSize: number
  /** Porcentaje de reducción */
  reductionPercent: number
  /** URL del blob para preview */
  previewUrl: string
}

/**
 * Verificar si el navegador soporta WebP
 */
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}

/**
 * Redimensionar imagen manteniendo aspect ratio
 */
const resizeImage = (
  img: HTMLImageElement,
  maxDimension: number,
): { width: number; height: number } => {
  let { width, height } = img

  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  if (width > height) {
    height = (height * maxDimension) / width
    width = maxDimension
  } else {
    width = (width * maxDimension) / height
    height = maxDimension
  }

  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * Comprimir imagen
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {},
): Promise<CompressionResult> => {
  const {
    quality = 0.8,
    maxDimension = 1920,
    convertToWebP = supportsWebP(),
    keepExif = false,
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        try {
          // Redimensionar si es necesario
          const { width, height } = resizeImage(img, maxDimension)

          // Crear canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          // Dibujar imagen redimensionada
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('No se pudo obtener contexto del canvas'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Determinar formato de salida
          const outputFormat = convertToWebP ? 'image/webp' : file.type || 'image/jpeg'
          const outputQuality = quality

          // Convertir a blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir imagen'))
                return
              }

              // Crear File desde blob
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, convertToWebP ? '.webp' : ''),
                {
                  type: outputFormat,
                  lastModified: Date.now(),
                },
              )

              // Crear preview URL
              const previewUrl = URL.createObjectURL(blob)

              const originalSize = file.size
              const compressedSize = blob.size
              const reductionPercent = ((originalSize - compressedSize) / originalSize) * 100

              resolve({
                file: compressedFile,
                originalSize,
                compressedSize,
                reductionPercent: Math.round(reductionPercent * 100) / 100,
                previewUrl,
              })
            },
            outputFormat,
            outputQuality,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Error al cargar imagen'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Error al leer archivo'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Formatear tamaño de archivo
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Obtener metadata EXIF de imagen (básico)
 */
export const getImageMetadata = async (file: File): Promise<{
  width: number
  height: number
  size: number
  type: string
  lastModified: number
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        })
      }

      img.onerror = () => {
        reject(new Error('Error al leer metadata de imagen'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Error al leer archivo'))
    }

    reader.readAsDataURL(file)
  })
}

