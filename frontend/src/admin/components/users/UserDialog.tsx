import { useEffect, useState } from 'react'
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
import { useRoles } from '@/shared/hooks/useRoles'

export type UserRole = string // Ahora es dinámico, puede ser cualquier rol de la BD
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

// Schema dinámico que se actualiza con los roles disponibles
const createUserSchema = (availableRoles: string[]) => z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo inválido'),
  role: z.string().min(1, 'Debe seleccionar un rol'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

const UserDialog = ({ open, onClose, user, onSave }: UserDialogProps) => {
  const { roles, loading: rolesLoading } = useRoles()
  const [availableRoles, setAvailableRoles] = useState<Array<{ id: string; name: string; displayName: string }>>([])

  // Obtener roles disponibles cuando se cargan
  useEffect(() => {
    if (roles && roles.length > 0) {
      setAvailableRoles(roles.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
      })))
    }
  }, [roles])

  // Encontrar el rol por defecto (OPERATOR o el primero disponible)
  const defaultRole = availableRoles.find(r => r.name === 'OPERATOR')?.name || 
                      availableRoles.find(r => r.name === 'ADMIN')?.name || 
                      availableRoles[0]?.name || 
                      ''

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<UserDialogFormValues>({
    resolver: zodResolver(createUserSchema(availableRoles.map(r => r.name))),
    defaultValues: {
      name: '',
      email: '',
      role: defaultRole,
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
        role: defaultRole,
        password: '',
        status: 'ACTIVE',
      })
    }
  }, [reset, user, open, defaultRole])

  const isEditMode = Boolean(user)

  const onSubmit = async (values: UserDialogFormValues) => {
    const payload: any = { ...values }

    // Convertir role (nombre) a roleId (UUID) para el backend
    if (values.role) {
      const selectedRole = availableRoles.find(r => r.name === values.role)
      if (selectedRole) {
        payload.roleId = selectedRole.id
        delete payload.role // El backend espera roleId, no role
      }
    }

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
              ? 'Actualiza los datos básicos del colaborador. Los permisos y accesos se gestionan desde Roles y Permisos.'
              : 'Completa los datos básicos del colaborador. Los permisos y accesos se gestionan desde Roles y Permisos.'}
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
            {rolesLoading ? (
              <div className="h-10 w-full rounded-md border border-input bg-muted animate-pulse" />
            ) : (
              <Select
                value={watch('role')}
                onValueChange={(value: string) => {
                  setValue('role', value)
                }}
                disabled={availableRoles.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={availableRoles.length === 0 ? "Cargando roles..." : "Selecciona un rol"} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
              <Label>Estado del Usuario</Label>
              <p className="text-xs text-muted-foreground">
                Activa o desactiva la cuenta del usuario. Los permisos y accesos se gestionan desde Roles y Permisos.
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


