/**
 * MobileFileInput - Input de archivo con preview
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, File, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { inputBaseClasses, getInputStateClasses } from './inputUtils'
import './inputStyles.css'

export interface MobileFileInputProps {
  /** Archivos seleccionados */
  value: File[] | null
  /** Callback cuando cambian los archivos */
  onChange: (files: File[] | null) => void
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
  /** Tipos de archivo aceptados */
  accept?: string
  /** Si permite múltiples archivos */
  multiple?: boolean
  /** Tamaño máximo en MB */
  maxSize?: number
  /** Si es para fotos (acceso directo a cámara) */
  isPhoto?: boolean
  /** ID del campo */
  id?: string
  /** Name del campo */
  name?: string
  /** Callback cuando pierde el foco */
  onBlur?: () => void
  /** Callback cuando gana el foco */
  onFocus?: () => void
}

const MobileFileInput = ({
  value,
  onChange,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  accept,
  multiple = false,
  maxSize,
  isPhoto = false,
  id,
  name,
  onBlur,
  onFocus,
}: MobileFileInputProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generar previews de imágenes
  const generatePreviews = useCallback((files: File[]) => {
    const imagePreviews: string[] = []
    let loadedCount = 0
    
    if (files.length === 0) {
      setPreviews([])
      return
    }
    
    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          imagePreviews[index] = result
          loadedCount++
          if (loadedCount === files.length) {
            setPreviews(imagePreviews)
          }
        }
        reader.onerror = () => {
          imagePreviews[index] = ''
          loadedCount++
          if (loadedCount === files.length) {
            setPreviews(imagePreviews)
          }
        }
        reader.readAsDataURL(file)
      } else {
        imagePreviews[index] = ''
        loadedCount++
        if (loadedCount === files.length) {
          setPreviews(imagePreviews)
        }
      }
    })
  }, [])

  // Actualizar previews cuando cambian los archivos
  useEffect(() => {
    if (value && value.length > 0) {
      generatePreviews(value)
    } else {
      setPreviews([])
    }
  }, [value, generatePreviews])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validar tamaño
    if (maxSize) {
      const invalidFiles = files.filter((file) => file.size > maxSize * 1024 * 1024)
      if (invalidFiles.length > 0) {
        alert(`Algunos archivos exceden el tamaño máximo de ${maxSize}MB`)
        return
      }
    }

    const newFiles = multiple && value ? [...value, ...files] : files
    onChange(newFiles.length > 0 ? newFiles : null)
    onFocus?.()
  }

  const handleRemove = (index: number) => {
    if (!value) return
    const newFiles = value.filter((_, i) => i !== index)
    onChange(newFiles.length > 0 ? newFiles : null)
    
    // Actualizar previews
    const newPreviews = previews.filter((_, i) => i !== index)
    setPreviews(newPreviews)
  }

  const handleClear = () => {
    onChange(null)
    setPreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-primary" />
    }
    return <File className="h-8 w-8 text-muted-foreground" />
  }

  const inputId = id || `mobile-file-input-${name || Math.random().toString(36).substr(2, 9)}`
  const hasFiles = value && value.length > 0

  return (
    <div className="mobile-input-container">
      {label && (
        <label htmlFor={inputId} className="mobile-input-label">
          {label}
          {required && <span className="mobile-input-label-required">*</span>}
        </label>
      )}

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={accept || (isPhoto ? 'image/*' : undefined)}
        multiple={multiple}
        capture={isPhoto ? 'environment' : undefined}
        onChange={handleFileSelect}
        onBlur={onBlur}
        disabled={disabled}
        className="hidden"
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${inputId}-error`
            : helperText
              ? `${inputId}-helper`
              : undefined
        }
      />

      {/* Botón para seleccionar archivos */}
      {!hasFiles && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className={cn(
            inputBaseClasses,
            getInputStateClasses(error, false, false, false),
            'flex flex-col items-center justify-center gap-2 cursor-pointer',
            disabled && 'cursor-not-allowed',
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Subiendo...</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">
                {isPhoto ? 'Tomar foto o seleccionar' : 'Adjuntar archivo'}
              </span>
              {maxSize && (
                <span className="text-xs text-muted-foreground">
                  Máx. {maxSize}MB
                </span>
              )}
            </>
          )}
        </button>
      )}

      {/* Preview de archivos */}
      {hasFiles && (
        <div className="space-y-3">
          {value!.map((file, index) => {
            const preview = previews[index]
            const isImage = file.type.startsWith('image/')

            return (
              <div
                key={`${file.name}-${index}`}
                className="relative rounded-xl border border-input bg-background p-4"
              >
                {/* Preview de imagen */}
                {isImage && preview && (
                  <div className="mb-3 aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    <img
                      src={preview}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Info del archivo */}
                <div className="flex items-start gap-3">
                  {!isImage && (
                    <div className="shrink-0">{getFileIcon(file)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type || 'Tipo desconocido'}
                    </p>
                  </div>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label={`Eliminar ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-1"
            >
              {multiple ? 'Agregar más' : 'Cambiar archivo'}
            </Button>
            {multiple && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleClear}
                disabled={disabled}
              >
                Limpiar todo
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mobile-input-helper">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <div id={`${inputId}-error`} className="mobile-input-error" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default MobileFileInput

