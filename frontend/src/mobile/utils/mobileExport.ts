/**
 * mobileExport.ts - Sistema de exportación de datos para mobile
 * Soporta PDF, CSV, Excel (XLSX) e Imagen (PNG)
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Tipos de formato de exportación
 */
export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'png'

/**
 * Opciones de exportación
 */
export interface ExportOptions {
  format: ExportFormat
  includeCharts?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  title?: string
  data?: any[]
  metadata?: {
    userId?: string
    userName?: string
    period?: string
    appVersion?: string
  }
}

/**
 * Metadata del export
 */
interface ExportMetadata {
  generatedAt: string
  userId?: string
  userName?: string
  period?: string
  appVersion?: string
  format: ExportFormat
  fileSize: number
}

/**
 * Cache de exports (últimos 3)
 */
const EXPORT_CACHE_KEY = 'collector-export-cache'
const MAX_CACHED_EXPORTS = 3

/**
 * Obtener cache de exports
 */
const getExportCache = (): Array<{ metadata: ExportMetadata; dataUrl: string }> => {
  try {
    const cached = localStorage.getItem(EXPORT_CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  } catch {
    return []
  }
}

/**
 * Guardar en cache
 */
const saveToCache = (metadata: ExportMetadata, dataUrl: string) => {
  try {
    const cache = getExportCache()
    cache.unshift({ metadata, dataUrl })
    
    // Mantener solo los últimos 3
    if (cache.length > MAX_CACHED_EXPORTS) {
      cache.splice(MAX_CACHED_EXPORTS)
    }
    
    localStorage.setItem(EXPORT_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Error guardando export en cache:', error)
  }
}

/**
 * Limpiar cache viejo (más de 7 días)
 */
const cleanOldCache = () => {
  try {
    const cache = getExportCache()
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    
    const filtered = cache.filter((item) => {
      const generatedAt = new Date(item.metadata.generatedAt).getTime()
      return generatedAt > sevenDaysAgo
    })
    
    if (filtered.length !== cache.length) {
      localStorage.setItem(EXPORT_CACHE_KEY, JSON.stringify(filtered))
    }
  } catch (error) {
    console.error('Error limpiando cache:', error)
  }
}

/**
 * Verificar si hay un export en cache con los mismos datos
 */
export const getCachedExport = (options: ExportOptions): string | null => {
  try {
    const cache = getExportCache()
    const cached = cache.find(
      (item) =>
        item.metadata.format === options.format &&
        item.metadata.period === options.metadata?.period,
    )
    return cached?.dataUrl || null
  } catch {
    return null
  }
}

/**
 * Descargar archivo
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Compartir usando Share API
 */
export const shareReport = async (file: Blob, filename: string, title: string = 'Reporte Collector') => {
  try {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [new File([file], filename, { type: file.type })],
        title,
        text: 'Mi reporte de actividad',
      })
      return true
    }
  } catch (error: any) {
    // Usuario canceló o error
    if (error.name !== 'AbortError') {
      console.error('Error compartiendo:', error)
    }
  }
  
  // Fallback: descargar
  downloadFile(file, filename)
  return false
}

/**
 * Verificar tamaño del archivo y mostrar warning si es grande
 */
const checkFileSize = (blob: Blob, onWarning?: (size: number) => void) => {
  const sizeMB = blob.size / (1024 * 1024)
  if (sizeMB > 5 && onWarning) {
    onWarning(sizeMB)
  }
  return sizeMB
}

/**
 * Generar PDF
 */
export const generatePDF = async (
  options: ExportOptions,
  onProgress?: (progress: number) => void,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      onProgress?.(10)
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })
      
      // Logo (placeholder - en producción usar logo real)
      const logoText = 'Amaranto Constructora'
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(logoText, 20, 20)
      
      onProgress?.(30)
      
      // Título
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      const title = options.title || 'Reporte de Actividad'
      doc.text(title, 20, 35)
      
      // Metadata
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      const metadata = options.metadata
      let yPos = 45
      
      if (metadata?.userName) {
        doc.text(`Usuario: ${metadata.userName}`, 20, yPos)
        yPos += 7
      }
      
      if (metadata?.period) {
        doc.text(`Período: ${metadata.period}`, 20, yPos)
        yPos += 7
      }
      
      doc.text(
        `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
        20,
        yPos,
      )
      yPos += 15
      
      onProgress?.(50)
      
      // Datos en tabla
      if (options.data && options.data.length > 0) {
        const headers = Object.keys(options.data[0])
        const rows = options.data.map((row) => headers.map((key) => String(row[key] || '')))
        
        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: yPos,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [15, 23, 42], textColor: 255 },
          margin: { top: yPos, left: 20, right: 20 },
        })
      }
      
      onProgress?.(80)
      
      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Página ${i} de ${pageCount} - Collector Enterprise v${metadata?.appVersion || '1.0.0'}`,
          105,
          285,
          { align: 'center' },
        )
      }
      
      onProgress?.(100)
      
      const blob = doc.output('blob')
      resolve(blob)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generar CSV
 */
