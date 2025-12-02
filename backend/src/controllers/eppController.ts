import { Request, Response, NextFunction } from 'express'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { AuthRequest } from '@/middleware/auth'

const EPP_MODULE = 'EPP'

// Tipos para la detección - Clases exactas de Roboflow
export interface EPPDetection {
  casco: number
  chaleco: number
  guante: number
  zapato: number
  'no casco': number
  'no chaleco': number
  'no guante': number
}

export interface EPPStatus {
  timestamp: string
  imageUrl: string | null
  processedImageUrl: string | null
  detections: EPPDetection
  isCompliant: boolean
  missingItems: string[]
}

// Interfaz para el historial de detecciones
export interface HistoryRecord {
  timestamp: string
  imageUrl: string | null
  processedImageUrl: string | null
  detections: EPPDetection
  isCompliant: boolean
  missingItems: string[]
}

// Estado global del último análisis
let lastStatus: EPPStatus | null = null

// Almacenar detecciones de cada imagen (para limpieza automática)
interface ImageDetection {
  filename: string
  detections: EPPDetection
  timestamp: string
  hasDetections: boolean // true si tiene al menos una detección
}

const imageDetections = new Map<string, ImageDetection>()

// Rutas de archivos
// Rutas de archivos
// Usamos path.resolve con __dirname para ser más robustos frente al CWD
const BACKEND_ROOT = path.resolve(__dirname, '..', '..')
const UPLOADS_DIR = path.join(BACKEND_ROOT, 'uploads')
const RECIBIDOS_DIR = path.join(BACKEND_ROOT, 'reconocimiento', 'recibidos', 'detecciones')
const PYTHON_SCRIPT_PATH = path.join(BACKEND_ROOT, 'reconocimiento', 'detect.py')
const MODEL_PATH = path.join(BACKEND_ROOT, 'reconocimiento', 'best.pt')
const DATA_DIR = path.join(BACKEND_ROOT, 'data')
const HISTORY_FILE = path.join(DATA_DIR, 'history.json')

console.log('[epp] Configured paths:')
console.log('[epp] ROOT:', BACKEND_ROOT)
console.log('[epp] RECIBIDOS:', RECIBIDOS_DIR)
console.log('[epp] DATA_DIR:', DATA_DIR)

/**
 * Asegurar que las carpetas existan
 */
const ensureDirectories = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
    await fs.mkdir(RECIBIDOS_DIR, { recursive: true })
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('[epp] Error al crear directorios:', error)
  }
}

/**
 * Analizar imagen con YOLOv8
 */
const analyzeImage = async (imagePath: string): Promise<EPPDetection> => {
  // Ejecutar script de Python
  // El script espera recibir la ruta absoluta de la imagen
  const absoluteImagePath = path.resolve(imagePath)
  // Detectar Python en venv o sistema
  const venvPython = process.platform === 'win32'
    ? path.join(BACKEND_ROOT, '.venv', 'Scripts', 'python.exe')
    : path.join(BACKEND_ROOT, '.venv', 'bin', 'python')

  // Verificar si existe el venv, si no usar 'python' del sistema
  const pythonExecutable = await fs.access(venvPython).then(() => venvPython).catch(() => 'python')

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExecutable, [PYTHON_SCRIPT_PATH, absoluteImagePath], {
      cwd: path.join(BACKEND_ROOT, 'reconocimiento'),
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('[epp] Error en Python script:', stderr)
        reject(new Error(`Python script falló con código ${code}: ${stderr}`))
        return
      }

      try {
        // El script puede imprimir mensajes adicionales antes del JSON
        // Buscar la línea que contiene el JSON (comienza con '{')
        const lines = stdout.trim().split('\n')
        const jsonLine = lines.find(line => line.trim().startsWith('{'))

        if (!jsonLine) {
          console.error('[epp] No se encontró JSON en la salida:', stdout)
          reject(new Error('No se encontró JSON en la respuesta del script Python'))
          return
        }

        const detections: EPPDetection = JSON.parse(jsonLine.trim())
        resolve(detections)
      } catch (parseError) {
        console.error('[epp] Error al parsear JSON:', stdout)
        reject(new Error('Error al parsear respuesta del script Python'))
      }
    })

    pythonProcess.on('error', (error) => {
      console.error('[epp] Error al ejecutar Python:', error)
      reject(new Error(`Error al ejecutar script Python: ${error.message}`))
    })
  })
}

