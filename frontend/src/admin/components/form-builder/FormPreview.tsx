import { useState } from 'react'
import {
  X,
  Smartphone,
  Monitor,
  PenTool,
  Upload,
  Camera,
  // Iconos para fieldIcons (comentados hasta que se implemente la visualización de iconos)
  // Type,
  // FileText,
  // Hash,
  // Mail,
  // Phone,
  // Link,
  // Calendar,
  // Clock,
  // CalendarClock,
  // List,
  // CheckSquare,
  // CircleDot,
  // SquareCheck,
} from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { type Form, type Field, FieldType } from '@/shared/types/formBuilder'
import { cn } from '@/shared/lib/utils'

interface FormPreviewProps {
  /** Formulario a previsualizar */
  form: Form
  /** Si se muestra en un Sheet (true) o Dialog (false) */
  asSheet?: boolean
  /** Si está abierto (controlado) */
  open?: boolean
  /** Callback cuando cambia el estado de apertura */
  onOpenChange?: (open: boolean) => void
  /** Trigger para abrir el preview */
  trigger?: React.ReactNode
}

/**
 * Mapeo de tipos de campo a sus iconos
 * TODO: Usar cuando se implemente la visualización de iconos en los campos
 */
// const fieldIcons: Record<FieldType, typeof Type> = {
//   [FieldType.TEXT]: Type,
//   [FieldType.TEXTAREA]: FileText,
//   [FieldType.NUMBER]: Hash,
//   [FieldType.EMAIL]: Mail,
//   [FieldType.PHONE]: Phone,
//   [FieldType.URL]: Link,
//   [FieldType.DATE]: Calendar,
//   [FieldType.TIME]: Clock,
//   [FieldType.DATETIME]: CalendarClock,
//   [FieldType.SELECT]: List,
//   [FieldType.MULTISELECT]: CheckSquare,
//   [FieldType.RADIO]: CircleDot,
//   [FieldType.CHECKBOX]: SquareCheck,
//   [FieldType.SIGNATURE]: PenTool,
//   [FieldType.FILE]: Upload,
//   [FieldType.PHOTO]: Camera,
// }

/**
 * Renderiza un campo individual en la vista previa
 */
const PreviewField = ({ field }: { field: Field }) => {
  // const FieldIcon = fieldIcons[field.type] // No se usa actualmente

  return (
    <div className="space-y-2">
      {/* Label del campo */}
      <div className="flex items-center gap-2">
        <Label htmlFor={`preview-${field.id}`} className="text-sm font-medium">
          {field.label}
        </Label>
        {field.required && (
          <Badge variant="destructive" className="h-4 px-1 text-xs">
            *
          </Badge>
        )}
        {field.disabled && (
          <Badge variant="secondary" className="h-4 px-1 text-xs">
            Deshabilitado
          </Badge>
        )}
        {field.hidden && (
          <Badge variant="outline" className="h-4 px-1 text-xs">
            Oculto
          </Badge>
        )}
      </div>

      {/* Helper text */}
      {field.helperText && (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      )}

      {/* Campo según su tipo */}
      <div className="space-y-1">
        {renderFieldInput(field)}
      </div>

      {/* Validaciones visibles */}
      {field.validations && renderValidations(field)}
    </div>
  )
}

/**
 * Renderiza el input según el tipo de campo
 */
