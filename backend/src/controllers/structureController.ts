import { Request, Response, NextFunction } from 'express'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { AuthRequest } from '../middleware/auth'

// Tipos para la respuesta del script Python
interface StructureResult {
    type: 'image' | 'video'
    score: number
    status: string
    detections: string[]
    processed_file: string
    stats?: {
        total_frames: number
        frames_with_detection: number
        effective_time_percent: number
    }
    error?: string
}

// Estado global del último análisis
let lastStatus: StructureResult & {
    timestamp: string
    originalUrl: string
    processedUrl: string
} | null = null
let isExplicitlyCleared = false

// Rutas de archivos
const BACKEND_ROOT = path.resolve(__dirname, '..', '..')
const UPLOADS_DIR = path.join(BACKEND_ROOT, 'uploads')
const RECIBIDOS_DIR = path.join(BACKEND_ROOT, 'reconocimiento', 'recibidos', 'detecciones_structure')
const PYTHON_SCRIPT_PATH = path.join(BACKEND_ROOT, 'reconocimiento', 'structure_detect.py')

/**
 * Asegurar que las carpetas existan
 */
const ensureDirectories = async () => {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true })
        await fs.mkdir(RECIBIDOS_DIR, { recursive: true })
    } catch (error) {
        console.error('[structure] Error al crear directorios:', error)
    }
}

/**
 * Analizar archivo con YOLOv8 (Structure)
 */
const analyzeFile = async (filePath: string): Promise<StructureResult> => {
    const absoluteFilePath = path.resolve(filePath)

    // Detectar Python
    // Intentar usar python del sistema o venv local
    const venvPython = path.join(BACKEND_ROOT, '.venv', 'Scripts', 'python.exe')

    let pythonExecutable = 'python' // Default to system python

    try {
        await fs.access(venvPython)
        pythonExecutable = venvPython
    } catch {
        // Si no existe venv, usar 'python' global
        console.log('[structure] Usando python global')
    }

    return new Promise((resolve, reject) => {
        console.log(`[structure] Ejecutando script: ${pythonExecutable} ${PYTHON_SCRIPT_PATH} ${absoluteFilePath}`)

        const pythonProcess = spawn(pythonExecutable, [PYTHON_SCRIPT_PATH, absoluteFilePath], {
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
                console.error('[structure] Error en Python script:', stderr)
                // Write error to a log file for debugging
                const logPath = path.join(UPLOADS_DIR, 'structure_error.log')
                fs.writeFile(logPath, `Error executing ${PYTHON_SCRIPT_PATH}:\n${stderr}\n\n`).catch(console.error)

                reject(new Error(`Python script falló con código ${code}: ${stderr}`))
                return
            }

            try {
                // Buscar JSON en la salida
                const lines = stdout.trim().split('\n')
                const jsonLine = lines.find(line => line.trim().startsWith('{'))

                if (!jsonLine) {
                    console.error('[structure] No se encontró JSON en la salida:', stdout)
                    reject(new Error('No se encontró JSON en la respuesta del script Python'))
                    return
                }

                const result: StructureResult = JSON.parse(jsonLine.trim())

                if (result.error) {
                    reject(new Error(result.error))
                    return
                }

                resolve(result)
            } catch (parseError) {
                console.error('[structure] Error al parsear JSON:', stdout)
                reject(new Error('Error al parsear respuesta del script Python'))
            }
        })
    })
}

/**
 * Procesar archivo en background
 */
const processFileInBackground = async (filePath: string, filename: string) => {
    try {
        console.log(`[structure] Iniciando procesamiento en background: ${filename}`)

        const result = await analyzeFile(filePath)

        // Construir URLs
        const originalUrl = `/static/uploads/${filename}` // Necesitamos exponer uploads o copiar a static
        // Nota: El script python guarda el procesado en RECIBIDOS_DIR
        const processedUrl = `/static/structure-images/${result.processed_file}`

        // Actualizar estado global
        lastStatus = {
            ...result,
            timestamp: new Date().toISOString(),
            originalUrl,
            processedUrl
        }

        // Guardar resultado en JSON persistente
        const jsonPath = path.join(RECIBIDOS_DIR, `${result.processed_file}.json`)
        await fs.writeFile(jsonPath, JSON.stringify(lastStatus, null, 2))

        console.log(`[structure] Procesamiento completado: ${result.processed_file}`)

    } catch (error) {
        console.error(`[structure] Error al procesar archivo en background (${filename}):`, error)
    }
}

/**
 * POST /api/v1/structure/analyze
 */
export const analyzeStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
        isExplicitlyCleared = false // Reset flag on new analysis
        console.log('[structure] Recibiendo petición de análisis...')
        console.log('[structure] Headers:', req.headers)

        if (!req.file) {
            console.error('[structure] Error: No se recibió ningún archivo en req.file')
            return res.status(400).json({ error: 'No se recibió ningún archivo' })
        }

        console.log('[structure] Archivo recibido:', req.file.filename, req.file.path, req.file.mimetype)

        await ensureDirectories()

        const filename = req.file.filename // Multer ya guardó el archivo
        const filePath = req.file.path

        // Responder inmediatamente
        res.status(202).json({
            success: true,
            message: 'Archivo recibido y en proceso de análisis',
            filename,
            timestamp: new Date().toISOString()
        })

        // Procesar en background
        processFileInBackground(filePath, filename).catch(err => {
            console.error('[structure] Error crítico en background:', err)
        })

    } catch (error) {
        console.error('[structure] Error en analyzeStructure:', error)
        next(error)
    }
}

/**
 * GET /api/v1/structure/status
 */
export const getStructureStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Si se limpió explícitamente, devolver null
        if (isExplicitlyCleared) {
            return res.json({
                success: true,
                status: null
            })
        }

        // Si no hay lastStatus en memoria, intentar leer el último JSON modificado
        if (!lastStatus) {
            try {
                const files = await fs.readdir(RECIBIDOS_DIR)
                const jsonFiles = files.filter(f => f.endsWith('.json'))

                if (jsonFiles.length > 0) {
                    // Ordenar por fecha de modificación (más reciente primero)
                    const sortedFiles = await Promise.all(jsonFiles.map(async f => {
                        const stat = await fs.stat(path.join(RECIBIDOS_DIR, f))
                        return { name: f, time: stat.mtime.getTime() }
                    })).then(files => files.sort((a, b) => b.time - a.time))

                    const latestJson = sortedFiles[0]
                    const content = await fs.readFile(path.join(RECIBIDOS_DIR, latestJson.name), 'utf-8')
                    lastStatus = JSON.parse(content)
                }
            } catch (e) {
                console.error('[structure] Error recuperando último estado:', e)
            }
        }

        res.json({
            success: true,
            status: lastStatus
        })
    } catch (error) {
        next(error)
    }
}

/**
 * POST /api/v1/structure/reset
 */
export const resetStructureStatus = (req: Request, res: Response) => {
    lastStatus = null
    isExplicitlyCleared = true
    res.json({ success: true, message: 'Estado reiniciado' })
}