/**
 * Encontrar la última imagen procesada
 */
const findLatestProcessedImage = async (): Promise<string | null> => {
  try {
    const files = await fs.readdir(RECIBIDOS_DIR)
    const imageFiles = files
      .filter((file) => /\.(jpg|jpeg|png)$/i.test(file))
      .sort()
      .reverse()

    if (imageFiles.length === 0) {
      return null
    }

    return path.join(RECIBIDOS_DIR, imageFiles[0])
  } catch (error) {
    console.error('[epp] Error al buscar imagen procesada:', error)
    return null
  }
}

/**
 * Determinar si el EPP es compliant
 * Lógica exacta según modelo de Python:
 * - Casco OK: (casco > 0) && (!result['no casco'] || result['no casco'] === 0)
 * - Chaleco OK: (chaleco > 0) && (!result['no chaleco'] || result['no chaleco'] === 0)
 * - Guantes OK: (guante > 0) && (!result['no guante'] || result['no guante'] === 0)
 * - zapato: IGNORADO completamente
 */
const checkCompliance = (detections: EPPDetection): { isCompliant: boolean; missingItems: string[] } => {
  const missingItems: string[] = []

  // Verificar Casco: debe estar presente Y no debe haber detección negativa
  const cascoOK = (detections.casco > 0) && (!detections['no casco'] || detections['no casco'] === 0)
  if (!cascoOK) {
    if (detections['no casco'] > 0) {
      missingItems.push('Detectado: No-Casco')
    } else {
      missingItems.push('Falta Casco')
    }
  }

  // Verificar Chaleco: debe estar presente Y no debe haber detección negativa
  const chalecoOK = (detections.chaleco > 0) && (!detections['no chaleco'] || detections['no chaleco'] === 0)
  if (!chalecoOK) {
    if (detections['no chaleco'] > 0) {
      missingItems.push('Detectado: No-Chaleco')
    } else {
      missingItems.push('Falta Chaleco')
    }
  }

  // Verificar Guantes: debe estar presente Y no debe haber detección negativa
  const guantesOK = (detections.guante > 0) && (!detections['no guante'] || detections['no guante'] === 0)
  if (!guantesOK) {
    if (detections['no guante'] > 0) {
      missingItems.push('Detectado: No-Guante')
    } else {
      missingItems.push('Falta Guantes')
    }
  }

  // isCompliant es true SOLO si todos los requisitos pasan
  const isCompliant = cascoOK && chalecoOK && guantesOK

  return { isCompliant, missingItems }
}

/**
 * Verificar si una imagen tiene detecciones
 */
const hasAnyDetections = (detections: EPPDetection): boolean => {
  // Verificar si hay al menos una detección positiva (no solo "no ...")
  return (
    detections.guante > 0 ||
    detections.casco > 0 ||
    detections.chaleco > 0 ||
    detections.zapato > 0
  )
}

/**
 * Guardar registro en el historial
 */
const saveToHistory = async (record: HistoryRecord) => {
  try {
    await ensureDirectories()

    let history: HistoryRecord[] = []

    // Leer historial existente
    try {
      const data = await fs.readFile(HISTORY_FILE, 'utf-8')
      history = JSON.parse(data)
    } catch (error) {
      // Si no existe el archivo, empezar con array vacío
      console.log('[epp] Creando nuevo archivo de historial')
    }

    // Agregar nuevo registro al inicio (más recientes primero)
    history.unshift(record)

    // Guardar historial actualizado
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2))
    console.log('[epp] Registro guardado en historial:', record.timestamp)
  } catch (error) {
    console.error('[epp] Error al guardar en historial:', error)
  }
}

/**
 * Obtener historial completo
 */
const getHistoryRecords = async (): Promise<HistoryRecord[]> => {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Si no existe el archivo, retornar array vacío
    return []
  }
}

/**
 * Procesar imagen en background (sin bloquear la respuesta)
 */
