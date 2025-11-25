/**
 * VoiceSearch - Componente para búsqueda por voz
 * Usa Web Speech API para reconocimiento de voz
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, X, CheckCircle2, AlertCircle, Loader2, Volume2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { Badge } from '@/shared/components/ui/badge'

/**
 * Tipo para reconocimiento de voz
 */
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onstart: (() => void) | null
  onend: (() => void) | null
  onaudiostart: (() => void) | null
  onaudioend: (() => void) | null
  onsoundstart: (() => void) | null
  onsoundend: (() => void) | null
  onspeechstart: (() => void) | null
  onspeechend: (() => void) | null
  onnomatch: (() => void) | null
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}

/**
 * Estados de reconocimiento de voz
 */
type VoiceSearchState = 'idle' | 'listening' | 'processing' | 'success' | 'error'

/**
 * Props del componente VoiceSearch
 */
export interface VoiceSearchProps {
  /** Callback cuando se obtiene el texto reconocido */
  onResult: (text: string) => void
  /** Idioma para reconocimiento (default: 'es-CL') */
  language?: string
  /** Si el componente está habilitado */
  enabled?: boolean
  /** Clase CSS adicional */
  className?: string
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Componente VoiceSearch
 */
const VoiceSearch = ({
  onResult,
  language = 'es-CL',
  enabled = true,
  className,
  size = 'md',
}: VoiceSearchProps) => {
  const [state, setState] = useState<VoiceSearchState>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSupportedRef = useRef<boolean>(false)

  // Verificar soporte de Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      isSupportedRef.current = true
      try {
        recognitionRef.current = new SpeechRecognition()
        const recognition = recognitionRef.current

        recognition.continuous = false
        recognition.lang = language
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          setState('listening')
          setError(null)
          setTranscript('')
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const result = event.results[event.resultIndex]
          const transcriptText = result[0].transcript

          setTranscript(transcriptText)

          if (result.isFinal) {
            setState('processing')
            // Procesar comandos de voz
            const processedText = processVoiceCommand(transcriptText)
            setTimeout(() => {
              setState('success')
              onResult(processedText)
              setTimeout(() => {
                setIsOpen(false)
                setState('idle')
                setTranscript('')
              }, 1000)
            }, 500)
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Error de reconocimiento de voz:', event.error)
          
          let errorMessage = 'Error al reconocer voz'
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No se detectó voz. Intenta de nuevo.'
              break
            case 'audio-capture':
              errorMessage = 'No se pudo acceder al micrófono'
              break
            case 'not-allowed':
              errorMessage = 'Permiso de micrófono denegado'
              setPermissionGranted(false)
              break
            case 'network':
              errorMessage = 'Error de red. Verifica tu conexión.'
              break
            case 'aborted':
              // Usuario canceló, no mostrar error
              setState('idle')
              setIsOpen(false)
              return
            default:
              errorMessage = `Error: ${event.error}`
          }

          setError(errorMessage)
          setState('error')
          
          // Auto-cerrar después de 3 segundos
          setTimeout(() => {
            setIsOpen(false)
            setState('idle')
            setError(null)
          }, 3000)
        }

        recognition.onend = () => {
          if (state === 'listening') {
            // Si terminó inesperadamente, podría ser timeout
            setState('idle')
          }
        }
      } catch (err) {
        console.error('Error al inicializar reconocimiento de voz:', err)
        isSupportedRef.current = false
      }
    } else {
      isSupportedRef.current = false
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current.abort()
        } catch {
          // Ignorar errores al limpiar
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [language, onResult, state])

  // Solicitar permiso de micrófono
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Detener el stream inmediatamente, solo necesitábamos el permiso
      stream.getTracks().forEach((track) => track.stop())
      setPermissionGranted(true)
      return true
    } catch (err: any) {
      console.error('Error al solicitar permiso de micrófono:', err)
      setPermissionGranted(false)
      setError('Permiso de micrófono denegado. Por favor, habilítalo en la configuración.')
      return false
    }
  }, [])

  // Procesar comandos de voz
  const processVoiceCommand = (text: string): string => {
    const lowerText = text.toLowerCase().trim()

    // Comandos de voz
    if (lowerText.startsWith('buscar ')) {
      return lowerText.replace('buscar ', '').trim()
    }

    if (lowerText.startsWith('filtrar por ')) {
      return lowerText.replace('filtrar por ', '').trim()
    }

    if (lowerText.includes('tareas de hoy') || lowerText.includes('tareas hoy')) {
      return 'hoy'
    }

    // Wake word (opcional)
    if (lowerText.startsWith('hey collector ')) {
      return lowerText.replace('hey collector ', '').trim()
    }

    // Retornar texto tal cual
    return text.trim()
  }

  // Iniciar reconocimiento de voz
  const startListening = useCallback(async () => {
    if (!isSupportedRef.current || !recognitionRef.current) {
      setError('Búsqueda por voz no está disponible en tu navegador')
      setState('error')
      return
    }

    // Verificar permisos
    if (permissionGranted === false) {
      setError('Permiso de micrófono denegado. Por favor, habilítalo en la configuración.')
      setState('error')
      return
    }

    // Solicitar permiso si no se ha verificado
    if (permissionGranted === null) {
      const granted = await requestMicrophonePermission()
      if (!granted) {
        return
      }
    }

    try {
      setIsOpen(true)
      setState('listening')
      setError(null)
      setTranscript('')

      // Timeout de 10 segundos
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && state === 'listening') {
          recognitionRef.current.stop()
          setError('Tiempo de espera agotado. Intenta de nuevo.')
          setState('error')
          setTimeout(() => {
            setIsOpen(false)
            setState('idle')
          }, 2000)
        }
      }, 10000)

      recognitionRef.current.start()
    } catch (err: any) {
      console.error('Error al iniciar reconocimiento:', err)
      setError('No se pudo iniciar el reconocimiento de voz')
      setState('error')
      setIsOpen(false)
    }
  }, [permissionGranted, requestMicrophonePermission, state])

  // Detener reconocimiento
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current.abort()
      } catch {
        // Ignorar errores
      }
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setState('idle')
    setIsOpen(false)
    setTranscript('')
    setError(null)
  }, [])

  // Si no está soportado, no mostrar nada
  if (!isSupportedRef.current || !enabled) {
    return null
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <>
      {/* Botón de micrófono */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={startListening}
        disabled={state === 'listening' || state === 'processing'}
        className={cn(
          sizeClasses[size],
          'touch-manipulation',
          state === 'listening' && 'text-destructive',
          className,
        )}
        aria-label="Búsqueda por voz"
      >
        {state === 'listening' || state === 'processing' ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </Button>

      {/* Modal de reconocimiento de voz */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && stopListening()}>
        <SheetContent side="bottom" className="h-[50vh] max-h-[400px] p-0">
          <div className="flex h-full flex-col items-center justify-center p-6">
            {/* Header */}
            <SheetHeader className="w-full">
              <SheetTitle className="text-center">Búsqueda por voz</SheetTitle>
            </SheetHeader>

            {/* Contenido */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6 w-full">
              {/* Icono de micrófono animado */}
              <div className="relative">
                {state === 'listening' && (
                  <div className="absolute inset-0 animate-ping">
                    <div className="h-24 w-24 rounded-full bg-destructive/20" />
                  </div>
                )}
                <div
                  className={cn(
                    'flex h-24 w-24 items-center justify-center rounded-full border-4 transition-all',
                    state === 'listening'
                      ? 'border-destructive bg-destructive/10 animate-pulse'
                      : state === 'processing'
                        ? 'border-primary bg-primary/10'
                        : state === 'success'
                          ? 'border-green-500 bg-green-500/10'
                          : state === 'error'
                            ? 'border-destructive bg-destructive/10'
                            : 'border-muted bg-muted',
                  )}
                >
                  {state === 'listening' && (
                    <Mic className="h-12 w-12 text-destructive animate-pulse" />
                  )}
                  {state === 'processing' && (
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  )}
                  {state === 'success' && (
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  )}
                  {state === 'error' && (
                    <AlertCircle className="h-12 w-12 text-destructive" />
                  )}
                  {state === 'idle' && <Mic className="h-12 w-12 text-muted-foreground" />}
                </div>
              </div>

              {/* Estado */}
              <div className="text-center space-y-2">
                {state === 'listening' && (
                  <>
                    <p className="text-lg font-semibold">Escuchando...</p>
                    <p className="text-sm text-muted-foreground">
                      Di lo que quieres buscar
                    </p>
                  </>
                )}
                {state === 'processing' && (
                  <>
                    <p className="text-lg font-semibold">Procesando...</p>
                    <p className="text-sm text-muted-foreground">
                      Reconociendo tu voz
                    </p>
                  </>
                )}
                {state === 'success' && (
                  <>
                    <p className="text-lg font-semibold text-green-600">
                      ¡Búsqueda realizada!
                    </p>
                  </>
                )}
                {state === 'error' && (
                  <>
                    <p className="text-lg font-semibold text-destructive">
                      Error
                    </p>
                    {error && (
                      <p className="text-sm text-muted-foreground">{error}</p>
                    )}
                  </>
                )}
              </div>

              {/* Transcript en tiempo real */}
              {transcript && (
                <div className="w-full max-w-md">
                  <Badge variant="outline" className="w-full justify-center py-2 text-sm">
                    <Volume2 className="h-4 w-4 mr-2" />
                    {transcript}
                  </Badge>
                </div>
              )}

              {/* Waveform animation (simulada) */}
              {state === 'listening' && (
                <div className="flex items-center gap-1 h-8">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-destructive rounded-full animate-pulse"
                      style={{
                        height: `${20 + Math.random() * 30}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Botón cancelar */}
              {state === 'listening' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopListening}
                  className="mt-4"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}

              {/* Mensaje de permiso denegado */}
              {permissionGranted === false && (
                <div className="text-center space-y-2 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Permiso de micrófono denegado
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Abrir configuración del navegador
                      if (navigator.permissions) {
                        navigator.permissions.query({ name: 'microphone' as PermissionName }).then(() => {
                          // El usuario puede cambiar permisos
                        })
                      }
                    }}
                  >
                    Abrir configuración
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default VoiceSearch

