import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Trash2,
  Copy,
  Edit,
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
  Plus,
} from 'lucide-react'

import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Badge } from '@/shared/components/ui/badge'
import { type Field, FieldType } from '@/shared/types/formBuilder'
import { cn } from '@/shared/lib/utils'
import { getFieldTypeLabel } from '@/shared/lib/formBuilderUtils'

/**
 * Mapeo de tipos de campo a sus iconos
 */
const fieldIcons: Record<FieldType, typeof Type> = {
  [FieldType.TEXT]: Type,
  [FieldType.TEXTAREA]: FileText,
  [FieldType.NUMBER]: Hash,
  [FieldType.EMAIL]: Mail,
  [FieldType.PHONE]: Phone,
  [FieldType.URL]: Link,
  [FieldType.DATE]: Calendar,
  [FieldType.TIME]: Clock,
  [FieldType.DATETIME]: CalendarClock,
  [FieldType.SELECT]: List,
  [FieldType.MULTISELECT]: CheckSquare,
  [FieldType.RADIO]: CircleDot,
  [FieldType.CHECKBOX]: SquareCheck,
  [FieldType.SIGNATURE]: PenTool,
  [FieldType.FILE]: Upload,
  [FieldType.PHOTO]: Camera,
}

interface SortableFieldItemProps {
  field: Field
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

/**
 * Item de campo sortable en el canvas
 * Muestra el campo con su preview y acciones
 */
const SortableFieldItem = ({
  field,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableFieldItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const FieldIcon = fieldIcons[field.type]

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative',
        isDragging && 'z-50 opacity-50',
      )}
    >
      <Card
        className={cn(
          'relative cursor-pointer border-2 transition-all duration-200',
          'hover:shadow-lg hover:-translate-y-0.5',
          isSelected
            ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
            : 'border-border/70 bg-card hover:border-primary/50 hover:shadow-sm',
          isDragging && 'scale-95',
        )}
        onClick={onSelect}
      >
        {/* Indicador de selección */}
        {isSelected && (
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-primary" />
        )}

        <div className="flex items-start gap-3 p-4">
          {/* Handle para arrastrar */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label="Reordenar campo"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Ícono del tipo de campo */}
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FieldIcon className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Contenido del campo */}
          <div className="flex-1 space-y-3">
            {/* Header con label y badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{field.label}</span>
                  {field.required && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      Requerido
                    </Badge>
                  )}
                  {field.disabled && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      Deshabilitado
                    </Badge>
                  )}
                  {field.hidden && (
                    <Badge variant="outline" className="h-5 px-1.5 text-xs">
                      Oculto
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-5 px-1.5 text-xs font-normal">
                    {getFieldTypeLabel(field.type)}
                  </Badge>
                  {field.helperText && (
                    <span className="text-xs text-muted-foreground truncate">
                      {field.helperText}
                    </span>
                  )}
                </div>
              </div>

              {/* Menú de acciones */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <span className="sr-only">Opciones del campo</span>
                    <span className="text-base leading-none">⋯</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onSelect() }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar propiedades
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDuplicate() }}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar campo
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete() }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar campo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Vista previa del campo */}
            <div className="rounded-md border border-border/50 bg-muted/20 p-3">
              {renderFieldPreview(field)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

/**
 * Renderiza una vista previa del campo según su tipo
 */
const renderFieldPreview = (field: Field) => {
  switch (field.type) {
    case FieldType.TEXT:
    case FieldType.EMAIL:
    case FieldType.PHONE:
    case FieldType.URL:
      return (
        <input
          type="text"
          placeholder={field.placeholder || 'Vista previa...'}
          disabled
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
        />
      )

    case FieldType.TEXTAREA:
      return (
        <textarea
          placeholder={field.placeholder || 'Vista previa...'}
          disabled
          rows={field.rows || 3}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-muted-foreground resize-none"
        />
      )

    case FieldType.NUMBER:
      return (
        <input
          type="number"
          placeholder={field.placeholder || '0'}
          disabled
          min={field.validations?.min}
          max={field.validations?.max}
          step={field.validations?.step}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
        />
      )

    case FieldType.DATE:
      return (
        <input
          type="date"
          disabled
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
        />
      )

    case FieldType.TIME:
      return (
        <input
          type="time"
          disabled
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
        />
      )

    case FieldType.DATETIME:
      return (
        <input
          type="datetime-local"
          disabled
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
        />
      )

    case FieldType.SELECT:
      return (
        <select
          disabled
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
        >
          <option>Selecciona una opción...</option>
          {'options' in field && field.options
            ? field.options.slice(0, 3).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : null}
        </select>
      )

    case FieldType.MULTISELECT:
      return (
        <div className="space-y-2">
          {'options' in field && field.options
            ? field.options.slice(0, 3).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" disabled className="rounded" />
                  <span>{opt.label}</span>
                </label>
              ))
            : (
                <>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" disabled className="rounded" />
                    <span>Opción 1</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" disabled className="rounded" />
                    <span>Opción 2</span>
                  </label>
                </>
              )}
        </div>
      )

    case FieldType.RADIO:
      return (
        <div className="space-y-2">
          {'options' in field && field.options
            ? field.options.slice(0, 3).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="radio" disabled className="rounded-full" />
                  <span>{opt.label}</span>
                </label>
              ))
            : (
                <>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="radio" disabled className="rounded-full" />
                    <span>Opción 1</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="radio" disabled className="rounded-full" />
                    <span>Opción 2</span>
                  </label>
                </>
              )}
        </div>
      )

    case FieldType.CHECKBOX:
      return (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" disabled className="rounded" />
          <span>{'checkboxLabel' in field && field.checkboxLabel
            ? field.checkboxLabel
            : 'Casilla de verificación'}</span>
        </label>
      )

    case FieldType.SIGNATURE:
      return (
        <div className="flex h-24 items-center justify-center rounded border-2 border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
          <div className="text-center">
            <PenTool className="mx-auto mb-1 h-5 w-5" />
            <span>Área de firma digital</span>
          </div>
        </div>
      )

    case FieldType.FILE:
      return (
        <div className="flex items-center justify-center rounded border-2 border-dashed border-border bg-muted/30 py-6 text-xs text-muted-foreground">
          <div className="text-center">
            <Upload className="mx-auto mb-1 h-5 w-5" />
            <span>Cargar archivo</span>
          </div>
        </div>
      )

    case FieldType.PHOTO:
      return (
        <div className="flex items-center justify-center rounded border-2 border-dashed border-border bg-muted/30 py-6 text-xs text-muted-foreground">
          <div className="text-center">
            <Camera className="mx-auto mb-1 h-5 w-5" />
            <span>Cargar foto</span>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-xs text-muted-foreground">
          Vista previa no disponible para este tipo de campo
        </div>
      )
  }
}