const processImageInBackground = async (imagePath: string, imageFilename: string) => {
  try {
    console.log(`[epp] Iniciando procesamiento en background: ${imageFilename}`)

    // Ejecutar análisis (esto puede tardar varios segundos)
    // El script de Python guarda la imagen procesada en RECIBIDOS_DIR
    const detections = await analyzeImage(imagePath)

    // Verificar si tiene detecciones
    const hasDetections = hasAnyDetections(detections)

    // Esperar un momento para que el archivo procesado se escriba completamente
    await new Promise(resolve => setTimeout(resolve, 100))

    // Buscar la imagen procesada más reciente (debería ser la que acabamos de procesar)
    const processedImagePath = await findLatestProcessedImage()

    if (!processedImagePath) {
      console.error(`[epp] No se encontró imagen procesada para ${imageFilename}`)
      return
    }

    const processedFilename = path.basename(processedImagePath)
    console.log(`[epp] Imagen procesada encontrada: ${processedFilename}`)

    // Guardar JSON con los resultados usando el nombre de la imagen procesada
    const jsonPath = path.join(RECIBIDOS_DIR, `${processedFilename}.json`)
    const detectionData: ImageDetection = {
      filename: processedFilename,
      detections,
      timestamp: new Date().toISOString(),
      hasDetections,
    }

    await fs.writeFile(jsonPath, JSON.stringify(detectionData, null, 2))
    console.log(`[epp] Resultados guardados en JSON: ${processedFilename}.json`)

    imageDetections.set(processedFilename, detectionData)

    // Verificar compliance
    const { isCompliant, missingItems } = checkCompliance(detections)

    const processedImageUrl = `/static/epp-images/${processedFilename}`

    // Actualizar estado global
    lastStatus = {
      timestamp: new Date().toISOString(),
      imageUrl: `/static/epp-images/${imageFilename}`,
      processedImageUrl,
      detections,
      isCompliant,
      missingItems,
    }

    // Guardar en historial
    await saveToHistory(lastStatus)

    console.log(`[epp] Procesamiento completado: ${processedFilename}`, {
      isCompliant,
      missingItems,
      hasDetections,
      detections,
    })
  } catch (error) {
    console.error(`[epp] Error al procesar imagen en background (${imageFilename}):`, error)
    // No actualizar lastStatus si hay error, pero no fallar
  }
}

/**
 * POST /api/v1/epp/analyze
 * Recibe imagen binaria desde ESP32-CAM y la procesa
 * Nota: Este endpoint usa autenticación por API Key (no Firebase Auth)
 * 
 * IMPORTANTE: Responde inmediatamente (202 Accepted) y procesa en background
 * para evitar timeouts en el ESP32-CAM
 */
export const analyzeEPP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // El ESP32-CAM puede enviar la imagen de varias formas:
    // 1. Como archivo en multipart/form-data (req.file de multer)
    // 2. Como buffer raw en req.body (desde rawImageHandler o route handler)
    // 3. Como JSON con base64
    let imageBuffer: Buffer | undefined

    // Caso 1: Archivo subido con multer
    if ((req as any).file) {
      imageBuffer = (req as any).file.buffer
    }
    // Caso 2: Buffer raw
    else if (Buffer.isBuffer(req.body)) {
      imageBuffer = req.body
    }
    // Caso 3: JSON con imagen en base64
    else if (req.body && typeof req.body === 'object') {
      if (req.body.image && typeof req.body.image === 'string') {
        const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '')
        imageBuffer = Buffer.from(base64Data, 'base64')
      } else if (req.body.data && typeof req.body.data === 'string') {
        const base64Data = req.body.data.replace(/^data:image\/\w+;base64,/, '')
        imageBuffer = Buffer.from(base64Data, 'base64')
      }
    }
    // Caso 4: String base64 directo
    else if (typeof req.body === 'string') {
      const base64Data = req.body.replace(/^data:image\/\w+;base64,/, '')
      imageBuffer = Buffer.from(base64Data, 'base64')
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      // Solo enviar error si aún no se ha respondido
      if (!res.headersSent) {
        return res.status(400).json({ error: 'No se recibió imagen o la imagen está vacía' })
      }
      console.error('[epp] Imagen vacía pero ya se respondió')
      return
    }

    // Asegurar directorios
    await ensureDirectories()

    // Generar nombre de archivo
    const timestamp = Date.now()
    const imageFilename = `epp_${timestamp}.jpg`
    const imagePath = path.join(UPLOADS_DIR, imageFilename)

    // Si aún no se ha respondido (caso multipart), responder ahora
    if (!res.headersSent) {
      res.status(202).json({
        success: true,
        message: 'Imagen recibida y en proceso de análisis',
        imageId: imageFilename,
        timestamp: new Date().toISOString(),
        note: 'El análisis puede tardar varios segundos. Consulta /api/v1/epp/status para ver los resultados.',
      })
    }

    // Guardar imagen
    await fs.writeFile(imagePath, imageBuffer)
    console.log(`[epp] Imagen guardada: ${imageFilename} (${imageBuffer.length} bytes)`)

    // Procesar en background (sin await)
    processImageInBackground(imagePath, imageFilename).catch((error) => {
      console.error(`[epp] Error crítico en procesamiento background:`, error)
    })
  } catch (error) {
    console.error('[epp] Error en analyzeEPP:', error)
    // Si hay error antes de responder, enviar error
    if (!res.headersSent) {
      next(error)
    } else {
      // Si ya respondimos, solo loguear el error
      console.error('[epp] Error después de enviar respuesta 202:', error)
    }
  }
}

