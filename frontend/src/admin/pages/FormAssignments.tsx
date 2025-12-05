import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
  Plus,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  ClipboardList,
  FileText,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Repeat,
  Mail,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Calendar } from '@/shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Combobox } from '@/shared/components/ui/combobox'
import { MultiSelect } from '@/shared/components/ui/multi-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import ConfirmDialog from '@/shared/components/common/ConfirmDialog'
import useFormAssignments, {
  type CreateAssignmentInput,
  type AssignmentFrequency,
  type FormAssignmentWithDetails,
} from '@/shared/hooks/useFormAssignments'
import useForms from '@/shared/hooks/useForms'
import useUsers from '@/shared/hooks/useUsers'
import { cn } from '@/shared/lib/utils'
import PageLoader from '@/shared/components/common/PageLoader'

/**
 * Schema de validación para el formulario de asignación
 */
const assignmentSchema = z.object({
  formId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONCE', 'CUSTOM']),
  startDate: z.date({
    message: 'La fecha de inicio es obligatoria',
  }),
  endDate: z.date().optional(),
}).refine((data) => {
  // Si no hay formId ni userIds, asumimos que es edición (no validamos)
  if (!data.formId && (!data.userIds || data.userIds.length === 0)) {
    return true
  }
  // Si hay formId o userIds, validamos ambos (modo creación)
  return data.formId && data.userIds && data.userIds.length > 0
}, {
  message: 'Debes seleccionar un formulario y al menos un usuario',
  path: ['formId'],
})

type AssignmentFormValues = z.infer<typeof assignmentSchema>

/**
 * Etiquetas para las frecuencias
 */
const frequencyLabels: Record<AssignmentFrequency, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  ONCE: 'Una vez',
  CUSTOM: 'Libre disposición',
}

/**
 * Página de asignaciones de formularios
 * Permite crear y gestionar asignaciones de formularios a usuarios
 */
