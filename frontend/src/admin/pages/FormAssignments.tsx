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
import ConfirmDialog from '@/shared/components/common/ConfirmDialog'
import LoadingOverlay from '@/shared/components/common/LoadingOverlay'
import useFormAssignments, {
  type CreateAssignmentInput,
  type AssignmentFrequency,
} from '@/shared/hooks/useFormAssignments'
import useForms from '@/shared/hooks/useForms'
import useUsers from '@/shared/hooks/useUsers'
import { cn } from '@/shared/lib/utils'

/**
 * Schema de validación para el formulario de asignación
 */
const assignmentSchema = z.object({
  formId: z.string().min(1, 'Debes seleccionar un formulario'),
  userIds: z.array(z.string()).min(1, 'Debes seleccionar al menos un usuario'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONCE', 'CUSTOM']),
  startDate: z.date({
    message: 'La fecha de inicio es obligatoria',
  }),
  endDate: z.date().optional(),
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
  const { assignments, loading, createAssignments, deleteAssignment } = useFormAssignments()
  const { forms } = useForms()
  const { users } = useUsers()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
   * Maneja el envío del formulario
   */
  const onSubmit = async (data: AssignmentFormValues) => {
    try {
      const payload: CreateAssignmentInput = {
        formId: data.formId,
        userIds: data.userIds,
        frequency: data.frequency,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
      }

      await createAssignments(payload)
      form.reset()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error al crear asignaciones:', error)
    }
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
      {/* Mostrar mensaje vacío solo si no hay asignaciones y no está cargando */}
      {!loading && assignments.length === 0 ? (
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
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

      {/* Diálogo para crear asignación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Asignación</DialogTitle>
            <DialogDescription>
              Asigna un formulario a uno o más usuarios con una frecuencia específica
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Selección de formulario */}
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

            {/* Selección de usuarios */}
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
                onClick={() => {
                  setIsDialogOpen(false)
                  form.reset()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creando...' : 'Crear Asignación'}
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

      {/* Loading Overlay */}
      <LoadingOverlay
        isLoading={loading}
        message="Cargando asignaciones..."
        icon={<CalendarIcon className="h-8 w-8 text-primary" />}
      />
    </div>
  )
}

export default FormAssignments