const renderFieldInput = (field: Field) => {
  const baseProps = {
    id: `preview-${field.id}`,
    disabled: field.disabled,
    placeholder: field.placeholder,
    className: 'w-full',
  }

  switch (field.type) {
    case FieldType.TEXT:
    case FieldType.EMAIL:
    case FieldType.PHONE:
    case FieldType.URL:
      return (
        <Input
          {...baseProps}
          type={
            field.type === FieldType.EMAIL
              ? 'email'
              : field.type === FieldType.PHONE
                ? 'tel'
                : field.type === FieldType.URL
                  ? 'url'
                  : 'text'
          }
          maxLength={field.validations?.maxLength}
          minLength={field.validations?.minLength}
          pattern={field.validations?.pattern}
        />
      )

    case FieldType.TEXTAREA:
      return (
        <Textarea
          {...baseProps}
          rows={field.rows || 4}
          maxLength={field.validations?.maxLength}
          minLength={field.validations?.minLength}
        />
      )

    case FieldType.NUMBER:
      return (
        <Input
          {...baseProps}
          type="number"
          min={field.validations?.min}
          max={field.validations?.max}
          step={field.validations?.step}
        />
      )

    case FieldType.DATE:
      return <Input {...baseProps} type="date" min={field.validations?.minDate} max={field.validations?.maxDate} />

    case FieldType.TIME:
      return <Input {...baseProps} type="time" />

    case FieldType.DATETIME:
      return (
        <Input
          {...baseProps}
          type="datetime-local"
          min={field.validations?.minDate}
          max={field.validations?.maxDate}
        />
      )

    case FieldType.SELECT:
      return (
        <select
          {...baseProps}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <option value="">Selecciona una opción...</option>
          {'options' in field && field.options
            ? field.options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : null}
        </select>
      )

    case FieldType.MULTISELECT:
      return (
        <div className="space-y-2 rounded-md border border-input bg-background p-3">
          {'options' in field && field.options
            ? field.options.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    disabled={field.disabled || opt.disabled}
                    className="rounded"
                  />
                  <span>{opt.label}</span>
                </label>
              ))
            : (
                <p className="text-xs text-muted-foreground">No hay opciones disponibles</p>
              )}
        </div>
      )

    case FieldType.RADIO:
      return (
        <div className="space-y-2">
          {'options' in field && field.options
            ? field.options.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                >
                  <input
                    type="radio"
                    name={`preview-${field.id}`}
                    value={opt.value}
                    disabled={field.disabled || opt.disabled}
                    className="rounded-full"
                  />
                  <span>{opt.label}</span>
                </label>
              ))
            : (
                <p className="text-xs text-muted-foreground">No hay opciones disponibles</p>
              )}
        </div>
      )

    case FieldType.CHECKBOX:
      if ('options' in field && field.options && field.options.length > 0) {
        // Grupo de checkboxes
        return (
          <div className="space-y-2">
            {field.options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  value={opt.value}
                  disabled={field.disabled || opt.disabled}
                  className="rounded"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )
      }
      // Casilla única
      return (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            disabled={field.disabled}
            className="rounded"
          />
          <span>{'checkboxLabel' in field && field.checkboxLabel
            ? field.checkboxLabel
            : 'Casilla de verificación'}</span>
        </label>
      )

    case FieldType.SIGNATURE:
      return (
        <div
          className="flex h-32 items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30"
          style={{
            width: 'width' in field && field.width ? `${field.width}px` : '100%',
            height: 'height' in field && field.height ? `${field.height}px` : '128px',
          }}
        >
          <div className="text-center">
            <PenTool className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Área de firma digital</p>
          </div>
        </div>
      )

    case FieldType.FILE:
      return (
        <div className="flex items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30 py-8">
          <div className="text-center">
            <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {'multiple' in field && field.multiple ? 'Arrastra archivos aquí' : 'Arrastra un archivo aquí'}
            </p>
            {field.validations?.acceptedFileTypes && (
              <p className="mt-1 text-xs text-muted-foreground">
                Tipos permitidos: {field.validations.acceptedFileTypes.join(', ')}
              </p>
            )}
            {field.validations?.maxFileSize && (
              <p className="mt-1 text-xs text-muted-foreground">
                Tamaño máximo: {field.validations.maxFileSize} MB
              </p>
            )}
          </div>
        </div>
      )

    case FieldType.PHOTO:
      return (
        <div className="flex items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30 py-8">
          <div className="text-center">
            <Camera className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {'multiple' in field && field.multiple ? 'Arrastra fotos aquí' : 'Arrastra una foto aquí'}
            </p>
            {field.validations?.acceptedFileTypes && (
              <p className="mt-1 text-xs text-muted-foreground">
                Tipos permitidos: {field.validations.acceptedFileTypes.join(', ')}
              </p>
            )}
            {field.validations?.maxFileSize && (
              <p className="mt-1 text-xs text-muted-foreground">
                Tamaño máximo: {field.validations.maxFileSize} MB
              </p>
            )}
          </div>
        </div>
      )

    default:
      return (
        <div className="rounded-md border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Tipo de campo no soportado: {(field as Field).type}
        </div>
      )
  }
}

