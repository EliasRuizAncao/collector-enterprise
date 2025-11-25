/**
 * Utilidades para manejo de cámara y permisos
 */

export type CameraFacingMode = 'user' | 'environment'
export type FlashMode = 'auto' | 'on' | 'off'

export interface CameraConstraints {
  facingMode?: CameraFacingMode
  flashMode?: FlashMode
  zoom?: number
}

/**
 * Verificar si el navegador soporta getMedia
 */
export const supportsCamera = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  )
}

/**
 * Verificar permisos de cámara
 */
export const checkCameraPermission = async (): Promise<PermissionState> => {
  if (!('permissions' in navigator)) {
    // Fallback: intentar acceder directamente
    return 'prompt'
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
    return result.state
  } catch (error) {
    // Algunos navegadores no soportan query de permisos
    return 'prompt'
  }
}

/**
 * Obtener stream de cámara
 */
export const getCameraStream = async (
  constraints: CameraConstraints = {},
): Promise<MediaStream> => {
  const { facingMode = 'environment', flashMode, zoom } = constraints

  const videoConstraints: MediaTrackConstraints = {
    facingMode,
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  }

  if (zoom !== undefined) {
    videoConstraints.zoom = { ideal: zoom }
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: videoConstraints,
    audio: false,
  })

  // Configurar flash si está disponible
  if (flashMode && stream.getVideoTracks().length > 0) {
    const track = stream.getVideoTracks()[0]
    const capabilities = track.getCapabilities()

    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: flashMode === 'on' }],
        } as MediaTrackConstraints)
      } catch (error) {
        console.warn('No se pudo configurar flash:', error)
      }
    }
  }

  return stream
}

/**
 * Detener stream de cámara
 */
export const stopCameraStream = (stream: MediaStream | null): void => {
  if (!stream) return

  stream.getTracks().forEach((track) => {
    track.stop()
  })
}

/**
 * Capturar foto desde video stream
 */
export const capturePhotoFromStream = (
  video: HTMLVideoElement,
  quality: number = 0.92,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo obtener contexto del canvas'))
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al capturar foto'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        quality,
      )
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Obtener dispositivos de cámara disponibles
 */
export const getCameraDevices = async (): Promise<MediaDeviceInfo[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((device) => device.kind === 'videoinput')
  } catch (error) {
    console.error('Error al obtener dispositivos de cámara:', error)
    return []
  }
}

/**
 * Cambiar cámara (front/back)
 */
export const switchCamera = async (
  currentStream: MediaStream,
  facingMode: CameraFacingMode,
): Promise<MediaStream> => {
  // Detener stream actual
  stopCameraStream(currentStream)

  // Obtener nuevo stream
  return getCameraStream({ facingMode })
}

/**
 * Reproducir sonido de shutter
 */
export const playShutterSound = (): void => {
  try {
    // Crear audio context para generar sonido de shutter
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (error) {
    // Fallback silencioso si no se puede reproducir sonido
    console.warn('No se pudo reproducir sonido de shutter:', error)
  }
}

