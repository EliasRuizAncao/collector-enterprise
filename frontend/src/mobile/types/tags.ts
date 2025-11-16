/**
 * Tipos y interfaces para el sistema de tags
 */

/**
 * Colores disponibles para tags
 */
export type TagColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray'

/**
 * Tag del sistema
 */
export interface Tag {
  /** ID único del tag */
  id: string
  /** Nombre del tag */
  name: string
  /** Color del tag */
  color: TagColor
  /** Icono opcional (nombre de icono de lucide-react) */
  icon?: string
  /** Si es un tag predefinido del sistema */
  isSystem: boolean
  /** Fecha de creación */
  createdAt: Date
  /** Fecha de última modificación */
  updatedAt: Date
  /** Número de veces usado (para estadísticas) */
  usageCount?: number
}

/**
 * Tag con estado de selección (para TagPicker)
 */
export interface TagWithSelection extends Tag {
  /** Si el tag está seleccionado */
  selected: boolean
}

/**
 * Configuración de colores para tags
 */
export const TAG_COLORS: Record<TagColor, { bg: string; text: string; border: string }> = {
  red: {
    bg: 'bg-red-100 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-800',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-950',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-800',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-950',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-800',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-800',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-950',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-950',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-300 dark:border-pink-800',
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-950',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-800',
  },
}

/**
 * Tags predefinidos del sistema
 */
export const SYSTEM_TAGS: Tag[] = [
  {
    id: 'system-urgent',
    name: 'Urgente',
    color: 'red',
    icon: 'AlertCircle',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-important',
    name: 'Importante',
    color: 'orange',
    icon: 'Flag',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-review',
    name: 'Revisar',
    color: 'yellow',
    icon: 'Eye',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-completed',
    name: 'Completado',
    color: 'green',
    icon: 'CheckCircle2',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-in-progress',
    name: 'En progreso',
    color: 'blue',
    icon: 'Clock',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system-blocked',
    name: 'Bloqueado',
    color: 'gray',
    icon: 'Lock',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

