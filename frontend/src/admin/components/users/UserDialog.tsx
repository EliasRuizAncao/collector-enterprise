import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Switch } from '@/shared/components/ui/switch'

export type UserRole = 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR'
export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface UserDialogFormValues {
  name: string
  email: string
  role: UserRole
  password?: string
  status: UserStatus
}

export interface UserDialogProps {
  open: boolean
  onClose: () => void
  user?: UserDialogFormValues
  onSave: (data: UserDialogFormValues) => Promise<void> | void
}

const userSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo inválido'),
  role: z.enum(['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR']),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

const UserDialog = ({ open, onClose, user, onSave }: UserDialogProps) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<UserDialogFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'OPERATOR',
      password: '',
      status: 'ACTIVE',
    },
  })

  // Restablece el formulario cuando cambie el usuario o se abra/cierre el dialog
  useEffect(() => {
    if (user) {
      reset({
        ...user,
        password: '',
      })
    } else {
      reset({
        name: '',
        email: '',
        role: 'OPERATOR',
        password: '',
        status: 'ACTIVE',
      })
    }
  }, [reset, user, open])

  const isEditMode = Boolean(user)

  const onSubmit = async (values: UserDialogFormValues) => {
    const payload = { ...values }

    // En modo edición, omitir password si está vacío
    if (isEditMode && !values.password) {
      delete payload.password
    }

    await Promise.resolve(onSave(payload))
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => (!isOpen ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza los datos del colaborador y ajusta su acceso al panel administrativo.'
              : 'Completa los datos básicos del colaborador. Podrás asignar más permisos luego.'}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 py-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <Label htmlFor="user-name">Nombre completo</Label>
            <Input id="user-name" placeholder="Ej: Carla Alarcón" {...register('name')} />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-email">Correo electrónico</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="usuario@amaranto.cl"
              {...register('email')}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Rol</Label>
            <Select
              value={watch('role')}
              onValueChange={(value: UserRole) => {
                setValue('role', value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                <SelectItem value="OPERATOR">Operador</SelectItem>
              </SelectContent>
            </Select>
            {errors.role ? (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-password">Contraseña</Label>
            <Input
              id="user-password"
              type="password"
              placeholder={isEditMode ? 'Dejar en blanco para mantener' : 'Mínimo 6 caracteres'}
              {...register('password', {
                required: !isEditMode ? 'La contraseña es obligatoria' : false,
              })}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <div>
              <Label>Estado</Label>
              <p className="text-xs text-muted-foreground">
                Define si el usuario puede acceder al panel administrativo.
              </p>
            </div>
            <Switch
              checked={watch('status') === 'ACTIVE'}
              onCheckedChange={(checked: boolean) => setValue('status', checked ? 'ACTIVE' : 'INACTIVE')}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default UserDialog


