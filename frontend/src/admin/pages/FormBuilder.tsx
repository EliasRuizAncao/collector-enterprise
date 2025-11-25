import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import {
  Save,
  Eye,
  Send,
  ArrowLeft,
  GripVertical,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card } from '@/shared/components/ui/card'
import { useToast } from '@/shared/components/ui/use-toast'
import {
  FieldType,
  type Field,
  type Form,
  FormStatus,
  generateFieldId,
  sortFieldsByOrder,
} from '@/shared/types/formBuilder'
import { getFieldTypeLabel } from '@/shared/lib/formBuilderUtils'
import FieldPalette from '@/admin/components/form-builder/FieldPalette'
import FormCanvas from '@/admin/components/form-builder/FormCanvas'
import FieldPropertiesPanel from '@/admin/components/form-builder/FieldPropertiesPanel'
import FormPreview from '@/admin/components/form-builder/FormPreview'
import useFormBuilder from '@/shared/hooks/useFormBuilder'

/**
 * IDs constantes para las zonas de drop
 * Deben coincidir con los IDs usados en los componentes hijos
 */
const DROP_ZONE_IDS = {
  CANVAS: 'canvas-drop-zone', // Coincide con FormCanvas DropZone
  PALETTE: 'field-palette',
} as const

/**
 * Página principal del constructor de formularios
 * Permite crear y editar formularios dinámicos con drag & drop
 */
