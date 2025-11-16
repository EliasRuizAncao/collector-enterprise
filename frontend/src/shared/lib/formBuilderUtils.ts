import { FieldType } from '@/shared/types/formBuilder'

/**
 * Obtiene la etiqueta legible de un tipo de campo
 */
export function getFieldTypeLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    [FieldType.TEXT]: 'Texto',
    [FieldType.TEXTAREA]: 'Texto largo',
    [FieldType.NUMBER]: 'Número',
    [FieldType.EMAIL]: 'Email',
    [FieldType.PHONE]: 'Teléfono',
    [FieldType.URL]: 'URL',
    [FieldType.DATE]: 'Fecha',
    [FieldType.TIME]: 'Hora',
    [FieldType.DATETIME]: 'Fecha y hora',
    [FieldType.SELECT]: 'Selección',
    [FieldType.MULTISELECT]: 'Selección múltiple',
    [FieldType.RADIO]: 'Radio',
    [FieldType.CHECKBOX]: 'Casilla',
    [FieldType.SIGNATURE]: 'Firma',
    [FieldType.FILE]: 'Archivo',
    [FieldType.PHOTO]: 'Foto',
  }

  return labels[type] || type
}