/**
 * Obtener todas las imágenes procesadas con sus metadatos
 */
const getAllProcessedImages = async (): Promise<Array<{
  filename: string
  url: string
  timestamp: string
  detections: EPPDetection | null
  hasDetections: boolean
}>> => {
  try {
    const files = await fs.readdir(RECIBIDOS_DIR)
    const imageFiles = files
      .filter((file) => /\.(jpg|jpeg|png)$/i.test(file))
      .sort()
      .reverse() // Más recientes primero

    const images = await Promise.all(
      imageFiles.map(async (filename) => {
        const filePath = path.join(RECIBIDOS_DIR, filename)
        const stats = await fs.stat(filePath)

        // Intentar obtener de memoria primero
        let detection = imageDetections.get(filename)

        // Si no está en memoria, intentar leer del JSON
        if (!detection) {
          try {
            const jsonPath = path.join(RECIBIDOS_DIR, `${filename}.json`)
            const jsonContent = await fs.readFile(jsonPath, 'utf-8')
            detection = JSON.parse(jsonContent)
            // Actualizar memoria
            if (detection) {
              imageDetections.set(filename, detection)
            }
          } catch (e) {
            // Si no existe el JSON, es normal para imágenes antiguas o no procesadas
          }
        }

        // Si no hay detección guardada, asumir que tiene detecciones (para no borrar imágenes existentes)
        // Solo las nuevas imágenes sin detecciones se marcarán para borrado
        const hasDetections = detection?.hasDetections ?? true

        return {
          filename,
          url: `/static/epp-images/${filename}`,
          timestamp: stats.birthtime.toISOString(),
          detections: detection?.detections || null,
          hasDetections,
        }
      }),
    )

    console.log(`[epp] getAllProcessedImages: Retornando ${images.length} imágenes`)
    return images
  } catch (error) {
    console.error('[epp] Error al listar imágenes procesadas:', error)
    return []
  }
}

/**
 * Limpiar imágenes sin detecciones (ejecutar cada 10 minutos)
 */