const FormBuilder = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Hook para gestionar formularios
  const {
    form: loadedForm,
    saving: isSaving,
    saveForm,
    publishForm: publishFormHook,
  } = useFormBuilder({
    formId: id,
    autoLoad: !!id,
  })

  // Estado del formulario (sincronizado con el hook)
  const [formTitle, setFormTitle] = useState('Nuevo Formulario')
  const [formDescription, setFormDescription] = useState('')
  const [fields, setFields] = useState<Field[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [activeField, setActiveField] = useState<Field | null>(null)

  // Sincronizar estado local con el formulario cargado
  useEffect(() => {
    if (loadedForm) {
      setFormTitle(loadedForm.title)
      setFormDescription(loadedForm.description || '')
      setFields(loadedForm.fields || [])
    } else if (!id) {
      // Resetear para nuevo formulario
      setFormTitle('Nuevo Formulario')
      setFormDescription('')
      setFields([])
      setSelectedFieldId(null)
    }
  }, [loadedForm, id])

  // Sensores para drag & drop (mouse, touch y teclado)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere 8px de movimiento para activar el drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Delay de 200ms para evitar conflictos con scroll
        tolerance: 8, // Tolerancia de 8px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Campo seleccionado actualmente
  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedFieldId) || null,
    [fields, selectedFieldId],
  )

  // Campos ordenados por su propiedad `order`
  const sortedFields = useMemo(() => sortFieldsByOrder(fields), [fields])

  /**
   * Verifica si un ID pertenece a un tipo de campo de la paleta
   */
  const isFieldTypeId = (id: string | number): boolean => {
    return typeof id === 'string' && id.startsWith('field-type-')
  }

  /**
   * Obtiene el tipo de campo desde un ID de paleta
   */
  const getFieldTypeFromId = (id: string | number): FieldType | null => {
    if (!isFieldTypeId(id)) {
      return null
    }
    const typeString = String(id).replace('field-type-', '')
    return Object.values(FieldType).includes(typeString as FieldType)
      ? (typeString as FieldType)
      : null
  }

  /**
   * Maneja el inicio del drag
   * Guarda información del campo que se está arrastrando para el overlay
   */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      setActiveFieldId(active.id as string)

      // Si es un campo existente del canvas, guardar su información
      if (!isFieldTypeId(active.id)) {
        const field = fields.find((f) => f.id === active.id)
        if (field) {
          setActiveField(field)
        }
      } else {
        // Si es un tipo de campo de la paleta, crear un campo temporal para el overlay
        const fieldType = getFieldTypeFromId(active.id)
        if (fieldType) {
          const tempField = createDefaultField(fieldType, 0)
          setActiveField(tempField)
        }
      }
    },
    [fields],
  )

  /**
   * Maneja el movimiento durante el drag (opcional, para feedback visual)
   */
  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Aquí se puede agregar lógica para feedback visual durante el drag
    // Por ejemplo, resaltar la zona de drop
  }, [])

  /**
   * Maneja el fin del drag
   * Detecta si viene de la paleta (nuevo campo) o del canvas (reordenar)
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      // Limpiar estado del drag
      setActiveFieldId(null)
      setActiveField(null)

      // Si no hay zona de drop, cancelar
      if (!over) {
        return
      }

      const activeId = active.id as string
      const overId = over.id as string

      // Caso 1: Arrastrar desde la paleta (crear nuevo campo)
      if (isFieldTypeId(activeId)) {
        const fieldType = getFieldTypeFromId(activeId)
        if (!fieldType) {
          return
        }

        // Verificar que se soltó en el canvas o en la zona de drop
        const isDroppedOnCanvas =
          overId === DROP_ZONE_IDS.CANVAS ||
          fields.some((f) => f.id === overId) ||
          overId.startsWith('field-')

        if (isDroppedOnCanvas) {
          // Crear nuevo campo
          const newField: Field = createDefaultField(fieldType, fields.length)
          setFields((prev) => {
            const updated = [...prev, newField]
            // Reordenar para asegurar orden correcto
            return updated.map((field, index) => ({
              ...field,
              order: index,
            }))
          })
          setSelectedFieldId(newField.id)

          toast({
            title: 'Campo agregado',
            description: `Se agregó un campo de tipo ${getFieldTypeLabel(fieldType)}`,
          })
        }
        return
      }

      // Caso 2: Reordenar campos existentes en el canvas
      if (!isFieldTypeId(activeId)) {
        const activeIndex = sortedFields.findIndex((f) => f.id === activeId)
        const overIndex = sortedFields.findIndex((f) => f.id === overId)

        // Si se soltó en la zona de drop vacía, mover al final
        if (overId === DROP_ZONE_IDS.CANVAS) {
          if (activeIndex !== -1) {
            const reorderedFields = arrayMove(sortedFields, activeIndex, sortedFields.length - 1)
            const updatedFields = reorderedFields.map((field, index) => ({
              ...field,
              order: index,
            }))
            setFields(updatedFields)
          }
          return
        }

        // Si se soltó sobre otro campo, reordenar
        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          const reorderedFields = arrayMove(sortedFields, activeIndex, overIndex)
          const updatedFields = reorderedFields.map((field, index) => ({
            ...field,
            order: index,
          }))
          setFields(updatedFields)

          toast({
            title: 'Campo reordenado',
            description: 'El campo fue movido a su nueva posición',
          })
        }
      }
    },
    [sortedFields, fields, toast],
  )

  /**
   * Crea un campo por defecto según su tipo
   */
  const createDefaultField = useCallback((type: FieldType, order: number): Field => {
    const baseField = {
      id: generateFieldId(),
      type,
      label: `Campo ${getFieldTypeLabel(type)}`,
      required: false,
      order,
    }

    switch (type) {
      case FieldType.TEXT:
        return {
          ...baseField,
          type: FieldType.TEXT,
          placeholder: 'Ingrese texto...',
        } as Field

      case FieldType.TEXTAREA:
        return {
          ...baseField,
          type: FieldType.TEXTAREA,
          placeholder: 'Ingrese texto largo...',
          rows: 4,
        } as Field

      case FieldType.NUMBER:
        return {
          ...baseField,
          type: FieldType.NUMBER,
          placeholder: '0',
        } as Field

      case FieldType.EMAIL:
        return {
          ...baseField,
          type: FieldType.EMAIL,
          placeholder: 'ejemplo@correo.com',
        } as Field

      case FieldType.PHONE:
        return {
          ...baseField,
          type: FieldType.PHONE,
          placeholder: '+56 9 1234 5678',
        } as Field

      case FieldType.URL:
        return {
          ...baseField,
          type: FieldType.URL,
          placeholder: 'https://ejemplo.com',
        } as Field

      case FieldType.DATE:
        return {
          ...baseField,
          type: FieldType.DATE,
        } as Field

      case FieldType.TIME:
        return {
          ...baseField,
          type: FieldType.TIME,
        } as Field

      case FieldType.DATETIME:
        return {
          ...baseField,
          type: FieldType.DATETIME,
        } as Field

      case FieldType.SELECT:
      case FieldType.RADIO:
        return {
          ...baseField,
          type,
          options: [
            { value: 'opcion1', label: 'Opción 1' },
            { value: 'opcion2', label: 'Opción 2' },
          ],
        } as Field

      case FieldType.MULTISELECT:
      case FieldType.CHECKBOX:
        return {
          ...baseField,
          type,
          options: [
            { value: 'opcion1', label: 'Opción 1' },
            { value: 'opcion2', label: 'Opción 2' },
          ],
        } as Field

      case FieldType.SIGNATURE:
        return {
          ...baseField,
          type: FieldType.SIGNATURE,
          width: 400,
          height: 200,
        } as Field

      case FieldType.FILE:
        return {
          ...baseField,
          type: FieldType.FILE,
          multiple: false,
        } as Field

      case FieldType.PHOTO:
        return {
          ...baseField,
          type: FieldType.PHOTO,
          multiple: false,
          allowCamera: true,
        } as Field

      default:
        return baseField as Field
    }
  }, [])

  /**
   * Actualiza un campo existente
   */
  const handleUpdateField = useCallback((updatedField: Field) => {
    setFields((prev) =>
      prev.map((field) => (field.id === updatedField.id ? updatedField : field)),
    )
  }, [])

  /**
   * Elimina un campo
   */
  const handleDeleteField = useCallback(
    (fieldId: string) => {
      setFields((prev) => {
        const filtered = prev.filter((f) => f.id !== fieldId)
        // Reordenar los campos restantes
        return filtered.map((field, index) => ({
          ...field,
          order: index,
        }))
      })

      if (selectedFieldId === fieldId) {
        setSelectedFieldId(null)
      }

      toast({
        title: 'Campo eliminado',
        description: 'El campo fue removido del formulario',
      })
    },
    [selectedFieldId, toast],
  )

  /**
   * Duplica un campo
   */
  const handleDuplicateField = useCallback(
    (fieldId: string) => {
      const fieldToDuplicate = fields.find((f) => f.id === fieldId)
      if (!fieldToDuplicate) {
        return
      }

      const duplicatedField: Field = {
        ...fieldToDuplicate,
        id: generateFieldId(),
        label: `${fieldToDuplicate.label} (copia)`,
        order: fields.length,
      }

      setFields((prev) => [...prev, duplicatedField])
      setSelectedFieldId(duplicatedField.id)

      toast({
        title: 'Campo duplicado',
        description: 'Se creó una copia del campo',
      })
    },
    [fields, toast],
  )

  /**
   * Guarda el formulario
   */
  const handleSave = useCallback(async () => {
    if (!formTitle.trim()) {
      toast({
        title: 'Error',
        description: 'El título del formulario es obligatorio',
        variant: 'destructive',
      })
      return null
    }

    try {
      const savedForm = await saveForm({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        fields: sortedFields,
      })

      // Si es un nuevo formulario, navegar a la URL de edición
      if (!id && savedForm) {
        navigate(`/admin/formularios/${savedForm.id}`, { replace: true })
      }
      return savedForm
    } catch (error) {
      console.error('Error al guardar formulario:', error)
      // El error ya se maneja en el hook con toast
      return null
    }
  }, [formTitle, formDescription, sortedFields, id, saveForm, navigate, toast])

  /**
   * Publica el formulario
   */
  const handlePublish = useCallback(async () => {
    if (sortedFields.length === 0) {
      toast({
        title: 'Formulario vacío',
        description: 'Agrega al menos un campo antes de publicar',
        variant: 'destructive',
      })
      return
    }

    // Primero guardar si hay cambios
    let formIdToPublish = id
    if (!id || !loadedForm) {
      // Guardar primero si es nuevo
      const savedForm = await handleSave()
      if (savedForm) {
        formIdToPublish = savedForm.id
      } else {
        return // Error al guardar
      }
    } else {
      // Guardar cambios si existen
      await handleSave()
      formIdToPublish = id
    }

    // Publicar el formulario
    if (formIdToPublish) {
      try {
        await publishFormHook(formIdToPublish)
        // Navegar a la lista después de publicar
        navigate('/admin/formularios')
      } catch (error) {
        console.error('Error al publicar formulario:', error)
        // El error ya se maneja en el hook con toast
      }
    }
  }, [sortedFields.length, id, loadedForm, formTitle, formDescription, sortedFields, saveForm, publishFormHook, navigate, toast])

  // Estado para controlar la vista previa
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  /**
   * Construye el objeto Form para la vista previa
   */
  const previewForm: Form = useMemo(
    () =>
      loadedForm
        ? {
            ...loadedForm,
            title: formTitle || loadedForm.title,
            description: formDescription || loadedForm.description,
            fields: sortedFields,
          }
        : {
            id: id || 'new',
            title: formTitle || 'Nuevo Formulario',
            description: formDescription || undefined,
            fields: sortedFields,
            version: 1,
            status: FormStatus.DRAFT,
            createdById: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
    [id, formTitle, formDescription, sortedFields, loadedForm],
  )

  /**
   * Renderiza el preview del campo en el drag overlay
   */
  const renderDragOverlay = () => {
    if (!activeFieldId || !activeField) {
      return null
    }

    return (
      <Card className="cursor-grabbing opacity-95 shadow-2xl ring-2 ring-primary/20">
        <div className="flex items-center gap-3 p-4">
          <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{activeField.label}</span>
              {activeField.required && (
                <span className="text-xs font-medium text-destructive">*</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {getFieldTypeLabel(activeField.type)}
            </span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border/70 bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/formularios')}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 space-y-1">
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Título del formulario"
              className="border-0 bg-transparent text-lg font-semibold shadow-none focus-visible:ring-0"
            />
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Descripción del formulario (opcional)"
              className="min-h-0 resize-none border-0 bg-transparent text-sm text-muted-foreground shadow-none focus-visible:ring-0"
              rows={1}
            />
          </div>

          <div className="flex shrink-0 gap-2">
            <FormPreview
              form={previewForm}
              open={isPreviewOpen}
              onOpenChange={setIsPreviewOpen}
              trigger={
                <Button variant="outline" disabled={isSaving}>
                  <Eye className="mr-2 h-4 w-4" />
                  Vista previa
                </Button>
              }
            />
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button onClick={handlePublish} disabled={isSaving}>
              <Send className="mr-2 h-4 w-4" />
              Publicar
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal - 3 columnas con DndContext */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar izquierdo - Paleta de campos */}
          <aside className="hidden w-64 border-r border-border/70 bg-muted/20 lg:block lg:overflow-y-auto">
            <FieldPalette />
          </aside>

          {/* Canvas central - Área de construcción */}
          <main className="flex-1 overflow-y-auto bg-background">
            <FormCanvas
              fields={sortedFields}
              selectedFieldId={selectedFieldId}
              onFieldSelect={(field) => setSelectedFieldId(field.id)}
              onDeleteField={handleDeleteField}
              onDuplicateField={handleDuplicateField}
            />
          </main>

          {/* Sidebar derecho - Panel de propiedades */}
          <aside className="hidden w-80 border-l border-border/70 bg-muted/20 lg:block lg:overflow-y-auto">
            <FieldPropertiesPanel
              field={selectedField}
              onFieldUpdate={handleUpdateField}
            />
          </aside>
        </div>

        {/* Overlay para el drag activo con preview del campo */}
        <DragOverlay dropAnimation={null}>
          {renderDragOverlay()}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default FormBuilder
