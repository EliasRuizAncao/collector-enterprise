import { promises as fs } from 'fs'
import path from 'path'

// Tipos
interface EPPDetection {
    casco: number
    chaleco: number
    guante: number
    zapato: number
    'no casco': number
    'no chaleco': number
    'no guante': number
}

interface HistoryRecord {
    timestamp: string
    imageUrl: string | null
    processedImageUrl: string | null
    detections: EPPDetection
    isCompliant: boolean
    missingItems: string[]
}

const BACKEND_ROOT = path.resolve(__dirname, '..')
const RECIBIDOS_DIR = path.join(BACKEND_ROOT, 'reconocimiento', 'recibidos', 'detecciones')
const DATA_DIR = path.join(BACKEND_ROOT, 'data')
const HISTORY_FILE = path.join(DATA_DIR, 'history.json')

const checkCompliance = (detections: EPPDetection): { isCompliant: boolean; missingItems: string[] } => {
    const missingItems: string[] = []

    const cascoOK = (detections.casco > 0) && (!detections['no casco'] || detections['no casco'] === 0)
    if (!cascoOK) {
        if (detections['no casco'] > 0) {
            missingItems.push('Detectado: No-Casco')
        } else {
            missingItems.push('Falta Casco')
        }
    }

    const chalecoOK = (detections.chaleco > 0) && (!detections['no chaleco'] || detections['no chaleco'] === 0)
    if (!chalecoOK) {
        if (detections['no chaleco'] > 0) {
            missingItems.push('Detectado: No-Chaleco')
        } else {
            missingItems.push('Falta Chaleco')
        }
    }

    const guantesOK = (detections.guante > 0) && (!detections['no guante'] || detections['no guante'] === 0)
    if (!guantesOK) {
        if (detections['no guante'] > 0) {
            missingItems.push('Detectado: No-Guante')
        } else {
            missingItems.push('Falta Guantes')
        }
    }

    const isCompliant = cascoOK && chalecoOK && guantesOK
    return { isCompliant, missingItems }
}

async function generateHistory() {
    try {
        console.log('[Generate History] Iniciando generación de historial...')

        // Crear directorio data si no existe
        await fs.mkdir(DATA_DIR, { recursive: true })

        // Leer archivos JSON de detecciones
        const files = await fs.readdir(RECIBIDOS_DIR)
        const jsonFiles = files.filter(file => file.endsWith('.json'))

        console.log(`[Generate History] Encontrados ${jsonFiles.length} archivos JSON`)

        const history: HistoryRecord[] = []

        for (const jsonFile of jsonFiles) {
            try {
                const jsonPath = path.join(RECIBIDOS_DIR, jsonFile)
                const content = await fs.readFile(jsonPath, 'utf-8')
                const data = JSON.parse(content)

                if (data.detections && data.filename) {
                    const { isCompliant, missingItems } = checkCompliance(data.detections)

                    const record: HistoryRecord = {
                        timestamp: data.timestamp || new Date().toISOString(),
                        imageUrl: `/static/epp-images/${data.filename}`,
                        processedImageUrl: `/static/epp-images/${data.filename}`,
                        detections: data.detections,
                        isCompliant,
                        missingItems
                    }

                    history.push(record)
                }
            } catch (err) {
                console.error(`[Generate History] Error procesando ${jsonFile}:`, err)
            }
        }

        // Ordenar por timestamp (más recientes primero)
        history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        // Guardar historial
        await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2))

        console.log(`[Generate History] ✅ Historial generado con ${history.length} registros`)
        console.log(`[Generate History] Archivo guardado en: ${HISTORY_FILE}`)

        // Mostrar resumen
        const violations = history.filter(r => !r.isCompliant).length
        const compliant = history.filter(r => r.isCompliant).length
        console.log(`[Generate History] - Infracciones: ${violations}`)
        console.log(`[Generate History] - Cumplimiento: ${compliant}`)

    } catch (error) {
        console.error('[Generate History] Error:', error)
        process.exit(1)
    }
}

generateHistory()