export const generateCSV = async (
  options: ExportOptions,
  onProgress?: (progress: number) => void,
): Promise<Blob> => {
  return new Promise((resolve) => {
    try {
      onProgress?.(10)
      
      if (!options.data || options.data.length === 0) {
        resolve(new Blob([''], { type: 'text/csv;charset=utf-8;' }))
        return
      }
      
      onProgress?.(30)
      
      const headers = Object.keys(options.data[0])
      const rows = options.data.map((row) =>
        headers.map((key) => {
          const value = row[key]
          // Formatear fechas a ISO
          if (value instanceof Date) {
            return value.toISOString()
          }
          // Escapar comillas y envolver en comillas si contiene comas
          const str = String(value || '')
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }),
      )
      
      onProgress?.(60)
      
      // UTF-8 BOM para Excel
      const BOM = '\uFEFF'
      const csvContent = [
        BOM,
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n')
      
      onProgress?.(100)
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      resolve(blob)
    } catch (error) {
      resolve(new Blob([''], { type: 'text/csv;charset=utf-8;' }))
    }
  })
}

/**
 * Generar Excel (XLSX)
 */
export const generateXLSX = async (
  options: ExportOptions,
  onProgress?: (progress: number) => void,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      onProgress?.(10)
      
      const workbook = XLSX.utils.book_new()
      
      onProgress?.(20)
      
      // Sheet de datos
      if (options.data && options.data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(options.data)
        
        // Ajustar ancho de columnas
        const maxWidth = 50
        const colWidths = Object.keys(options.data[0]).map((key) => {
          const maxLength = Math.max(
            key.length,
            ...options.data!.map((row) => String(row[key] || '').length),
          )
          return { wch: Math.min(maxLength + 2, maxWidth) }
        })
        worksheet['!cols'] = colWidths
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
      }
      
      onProgress?.(50)
      
      // Sheet de metadata
      const metadataSheet = XLSX.utils.aoa_to_sheet([
        ['Reporte de Actividad'],
        [],
        ['Metadata'],
        ['Usuario', options.metadata?.userName || 'N/A'],
        ['Período', options.metadata?.period || 'N/A'],
        ['Generado', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
        ['Versión App', options.metadata?.appVersion || '1.0.0'],
      ])
      
      // Ajustar ancho
      metadataSheet['!cols'] = [{ wch: 15 }, { wch: 30 }]
      
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata')
      
      onProgress?.(80)
      
      // Generar blob
      const excelBuffer = XLSX.write(workbook, {
        type: 'array',
        bookType: 'xlsx',
      })
      
      onProgress?.(100)
      
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      
      resolve(blob)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generar PNG (screenshot)
 */
export const generatePNG = async (
  element: HTMLElement,
  options: ExportOptions,
  onProgress?: (progress: number) => void,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      onProgress?.(10)
      
      html2canvas(element, {
        scale: 2, // Alta resolución
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
        .then((canvas) => {
          onProgress?.(60)
          
          // Agregar watermark de logo (opcional)
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
            ctx.font = 'bold 24px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Amaranto Constructora', canvas.width / 2, canvas.height - 20)
          }
          
          onProgress?.(80)
          
          canvas.toBlob(
            (blob) => {
              onProgress?.(100)
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Error generando imagen'))
              }
            },
            'image/png',
            1.0,
          )
        })
        .catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Función principal de exportación
 */
export const exportData = async (
  options: ExportOptions,
  element?: HTMLElement,
  onProgress?: (progress: number) => void,
  onWarning?: (sizeMB: number) => void,
): Promise<{ blob: Blob; filename: string; metadata: ExportMetadata }> => {
  // Limpiar cache viejo
  cleanOldCache()
  
  // Verificar cache
  const cached = getCachedExport(options)
  if (cached) {
    // Convertir dataUrl a Blob
    const response = await fetch(cached)
    const blob = await response.blob()
    const metadata: ExportMetadata = {
      generatedAt: new Date().toISOString(),
      format: options.format,
      fileSize: blob.size,
    }
    return { blob, filename: generateFilename(options), metadata }
  }
  
  let blob: Blob
  
  switch (options.format) {
    case 'pdf':
      blob = await generatePDF(options, onProgress)
      break
    case 'csv':
      blob = await generateCSV(options, onProgress)
      break
    case 'xlsx':
      blob = await generateXLSX(options, onProgress)
      break
    case 'png':
      if (!element) {
        throw new Error('Elemento HTML requerido para exportar PNG')
      }
      blob = await generatePNG(element, options, onProgress)
      break
    default:
      throw new Error(`Formato no soportado: ${options.format}`)
  }
  
  // Verificar tamaño
  const sizeMB = checkFileSize(blob, onWarning)
  
  // Crear metadata
  const metadata: ExportMetadata = {
    generatedAt: new Date().toISOString(),
    userId: options.metadata?.userId,
    userName: options.metadata?.userName,
    period: options.metadata?.period,
    appVersion: options.metadata?.appVersion || '1.0.0',
    format: options.format,
    fileSize: blob.size,
  }
  
  // Guardar en cache (solo si no es muy grande)
  if (sizeMB < 5) {
    const dataUrl = await blobToDataUrl(blob)
    saveToCache(metadata, dataUrl)
  }
  
  return {
    blob,
    filename: generateFilename(options),
    metadata,
  }
}

/**
 * Generar nombre de archivo
 */
const generateFilename = (options: ExportOptions): string => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: es })
  const title = options.title?.toLowerCase().replace(/\s+/g, '-') || 'reporte'
  const extension = options.format === 'xlsx' ? 'xlsx' : options.format
  return `collector-${title}-${timestamp}.${extension}`
}

/**
 * Convertir Blob a DataURL
 */
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Limpiar cache de exports
 */
export const clearExportCache = () => {
  try {
    localStorage.removeItem(EXPORT_CACHE_KEY)
  } catch (error) {
    console.error('Error limpiando cache:', error)
  }
}

/**
 * Obtener tamaño del cache
 */
export const getExportCacheSize = (): number => {
  try {
    const cache = getExportCache()
    return cache.reduce((total, item) => total + item.metadata.fileSize, 0)
  } catch {
    return 0
  }
}

