import { useState } from 'react'
import {
  X,
  Smartphone,
  Monitor,
  PenTool,
  Upload,
  Camera,
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
  Maximize2,
  Minimize2,
  Eye,
  Info,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
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
import { Card, CardContent } from '@/shared/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
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

/**
 * Labels descriptivos para los tipos de campo
 */
const fieldTypeLabels: Record<FieldType, string> = {
  [FieldType.TEXT]: 'Texto corto',
  [FieldType.TEXTAREA]: 'Texto largo',
  [FieldType.NUMBER]: 'Número',
  [FieldType.EMAIL]: 'Correo electrónico',
  [FieldType.PHONE]: 'Teléfono',
  [FieldType.URL]: 'URL',
  [FieldType.DATE]: 'Fecha',
  [FieldType.TIME]: 'Hora',
  [FieldType.DATETIME]: 'Fecha y hora',
  [FieldType.SELECT]: 'Selección única',
  [FieldType.MULTISELECT]: 'Selección múltiple',
  [FieldType.RADIO]: 'Botones de radio',
  [FieldType.CHECKBOX]: 'Casilla de verificación',
  [FieldType.SIGNATURE]: 'Firma digital',
  [FieldType.FILE]: 'Archivo',
  [FieldType.PHOTO]: 'Foto',
}

/**
 * Renderiza un campo individual en la vista previa
 */
const PreviewField = ({ field, viewMode }: { field: Field; viewMode: 'desktop' | 'mobile' }) => {
  const FieldIcon = fieldIcons[field.type]

  return (
    <Card className="group relative border-l-4 border-l-primary/20 transition-all duration-200 hover:border-l-primary/60 hover:shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header del campo con icono y tipo */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 shrink-0">
                <FieldIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor={`preview-${field.id}`} className="text-sm font-semibold leading-tight">
                    {field.label}
                  </Label>
                  {field.required && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs font-medium">
                      Requerido
                    </Badge>
                  )}
                  <Badge variant="outline" className="h-5 px-1.5 text-xs font-medium text-muted-foreground">
                    {fieldTypeLabels[field.type]}
                  </Badge>
                  {field.disabled && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      Deshabilitado
                    </Badge>
                  )}
                  {field.hidden && (
                    <Badge variant="outline" className="h-5 px-1.5 text-xs border-amber-300 text-amber-700 dark:text-amber-400">
                      Oculto
                    </Badge>
                  )}
                </div>
                {field.helperText && (
                  <div className="flex items-start gap-2 pt-1">
                    <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed pr-2">{field.helperText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campo según su tipo */}
          <div className="mt-4">
            {renderFieldInput(field, viewMode)}
          </div>

          {/* Validaciones visibles */}
          {field.validations && renderValidations(field)}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Renderiza el input según el tipo de campo
 */
const renderFieldInput = (field: Field, viewMode: 'desktop' | 'mobile') => {
  const baseProps = {
    id: `preview-${field.id}`,
    disabled: field.disabled,
    placeholder: field.placeholder || `Ingresa ${field.label.toLowerCase()}...`,
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
          className="h-10"
        />
      )

    case FieldType.TEXTAREA:
      return (
        <Textarea
          {...baseProps}
          rows={field.rows || 4}
          maxLength={field.validations?.maxLength}
          minLength={field.validations?.minLength}
          className="resize-none"
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
          className="h-10"
        />
      )

    case FieldType.DATE:
      return (
        <Input
          {...baseProps}
          type="date"
          min={field.validations?.minDate}
          max={field.validations?.maxDate}
          className="h-10"
        />
      )

    case FieldType.TIME:
      return <Input {...baseProps} type="time" className="h-10" />

    case FieldType.DATETIME:
      return (
        <Input
          {...baseProps}
          type="datetime-local"
          min={field.validations?.minDate}
          max={field.validations?.maxDate}
          className="h-10"
        />
      )

    case FieldType.SELECT:
      return (
        <Select disabled={field.disabled}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Selecciona una opción..." />
          </SelectTrigger>
          <SelectContent>
            {'options' in field && field.options
              ? field.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </SelectItem>
                ))
              : (
                  <SelectItem value="no-options" disabled>
                    No hay opciones disponibles
                  </SelectItem>
                )}
          </SelectContent>
        </Select>
      )

    case FieldType.MULTISELECT:
      return (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="space-y-3">
              {'options' in field && field.options && field.options.length > 0
                ? field.options.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        disabled={field.disabled || opt.disabled}
                        className="shrink-0"
                      />
                      <span className="text-sm flex-1">{opt.label}</span>
                    </label>
                  ))
                : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No hay opciones disponibles
                    </p>
                  )}
            </div>
          </CardContent>
        </Card>
      )

    case FieldType.RADIO:
      return (
        <RadioGroup disabled={field.disabled} defaultValue={undefined}>
          <div className="space-y-3">
            {'options' in field && field.options && field.options.length > 0
              ? field.options.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <RadioGroupItem value={opt.value} disabled={opt.disabled} id={`${field.id}-${opt.value}`} />
                    <span className="text-sm flex-1" htmlFor={`${field.id}-${opt.value}`}>
                      {opt.label}
                    </span>
                  </label>
                ))
              : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No hay opciones disponibles
                  </p>
                )}
          </div>
        </RadioGroup>
      )

    case FieldType.CHECKBOX:
      if ('options' in field && field.options && field.options.length > 0) {
        // Grupo de checkboxes
        return (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="space-y-3">
                {field.options.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      disabled={field.disabled || opt.disabled}
                      className="shrink-0"
                    />
                    <span className="text-sm flex-1">{opt.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      }
      // Casilla única
      return (
        <label className="flex items-center gap-3 p-3 rounded-md border border-dashed hover:bg-muted/30 cursor-pointer transition-colors">
          <Checkbox disabled={field.disabled} className="shrink-0" />
          <span className="text-sm">
            {'checkboxLabel' in field && field.checkboxLabel
              ? field.checkboxLabel
              : 'Casilla de verificación'}
          </span>
        </label>
      )

    case FieldType.SIGNATURE:
      return (
        <Card className="border-2 border-dashed bg-gradient-to-br from-muted/50 to-muted/20">
          <CardContent className="p-8">
            <div
              className="flex flex-col items-center justify-center space-y-3"
              style={{
                minHeight: 'height' in field && field.height ? `${field.height}px` : '150px',
              }}
            >
              <div className="rounded-full bg-primary/10 p-4">
                <PenTool className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Área de firma digital</p>
                <p className="text-xs text-muted-foreground">
                  Los usuarios podrán firmar aquí
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )

    case FieldType.FILE:
      return (
        <Card className="border-2 border-dashed bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              <div className="rounded-full bg-blue-500/10 p-4">
                <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {'multiple' in field && field.multiple
                    ? 'Arrastra archivos aquí o haz clic para seleccionar'
                    : 'Arrastra un archivo aquí o haz clic para seleccionar'}
                </p>
                {field.validations?.acceptedFileTypes && (
                  <p className="text-xs text-muted-foreground">
                    Tipos permitidos: {field.validations.acceptedFileTypes.join(', ')}
                  </p>
                )}
                {field.validations?.maxFileSize && (
                  <p className="text-xs text-muted-foreground">
                    Tamaño máximo: {field.validations.maxFileSize} MB
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )

    case FieldType.PHOTO:
      return (
        <Card className="border-2 border-dashed bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              <div className="rounded-full bg-purple-500/10 p-4">
                <Camera className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {'multiple' in field && field.multiple
                    ? 'Arrastra fotos aquí o haz clic para seleccionar'
                    : 'Arrastra una foto aquí o haz clic para seleccionar'}
                </p>
                {('allowCamera' in field && field.allowCamera) && (
                  <p className="text-xs text-primary font-medium">
                    ✓ Permite tomar foto desde la cámara
                  </p>
                )}
                {field.validations?.acceptedFileTypes && (
                  <p className="text-xs text-muted-foreground">
                    Tipos permitidos: {field.validations.acceptedFileTypes.join(', ')}
                  </p>
                )}
                {field.validations?.maxFileSize && (
                  <p className="text-xs text-muted-foreground">
                    Tamaño máximo: {field.validations.maxFileSize} MB
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )

    default:
      return (
        <Card className="border-dashed">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Tipo de campo no soportado: {(field as Field).type}
            </p>
          </CardContent>
        </Card>
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
    messages.push(`Valor mínimo: ${validations.min}`)
  }
  if (validations.max !== undefined) {
    messages.push(`Valor máximo: ${validations.max}`)
  }
  if (validations.step !== undefined) {
    messages.push(`Incremento: ${validations.step}`)
  }
  if (validations.minDate) {
    messages.push(`Fecha mínima: ${new Date(validations.minDate).toLocaleDateString()}`)
  }
  if (validations.maxDate) {
    messages.push(`Fecha máxima: ${new Date(validations.maxDate).toLocaleDateString()}`)
  }
  if (validations.minSelections !== undefined) {
    messages.push(`Mínimo ${validations.minSelections} selección(es)`)
  }
  if (validations.maxSelections !== undefined) {
    messages.push(`Máximo ${validations.maxSelections} selección(es)`)
  }
  if (validations.pattern) {
    messages.push(`Patrón: ${validations.pattern}`)
  }

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="mt-4 rounded-md bg-muted/50 p-4 space-y-2">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">Validaciones:</p>
      {messages.map((msg, index) => (
        <div key={index} className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{msg}</span>
        </div>
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
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Usar estado controlado o interno
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  // Campos visibles (excluir ocultos)
  const visibleFields = form.fields.filter((field) => !field.hidden)

  // Campos ordenados
  const sortedFields = [...visibleFields].sort((a, b) => a.order - b.order)

  const content = (
    <div className="space-y-6 px-1">
      {/* Header del formulario con gradiente */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-6 sm:p-8">
        <div className="relative space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2 min-w-0 pr-2">
              <h2 className="text-2xl font-bold text-foreground leading-tight">{form.title}</h2>
              {form.description && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {form.description}
                </p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0">
              v{form.version}
            </Badge>
          </div>
        </div>
      </div>

      {/* Selector de vista y controles */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">Vista previa</p>
          <Badge variant="secondary" className="text-xs">
            {sortedFields.length} campo{sortedFields.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
            <Button
              variant={viewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('desktop')}
              className="h-8 gap-2"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('mobile')}
              className="h-8 gap-2"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Formulario preview con contenedor estilizado */}
      <div
        className={cn(
          'mx-auto rounded-xl border-2 border-border bg-background shadow-lg transition-all duration-300',
          viewMode === 'mobile'
            ? 'max-w-sm p-5 sm:p-6'
            : 'max-w-3xl p-6 sm:p-8 lg:p-10',
          'bg-gradient-to-br from-background via-background to-muted/20',
        )}
      >
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {sortedFields.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  No hay campos visibles
                </p>
                <p className="text-xs text-muted-foreground">
                  Este formulario no tiene campos para mostrar
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedFields.map((field, index) => (
              <div key={field.id} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 50}ms` }}>
                <PreviewField field={field} viewMode={viewMode} />
              </div>
            ))
          )}

          {/* Botón de envío estilizado */}
          {sortedFields.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" disabled className="min-w-[100px]">
                  Cancelar
                </Button>
                <Button type="submit" disabled className="min-w-[100px] bg-gradient-to-r from-primary to-primary/90">
                  Enviar
                </Button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Información adicional mejorada */}
      <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-primary/10">
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total de campos</p>
              <p className="text-2xl font-bold text-foreground">{sortedFields.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Campos requeridos</p>
              <p className="text-2xl font-bold text-foreground">
                {sortedFields.filter((f) => f.required).length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Estado</p>
              <Badge
                variant={
                  form.status === 'PUBLISHED'
                    ? 'default'
                    : form.status === 'DRAFT'
                      ? 'secondary'
                      : 'outline'
                }
                className="text-sm"
              >
                {form.status === 'PUBLISHED'
                  ? 'Publicado'
                  : form.status === 'DRAFT'
                    ? 'Borrador'
                    : 'Archivado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (asSheet) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="px-1">
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vista previa del formulario
            </SheetTitle>
            <SheetDescription>
              Así es como verán el formulario los usuarios finales
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 pr-2">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // Dialog fullscreen
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <div onClick={() => setIsOpen(true)}>{trigger}</div>}
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 sm:px-8 py-5">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1 pr-2">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Eye className="h-5 w-5 shrink-0" />
                  Vista previa del formulario
                </DialogTitle>
                <DialogDescription className="mt-1.5">
                  Así es como verán el formulario los usuarios finales
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>
        <div className="p-6 sm:p-8 lg:p-10">{content}</div>
      </DialogContent>
    </Dialog>
  )
}

export default FormPreview