/**
 * Área de drop para nuevos campos
 */
const DropZone = () => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone', // Debe coincidir con DROP_ZONE_IDS.CANVAS en FormBuilder
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border-2 border-dashed transition-all duration-200',
        isOver
          ? 'border-primary bg-primary/5'
          : 'border-border/50 bg-muted/20',
      )}
    >
      <div className="flex items-center justify-center py-8 text-center">
        <div className="space-y-2">
          <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            {isOver ? 'Suelta aquí para agregar' : 'Arrastra campos aquí'}
          </p>
        </div>
      </div>
    </div>
  )
}

interface FormCanvasProps {
  /** Lista de campos del formulario */
  fields: Field[]
  /** ID del campo seleccionado actualmente */
  selectedFieldId?: string | null
  /** Callback cuando se selecciona un campo */
  onFieldSelect: (field: Field) => void
  /** Callback cuando se elimina un campo */
  onDeleteField: (fieldId: string) => void
  /** Callback cuando se duplica un campo */
  onDuplicateField: (fieldId: string) => void
}

/**
 * Canvas principal donde se construye el formulario
 * Permite arrastrar, reordenar y editar campos
 */
const FormCanvas = ({
  fields,
  selectedFieldId,
  onFieldSelect,
  onDeleteField,
  onDuplicateField,
}: FormCanvasProps) => {
  // Memoizar los IDs de campos para SortableContext
  const fieldIds = useMemo(() => fields.map((f) => f.id), [fields])

  // Estado vacío
  if (fields.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <DropZone />
          <div className="mt-6 space-y-2 text-center">
            <h3 className="text-lg font-semibold text-foreground">Canvas vacío</h3>
            <p className="text-sm text-muted-foreground">
              Arrastra campos desde la paleta izquierda para comenzar a construir tu formulario
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {fields.map((field) => (
            <SortableFieldItem
              key={field.id}
              field={field}
              isSelected={selectedFieldId === field.id}
              onSelect={() => onFieldSelect(field)}
              onDelete={() => onDeleteField(field.id)}
              onDuplicate={() => onDuplicateField(field.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Área de drop al final para agregar nuevos campos */}
      <div className="pt-2">
        <DropZone />
      </div>
    </div>
  )
}

export default FormCanvas