/**
 * Renderiza las validaciones visibles del campo
 */
const renderValidations = (field: Field) => {
  const validations = field.validations
  if (!validations) {
    return null
  }

  const messages: string[] = []

  if (validations.minLength !== undefined) {
    messages.push(`Mínimo ${validations.minLength} caracteres`)
  }
  if (validations.maxLength !== undefined) {
    messages.push(`Máximo ${validations.maxLength} caracteres`)
  }
  if (validations.min !== undefined) {
    messages.push(`Mínimo: ${validations.min}`)
  }
  if (validations.max !== undefined) {
    messages.push(`Máximo: ${validations.max}`)
  }
  if (validations.minDate) {
    messages.push(`Fecha mínima: ${validations.minDate}`)
  }
  if (validations.maxDate) {
    messages.push(`Fecha máxima: ${validations.maxDate}`)
  }
  if (validations.minSelections !== undefined) {
    messages.push(`Mínimo ${validations.minSelections} selección(es)`)
  }
  if (validations.maxSelections !== undefined) {
    messages.push(`Máximo ${validations.maxSelections} selección(es)`)
  }

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      {messages.map((msg, index) => (
        <p key={index} className="text-xs text-muted-foreground">
          • {msg}
        </p>
      ))}
    </div>
  )
}

/**
 * Componente de vista previa del formulario
 * Muestra cómo se verá el formulario para el usuario final
 */
const FormPreview = ({
  form,
  asSheet = true,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: FormPreviewProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

  // Usar estado controlado o interno
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  // Campos visibles (excluir ocultos)
  const visibleFields = form.fields.filter((field) => !field.hidden)

  // Campos ordenados
  const sortedFields = [...visibleFields].sort((a, b) => a.order - b.order)

  const content = (
    <div className="space-y-6">
      {/* Header del formulario */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{form.title}</h2>
        {form.description && (
          <p className="text-sm text-muted-foreground">{form.description}</p>
        )}
      </div>

      <Separator />

      {/* Selector de vista (desktop/mobile) */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Vista previa</p>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="mr-2 h-4 w-4" />
            Desktop
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Mobile
          </Button>
        </div>
      </div>

      {/* Formulario preview */}
      <div
        className={cn(
          'mx-auto rounded-lg border border-border bg-background p-6 shadow-sm',
          viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl',
        )}
      >
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {sortedFields.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No hay campos visibles en este formulario
              </p>
            </div>
          ) : (
            sortedFields.map((field) => (
              <PreviewField key={field.id} field={field} />
            ))
          )}

          {/* Botón de envío (no funcional) */}
          {sortedFields.length > 0 && (
            <>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" disabled>
                  Cancelar
                </Button>
                <Button type="submit" disabled>
                  Enviar
                </Button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Información adicional */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total de campos:</span>
            <span className="font-medium">{sortedFields.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Campos requeridos:</span>
            <span className="font-medium">
              {sortedFields.filter((f) => f.required).length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estado:</span>
            <Badge variant={form.status === 'PUBLISHED' ? 'success' : 'secondary'}>
              {form.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )

  if (asSheet) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Vista previa del formulario</SheetTitle>
            <SheetDescription>
              Así es como verán el formulario los usuarios finales
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // Si no es Sheet, usar Dialog (aunque no está en los requisitos, lo dejamos como alternativa)
  return (
    <div>
      {trigger && (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      )}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Vista previa del formulario</h2>
              <p className="text-sm text-muted-foreground">
                Así es como verán el formulario los usuarios finales
              </p>
            </div>
            {content}
          </div>
        </div>
      )}
    </div>
  )
}

export default FormPreview

