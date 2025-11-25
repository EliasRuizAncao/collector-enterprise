import { useMemo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  Type,
  FileText,
  Hash,
  Mail,
  Phone,
  Link,
  Calendar,
  Clock,
  CalendarClock,
  List,
  CheckSquare,
  CircleDot,
  SquareCheck,
  PenTool,
  Upload,
  Camera,
  GripVertical,
} from 'lucide-react'

import { Card } from '@/shared/components/ui/card'
import { FieldType } from '@/shared/types/formBuilder'
import { cn } from '@/shared/lib/utils'

/**
 * Configuración de cada tipo de campo en la paleta
 * Organizados según las categorías especificadas
 */
const fieldConfigs = [
  // Categoría: Texto
  {
    type: FieldType.TEXT,
    label: 'Texto',
    icon: Type,
    description: 'Campo de texto corto',
    category: 'Texto',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    type: FieldType.TEXTAREA,
    label: 'Texto largo',
    icon: FileText,
    description: 'Campo de texto multilínea',
    category: 'Texto',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    type: FieldType.EMAIL,
    label: 'Email',
    icon: Mail,
    description: 'Dirección de correo',
    category: 'Texto',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    type: FieldType.PHONE,
    label: 'Teléfono',
    icon: Phone,
    description: 'Número telefónico',
    category: 'Texto',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    type: FieldType.URL,
    label: 'URL',
    icon: Link,
    description: 'Enlace web',
    category: 'Texto',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  // Categoría: Números
  {
    type: FieldType.NUMBER,
    label: 'Número',
    icon: Hash,
    description: 'Campo numérico',
    category: 'Números',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  // Categoría: Fechas
  {
    type: FieldType.DATE,
    label: 'Fecha',
    icon: Calendar,
    description: 'Selección de fecha',
    category: 'Fechas',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    type: FieldType.TIME,
    label: 'Hora',
    icon: Clock,
    description: 'Selección de hora',
    category: 'Fechas',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    type: FieldType.DATETIME,
    label: 'Fecha y hora',
    icon: CalendarClock,
    description: 'Fecha y hora combinadas',
    category: 'Fechas',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  // Categoría: Selección
  {
    type: FieldType.SELECT,
    label: 'Selección',
    icon: List,
    description: 'Lista desplegable',
    category: 'Selección',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    type: FieldType.MULTISELECT,
    label: 'Selección múltiple',
    icon: CheckSquare,
    description: 'Múltiples opciones',
    category: 'Selección',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    type: FieldType.RADIO,
    label: 'Radio',
    icon: CircleDot,
    description: 'Botones de opción',
    category: 'Selección',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    type: FieldType.CHECKBOX,
    label: 'Casilla',
    icon: SquareCheck,
    description: 'Casilla de verificación',
    category: 'Selección',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  // Categoría: Especiales
  {
    type: FieldType.SIGNATURE,
    label: 'Firma',
    icon: PenTool,
    description: 'Firma digital',
    category: 'Especiales',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    type: FieldType.FILE,
    label: 'Archivo',
    icon: Upload,
    description: 'Carga de archivo',
    category: 'Especiales',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    type: FieldType.PHOTO,
    label: 'Foto',
    icon: Camera,
    description: 'Carga de imagen',
    category: 'Especiales',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
] as const

/**
 * Componente draggable para un tipo de campo
 * Muestra el campo en formato de card con grid
 */
const DraggableFieldCard = ({
  type,
  label,
  icon: Icon,
  description,
  color,
  bgColor,
}: (typeof fieldConfigs)[number]) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-type-${type}`,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'group relative cursor-grab active:cursor-grabbing',
        'border-border/70 bg-card transition-all duration-200',
        'hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5',
        'focus-within:ring-2 focus-within:ring-primary/20',
        isDragging && 'opacity-50 scale-95',
      )}
    >
      <div className="flex flex-col gap-2 p-3">
        {/* Icono y handle */}
        <div className="flex items-start justify-between gap-2">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', bgColor)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        {/* Contenido */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Indicador de arrastre */}
      <div className="absolute inset-0 rounded-lg border-2 border-dashed border-primary/30 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
    </Card>
  )
}

/**
 * Paleta de campos disponibles para arrastrar al canvas
 * Organizada por categorías con diseño en grid
 */
const FieldPalette = () => {
  // Memoizar las categorías y campos agrupados para mejor rendimiento
  const categoriesWithFields = useMemo(() => {
    const categories = Array.from(new Set(fieldConfigs.map((config) => config.category)))
    return categories.map((category) => ({
      category,
      fields: fieldConfigs.filter((config) => config.category === category),
    }))
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 space-y-1 border-b border-border/70 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h2 className="text-sm font-semibold text-foreground">Campos disponibles</h2>
        <p className="text-xs text-muted-foreground">
          Arrastra los campos al canvas para agregarlos
        </p>
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {categoriesWithFields.map(({ category, fields }) => (
            <div key={category} className="space-y-3">
              {/* Título de categoría */}
              <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </h3>
              </div>

              {/* Grid de campos */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {fields.map((config) => (
                  <DraggableFieldCard key={config.type} {...config} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FieldPalette

