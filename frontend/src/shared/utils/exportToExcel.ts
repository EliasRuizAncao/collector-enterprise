import * as XLSX from 'xlsx'

/**
 * Opciones para exportar a Excel
 */
export interface ExportToExcelOptions {
  /**
   * Nombre del archivo (sin extensión)
   */
  filename?: string
  /**
   * Nombre de la hoja de trabajo
   */
  sheetName?: string
  /**
   * Si debe aplicar auto-ancho a las columnas
   */
  autoWidth?: boolean
  /**
   * Encabezados personalizados (opcional)
   */
  headers?: string[]
  /**
   * Formato de fecha para fechas
   */
  dateFormat?: string
}

/**
 * Formatea una fecha a string legible
 */
const formatDate = (date: Date | string, format?: string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    return String(date)
  }

  if (format === 'ISO') {
    return d.toISOString()
  }

  if (format === 'locale') {
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Formato por defecto: YYYY-MM-DD HH:mm
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * Detecta si un valor es una fecha
 */
const isDate = (value: unknown): value is Date | string => {
  if (value instanceof Date) {
    return true
  }
  if (typeof value === 'string') {
    const date = new Date(value)
    return !isNaN(date.getTime()) && value.includes('T')
  }
  return false
}

/**
 * Convierte un array de objetos a un array 2D para Excel
 */
const prepareData = (
  data: Record<string, unknown>[],
  options?: ExportToExcelOptions,
): unknown[][] => {
  if (!data || data.length === 0) {
    return []
  }

  // Obtener todas las claves únicas de todos los objetos
  const allKeys = new Set<string>()
  data.forEach((item) => {
    Object.keys(item).forEach((key) => allKeys.add(key))
  })

  const keys = Array.from(allKeys)

  // Usar headers personalizados si se proporcionan
  const headers = options?.headers || keys

  // Crear fila de encabezados
  const headerRow: unknown[] = headers.map((header) => {
    // Si el header está en el formato key:label, extraer solo el label
    return header.includes(':') ? header.split(':')[1] : header
  })

  // Crear filas de datos
  const dataRows = data.map((item) => {
    return keys.map((key) => {
      const value = item[key]

      // Formatear fechas
      if (isDate(value)) {
        return formatDate(value, options?.dateFormat)
      }

      // Formatear objetos anidados como JSON string
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return JSON.stringify(value)
      }

      // Formatear arrays como string separado por comas
      if (Array.isArray(value)) {
        return value.join(', ')
      }

      return value ?? ''
    })
  })

  return [headerRow, ...dataRows]
}

/**
 * Calcula el ancho automático de columnas
 */
const calculateColumnWidths = (data: unknown[][]): XLSX.ColInfo[] => {
  if (!data || data.length === 0) {
    return []
  }

  const numColumns = data[0]?.length || 0
  const columnWidths: XLSX.ColInfo[] = []

  for (let col = 0; col < numColumns; col++) {
    let maxLength = 0

    // Buscar la longitud máxima en esta columna
    data.forEach((row) => {
      const cellValue = row[col]
      const cellLength = cellValue ? String(cellValue).length : 0
      maxLength = Math.max(maxLength, cellLength)
    })

    // Establecer ancho mínimo de 10 y máximo de 50
    const width = Math.max(10, Math.min(maxLength + 2, 50))
    columnWidths.push({ wch: width })
  }

  return columnWidths
}

/**
 * Exporta datos a un archivo Excel (.xlsx)
 *
 * @param data - Array de objetos a exportar
 * @param options - Opciones de exportación
 *
 * @example
 * ```typescript
 * const data = [
 *   { nombre: 'Juan', edad: 30, fecha: new Date() },
 *   { nombre: 'María', edad: 25, fecha: new Date() },
 * ]
 *
 * exportToExcel(data, {
 *   filename: 'usuarios',
 *   sheetName: 'Usuarios',
 *   autoWidth: true,
 * })
 * ```
 */
export const exportToExcel = (
  data: Record<string, unknown>[],
  options?: ExportToExcelOptions,
): void => {
  try {
    if (!data || data.length === 0) {
      console.warn('No hay datos para exportar')
      return
    }

    // Preparar datos
    const preparedData = prepareData(data, options)

    // Crear workbook
    const wb = XLSX.utils.book_new()

    // Crear worksheet desde los datos preparados
    const ws = XLSX.utils.aoa_to_sheet(preparedData)

    // Aplicar auto-ancho de columnas si está habilitado
    if (options?.autoWidth !== false) {
      const columnWidths = calculateColumnWidths(preparedData)
      ws['!cols'] = columnWidths
    }

    // Estilizar encabezados (primera fila) - bold
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!ws[cellAddress]) continue

      // XLSX no soporta estilos directamente, pero podemos preparar para cuando se agregue soporte
      // Por ahora, solo ajustamos el ancho de las columnas
      if (!ws[cellAddress].s) {
        ws[cellAddress].s = {}
      }
    }

    // Agregar worksheet al workbook
    const sheetName = options?.sheetName || 'Datos'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Generar nombre de archivo
    const filename = options?.filename || 'reporte'
    const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`

    // Escribir archivo
    XLSX.writeFile(wb, fullFilename)

    console.log(`Archivo Excel exportado: ${fullFilename}`)
  } catch (error) {
    console.error('Error al exportar a Excel:', error)
    throw new Error('No se pudo exportar el archivo Excel')
  }
}

/**
 * Exporta múltiples hojas de trabajo a un solo archivo Excel
 *
 * @param sheets - Array de objetos con nombre de hoja y datos
 * @param filename - Nombre del archivo
 *
 * @example
 * ```typescript
 * exportMultipleSheets([
 *   { name: 'Usuarios', data: usersData },
 *   { name: 'Formularios', data: formsData },
 * ], 'reporte-completo')
 * ```
 */
export const exportMultipleSheets = (
  sheets: Array<{ name: string; data: Record<string, unknown>[] }>,
  filename?: string,
): void => {
  try {
    if (!sheets || sheets.length === 0) {
      console.warn('No hay hojas para exportar')
      return
    }

    const wb = XLSX.utils.book_new()

    sheets.forEach(({ name, data }) => {
      if (!data || data.length === 0) {
        console.warn(`Hoja "${name}" está vacía, se omitirá`)
        return
      }

      const preparedData = prepareData(data, { sheetName: name })
      const ws = XLSX.utils.aoa_to_sheet(preparedData)

      // Aplicar auto-ancho
      const columnWidths = calculateColumnWidths(preparedData)
      ws['!cols'] = columnWidths

      XLSX.utils.book_append_sheet(wb, ws, name)
    })

    const fullFilename = filename?.endsWith('.xlsx')
      ? filename
      : `${filename || 'reporte'}.xlsx`

    XLSX.writeFile(wb, fullFilename)

    console.log(`Archivo Excel con múltiples hojas exportado: ${fullFilename}`)
  } catch (error) {
    console.error('Error al exportar múltiples hojas a Excel:', error)
    throw new Error('No se pudo exportar el archivo Excel')
  }
}