const FormAssignments = () => {
  const { assignments, loading, createAssignments, updateAssignment, deleteAssignment } = useFormAssignments()
  const { forms } = useForms()
  const { users } = useUsers()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<FormAssignmentWithDetails | null>(null)
  const [viewingAssignment, setViewingAssignment] = useState<FormAssignmentWithDetails | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      formId: '',
      userIds: [],
      frequency: 'ONCE',
      startDate: new Date(),
      endDate: undefined,
    },
  })

  /**
   * Opciones de formularios para el combobox
   */
  const formOptions = useMemo(
    () =>
      forms
        .filter((form) => form.status === 'PUBLISHED')
        .map((form) => ({
          value: form.id,
          label: form.title,
        })),
    [forms],
  )

  /**
   * Opciones de usuarios para el multiselect
   */
  const userOptions = useMemo(
    () =>
      users
        .filter((user) => user.status === 'ACTIVE')
        .map((user) => ({
          value: user.id,
          label: `${user.name} (${user.email})`,
        })),
    [users],
  )

  /**
   * Maneja el envío del formulario (crear o editar)
   */
  const onSubmit = async (data: AssignmentFormValues) => {
    try {
      if (editingAssignment) {
        // Editar asignación existente
        await updateAssignment(editingAssignment.id, {
          frequency: data.frequency,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate?.toISOString(),
        })
        setEditingAssignment(null)
      } else {
        // Crear nueva asignación - validar que formId y userIds estén presentes
        if (!data.formId || !data.userIds || data.userIds.length === 0) {
          return
        }
        const payload: CreateAssignmentInput = {
          formId: data.formId,
          userIds: data.userIds,
          frequency: data.frequency,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate?.toISOString(),
        }
        await createAssignments(payload)
      }
      form.reset()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error al guardar asignación:', error)
    }
  }

  /**
   * Abre el diálogo para editar una asignación
   */
  const handleEdit = (assignment: FormAssignmentWithDetails) => {
    setEditingAssignment(assignment)
    form.reset({
      formId: assignment.formId,
      userIds: [assignment.userId],
      frequency: assignment.frequency,
      startDate: new Date(assignment.startDate),
      endDate: assignment.endDate ? new Date(assignment.endDate) : undefined,
    })
    setIsDialogOpen(true)
  }

  /**
   * Abre el sheet para ver detalles de una asignación
   */
  const handleViewDetails = (assignment: FormAssignmentWithDetails) => {
    setViewingAssignment(assignment)
  }

  /**
   * Cierra el diálogo y resetea el estado de edición
   */
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingAssignment(null)
    form.reset()
  }

  /**
   * Maneja la eliminación de una asignación
   */
  const handleDelete = async () => {
    if (!confirmDelete) return

    try {
      await deleteAssignment(confirmDelete)
      setConfirmDelete(null)
    } catch (error) {
      console.error('Error al eliminar asignación:', error)
    }
  }

  /**
   * Formatea una fecha para mostrar
   */
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy')
    } catch {
      return dateString
    }
  }

  /**
   * Obtiene el nombre del formulario
   */
  const getFormTitle = (formId: string): string => {
    const form = forms.find((f) => f.id === formId)
    return form?.title || 'Formulario desconocido'
  }

  /**
   * Obtiene el nombre del usuario
   */
  const getUserName = (userId: string): string => {
    const user = users.find((u) => u.id === userId)
    return user?.name || 'Usuario desconocido'
  }

  // Mostrar loader inicial si está cargando y no hay asignaciones
  if (loading && assignments.length === 0) {
    return (
      <div className="flex h-full flex-col space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Asignaciones de Formularios</h1>
            <p className="text-sm text-muted-foreground">
              Asigna formularios a usuarios con diferentes frecuencias
            </p>
          </div>
        </div>
        <PageLoader
          message="Cargando asignaciones..."
          icon={<ClipboardList className="h-12 w-12 text-primary" />}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asignaciones de Formularios</h1>
          <p className="text-sm text-muted-foreground">
            Asigna formularios a usuarios con diferentes frecuencias
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Asignación
        </Button>
      </div>

      {/* Tabla de asignaciones */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No hay asignaciones</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Comienza creando tu primera asignación de formulario.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Asignación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Asignaciones Existentes</CardTitle>
            <CardDescription>
              Lista de todas las asignaciones de formularios a usuarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Formulario</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.formTitle || getFormTitle(assignment.formId)}
                      </TableCell>
                      <TableCell>
                        {assignment.userName || getUserName(assignment.userId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{frequencyLabels[assignment.frequency]}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(assignment.startDate)}</TableCell>
                      <TableCell>
                        {assignment.endDate ? formatDate(assignment.endDate) : 'Sin límite'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.isCompleted ? 'success' : 'warning'}>
                          {assignment.isCompleted ? 'Completado' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Opciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(assignment)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(assignment)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setConfirmDelete(assignment.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo para crear/editar asignación */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? 'Editar Asignación' : 'Crear Asignación'}</DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? 'Modifica los detalles de la asignación'
                : 'Asigna un formulario a uno o más usuarios con una frecuencia específica'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Selección de formulario (solo al crear) */}
            {!editingAssignment && (
              <div className="space-y-2">
                <Label htmlFor="form">Formulario *</Label>
                <Combobox
                  options={formOptions}
                  value={form.watch('formId')}
                  onValueChange={(value) => form.setValue('formId', value)}
                  placeholder="Selecciona un formulario..."
                  searchPlaceholder="Buscar formulario..."
                  emptyText="No se encontraron formularios publicados."
                />
                {form.formState.errors.formId && (
                  <p className="text-xs text-destructive">{form.formState.errors.formId.message}</p>
                )}
              </div>
            )}

            {/* Selección de usuarios (solo al crear) */}
            {!editingAssignment && (
              <div className="space-y-2">
                <Label htmlFor="users">Usuarios *</Label>
                <MultiSelect
                  options={userOptions}
                  selected={form.watch('userIds')}
                  onSelectionChange={(selected) => form.setValue('userIds', selected)}
                  placeholder="Selecciona uno o más usuarios..."
                  searchPlaceholder="Buscar usuarios..."
                  emptyText="No se encontraron usuarios activos."
                />
                {form.formState.errors.userIds && (
                  <p className="text-xs text-destructive">{form.formState.errors.userIds.message}</p>
                )}
              </div>
            )}

            {/* Información de formulario y usuario (solo al editar) */}
            {editingAssignment && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm text-muted-foreground">Formulario</Label>
                  <p className="font-medium">{getFormTitle(editingAssignment.formId)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Usuario</Label>
                  <p className="font-medium">{getUserName(editingAssignment.userId)}</p>
                </div>
              </div>
            )}

            {/* Frecuencia */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Frecuencia *</Label>
              <Select
                value={form.watch('frequency')}
                onValueChange={(value: AssignmentFrequency) => form.setValue('frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Diario</SelectItem>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                  <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                  <SelectItem value="MONTHLY">Mensual</SelectItem>
                  <SelectItem value="ONCE">Una vez</SelectItem>
                  <SelectItem value="CUSTOM">Libre disposición</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.frequency && (
                <p className="text-xs text-destructive">{form.formState.errors.frequency.message}</p>
              )}
            </div>

            {/* Fecha de inicio */}
            <div className="space-y-2">
              <Label>Fecha de Inicio *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('startDate') && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('startDate') ? (
                      format(form.watch('startDate'), 'PPP')
                    ) : (
                      <span>Selecciona una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('startDate')}
                    onSelect={(date) => {
                      if (date) {
                        form.setValue('startDate', date)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.startDate && (
                <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            {/* Fecha de fin (opcional) */}
            <div className="space-y-2">
              <Label>Fecha de Fin (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('endDate') && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('endDate') ? (
                      format(form.watch('endDate') as Date, 'PPP')
                    ) : (
                      <span>Selecciona una fecha (opcional)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('endDate')}
                    onSelect={(date) => {
                      form.setValue('endDate', date)
                    }}
                    disabled={(date) => {
                      const startDate = form.watch('startDate')
                      return startDate ? date < startDate : false
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.endDate && (
                <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? editingAssignment
                    ? 'Guardando...'
                    : 'Creando...'
                  : editingAssignment
                    ? 'Guardar Cambios'
                    : 'Crear Asignación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Asignación"
        description="¿Estás seguro de que deseas eliminar esta asignación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />

      {/* Sheet para ver detalles de la asignación */}
      <Sheet open={Boolean(viewingAssignment)} onOpenChange={(open) => !open && setViewingAssignment(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {viewingAssignment && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <ClipboardList className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Detalles de la Asignación
                    </SheetTitle>
                    <SheetDescription className="text-base mt-1">
                      Información completa de la asignación de formulario
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* Información del formulario - Card mejorado */}
                <Card className="border-2 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      Formulario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-lg font-semibold text-slate-900">
                      {getFormTitle(viewingAssignment.formId)}
                    </p>
                  </CardContent>
                </Card>

                {/* Información del usuario - Card mejorado */}
                <Card className="border-2 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-emerald-500 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      Usuario Asignado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      <p className="text-lg font-semibold text-slate-900">
                        {getUserName(viewingAssignment.userId)}
                      </p>
                    </div>
                    {users.find((u) => u.id === viewingAssignment.userId)?.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4" />
                        <p className="text-sm">
                          {users.find((u) => u.id === viewingAssignment.userId)?.email}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Grid de información: Frecuencia y Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Frecuencia - Card mejorado */}
                  <Card className="border-2 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-purple-500 rounded-lg">
                          <Repeat className="h-4 w-4 text-white" />
                        </div>
                        Frecuencia
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Badge
                        variant="outline"
                        className="text-base px-4 py-2 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                      >
                        <Repeat className="h-3 w-3 mr-2" />
                        {frequencyLabels[viewingAssignment.frequency]}
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Estado - Card mejorado */}
                  <Card className="border-2 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className={`p-1.5 rounded-lg ${viewingAssignment.isCompleted ? 'bg-green-500' : 'bg-amber-500'}`}>
                          {viewingAssignment.isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          ) : (
                            <Clock className="h-4 w-4 text-white" />
                          )}
                        </div>
                        Estado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Badge
                        variant={viewingAssignment.isCompleted ? 'success' : 'warning'}
                        className="text-base px-4 py-2"
                      >
                        {viewingAssignment.isCompleted ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-2" />
                            Completado
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-2" />
                            Pendiente
                          </>
                        )}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Fechas - Card mejorado */}
                <Card className="border-2 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-cyan-500 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-white" />
                      </div>
                      Fechas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <CalendarIcon className="h-5 w-5 text-cyan-600 mt-0.5" />
                      <div className="flex-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Fecha de inicio
                        </Label>
                        <p className="text-base font-semibold text-slate-900 mt-1">
                          {formatDate(viewingAssignment.startDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <CalendarIcon className="h-5 w-5 text-cyan-600 mt-0.5" />
                      <div className="flex-1">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Fecha de fin
                        </Label>
                        <p className="text-base font-semibold text-slate-900 mt-1">
                          {viewingAssignment.endDate ? (
                            formatDate(viewingAssignment.endDate)
                          ) : (
                            <span className="text-slate-400 italic">Sin límite</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Acciones - Botones mejorados */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="default"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                    onClick={() => {
                      setViewingAssignment(null)
                      handleEdit(viewingAssignment)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Asignación
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-2 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all"
                    onClick={() => {
                      const formId = viewingAssignment.formId
                      setViewingAssignment(null)
                      // Navegar a ver respuestas del formulario
                      window.location.href = `/admin/formularios/${formId}/respuestas?userId=${viewingAssignment.userId}`
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Respuestas
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default FormAssignments