const cleanupEmptyImages = async () => {
  try {
    const images = await getAllProcessedImages()
    const now = Date.now()
    const tenMinutesAgo = now - 10 * 60 * 1000

    let deletedCount = 0

    for (const image of images) {
      // Solo borrar si:
      // 1. No tiene detecciones
      // 2. Tiene más de 10 minutos de antigüedad
      const imageTimestamp = new Date(image.timestamp).getTime()

      if (!image.hasDetections && imageTimestamp < tenMinutesAgo) {
        try {
          const filePath = path.join(RECIBIDOS_DIR, image.filename)
          const jsonPath = path.join(RECIBIDOS_DIR, `${image.filename}.json`)

          await fs.unlink(filePath)
          // Intentar borrar JSON también si existe
          try {
            await fs.unlink(jsonPath)
          } catch (e) {
            // Ignorar error si no existe
          }

          imageDetections.delete(image.filename)
          deletedCount++
          console.log(`[epp] Imagen sin detecciones eliminada: ${image.filename}`)
        } catch (error) {
          console.error(`[epp] Error al eliminar imagen ${image.filename}:`, error)
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[epp] Limpieza completada: ${deletedCount} imagen(es) eliminada(s)`)
    }
  } catch (error) {
    console.error('[epp] Error en limpieza automática:', error)
  }
}

// Iniciar limpieza automática cada 10 minutos
let cleanupInterval: NodeJS.Timeout | null = null

const startCleanupScheduler = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }

  // Ejecutar inmediatamente y luego cada 10 minutos
  cleanupEmptyImages()
  cleanupInterval = setInterval(cleanupEmptyImages, 10 * 60 * 1000) // 10 minutos

  console.log('[epp] Limpieza automática iniciada (cada 10 minutos)')
}

/**
 * Reprocesar imágenes que no tienen archivo JSON de detecciones
 */
const reprocessMissingDetections = async () => {
  try {
    console.log('[epp] Iniciando verificación de imágenes sin procesar...')
    const files = await fs.readdir(RECIBIDOS_DIR)
    const imageFiles = files.filter((file) => /\.(jpg|jpeg|png)$/i.test(file))

    let processedCount = 0

    for (const filename of imageFiles) {
      const jsonPath = path.join(RECIBIDOS_DIR, `${filename}.json`)

      try {
        await fs.access(jsonPath)
        // El JSON existe, no hacer nada
      } catch {
        // El JSON no existe, procesar imagen
        console.log(`[epp] Reprocesando imagen antigua: ${filename}`)
        const imagePath = path.join(RECIBIDOS_DIR, filename)

        try {
          const detections = await analyzeImage(imagePath)
          const hasDetections = hasAnyDetections(detections)

          const detectionData: ImageDetection = {
            filename,
            detections,
            timestamp: new Date().toISOString(), // Usamos fecha actual para el JSON
            hasDetections,
          }

          await fs.writeFile(jsonPath, JSON.stringify(detectionData, null, 2))
          imageDetections.set(filename, detectionData)
          processedCount++

          // Pequeña pausa para no saturar CPU
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (err) {
          console.error(`[epp] Error al reprocesar ${filename}:`, err)
        }
      }
    }

    if (processedCount > 0) {
      console.log(`[epp] Reprocesamiento completado: ${processedCount} imágenes actualizadas`)
    } else {
      console.log('[epp] Todas las imágenes tienen sus datos de detección')
    }
  } catch (error) {
    console.error('[epp] Error en reprocessMissingDetections:', error)
  }
}

/**
 * Cargar imágenes existentes al iniciar el servidor
 */
const loadExistingImages = async () => {
  try {
    // No reprocesar imágenes antiguas automáticamente
    // await reprocessMissingDetections()

    const images = await getAllProcessedImages()
    console.log(`[epp] Cargadas ${images.length} imagen(es) existente(s)`)

    // getAllProcessedImages ya se encarga de leer los JSON y poblar imageDetections
    // así que no necesitamos hacer nada más aquí
  } catch (error) {
    console.error('[epp] Error al cargar imágenes existentes:', error)
  }
}

// Iniciar al cargar el módulo
if (typeof process !== 'undefined') {
  startCleanupScheduler()
  // Cargar imágenes existentes después de un pequeño delay
  setTimeout(() => {
    loadExistingImages()
  }, 2000)
}

/**
 * GET /api/v1/epp/status
 * Devuelve el último análisis procesado y todas las imágenes disponibles
 */
export const getEPPStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Obtener todas las imágenes procesadas
    const allImages = await getAllProcessedImages()

    console.log(`[epp] getEPPStatus: Devolviendo ${allImages.length} imágenes`)

    res.json({
      success: true,
      status: lastStatus,
      images: allImages, // Lista de todas las imágenes
      totalImages: allImages.length,
    })
  } catch (error) {
    console.error('[epp] Error en getEPPStatus:', error)
    next(error)
  }
}

/**
 * GET /api/v1/epp/history
 * Devuelve el historial completo de detecciones
 */
export const getHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const history = await getHistoryRecords()

    console.log(`[epp] getHistory: Devolviendo ${history.length} registros`)

    res.json({
      success: true,
      history,
      totalRecords: history.length,
    })
  } catch (error) {
    console.error('[epp] Error en getHistory:', error)
    next(error)
  }
}
