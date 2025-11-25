import { useMemo, useState } from 'react'
import { Ban, Edit, MoreHorizontal, Search, UserPlus, Users } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import UserDialog, {
  type UserDialogFormValues,
  type UserRole,
  type UserStatus,
} from '@/admin/components/users/UserDialog'
import ConfirmDialog from '@/shared/components/common/ConfirmDialog'
import LoadingOverlay from '@/shared/components/common/LoadingOverlay'
import useUsers, { type UserSummary } from '@/shared/hooks/useUsers'

const USERS_PER_PAGE = 10

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operador',
}

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
}

const roleBadgeVariants: Record<UserRole, 'default' | 'secondary' | 'muted' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  ADMIN: 'default',
  MANAGER: 'secondary',
  SUPERVISOR: 'muted',
  OPERATOR: 'outline',
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)

const UsersPage = () => {
  const {
    users,
    loading,
  lastFilters,
  error,
    fetchUsers,
    createUser,
    updateUser,
    toggleUserStatus,
  } = useUsers()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null)

  const [confirmUser, setConfirmUser] = useState<UserSummary | null>(null)

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch)

      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [roleFilter, statusFilter, searchTerm, users])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (safeCurrentPage - 1) * USERS_PER_PAGE,
        safeCurrentPage * USERS_PER_PAGE,
      ),
    [filteredUsers, safeCurrentPage],
  )

  const handlePageChange = (direction: 'prev' | 'next') => {
    setCurrentPage((prev) => {
      if (direction === 'prev') {
        return Math.max(1, prev - 1)
      }
      return Math.min(totalPages, prev + 1)
    })
  }

  const handleOpenCreate = () => {
    setDialogMode('create')
    setEditingUser(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: UserSummary) => {
    setDialogMode('edit')
    setEditingUser(user)
    setDialogOpen(true)
  }

  const handleSaveUser = async (values: UserDialogFormValues) => {
    if (dialogMode === 'edit' && editingUser) {
      await updateUser(editingUser.id, values)
    } else {
      await createUser(values)
    }

    await fetchUsers(lastFilters)
    setDialogOpen(false)
    setEditingUser(null)
  }

  const handleConfirmToggle = async () => {
    if (!confirmUser) {
      return
    }

    try {
      await toggleUserStatus(confirmUser.id)
      await fetchUsers(lastFilters)
      setConfirmUser(null)
    } catch (error_) {
      // El toast ya se maneja en el hook; dejamos el dialogo abierto
      console.error('toggle status error', error_)
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado y acciones */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los accesos, roles y estados de los colaboradores de Amaranto.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar por nombre o email..."
              className="pl-9"
            />
          </div>

          <Button className="gap-2" onClick={handleOpenCreate}>
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Filtros */}
      <div className="grid gap-3 rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm md:grid-cols-3">
        <div className="grid gap-2">
          <Label>Filtrar por rol</Label>
          <Select
            value={roleFilter}
            onValueChange={(value: 'all' | UserRole) => {
              setRoleFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                <SelectItem value="OPERATOR">Operador</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Estado</Label>
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | UserStatus) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="INACTIVE">Inactivos</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Resultados</Label>
          <div className="flex h-10 items-center rounded-lg border border-border/70 bg-muted/30 px-3 text-sm text-muted-foreground">
            {filteredUsers.length} usuarios encontrados
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última actividad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Mostrar skeletons solo si no hay usuarios previos */}
            {loading && users.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell colSpan={6}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted/40 animate-pulse" />
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="h-4 w-1/3 rounded bg-muted/40 animate-pulse" />
                          <div className="h-3 w-1/4 rounded bg-muted/30 animate-pulse" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              : paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="bg-background/60">
                    <TableCell className="min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariants[user.role as UserRole]} className="capitalize">
                        {roleLabels[user.role as UserRole]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'ACTIVE' ? 'success' : 'destructive'}>
                        {statusLabels[user.status as UserStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastActivity ?? 'Sin registro'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar usuario"
                          disabled={loading}
                          onClick={() => handleOpenEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title={user.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                          disabled={loading}
                          onClick={() => setConfirmUser(user)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Más acciones"
                          disabled={loading}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

            {!loading && paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No se encontraron usuarios con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          Mostrando{' '}
          <span className="font-medium text-foreground">
            {filteredUsers.length === 0 ? 0 : (safeCurrentPage - 1) * USERS_PER_PAGE + 1}
          </span>{' '}
          -{' '}
          <span className="font-medium text-foreground">
            {Math.min(safeCurrentPage * USERS_PER_PAGE, filteredUsers.length)}
          </span>{' '}
          de <span className="font-medium text-foreground">{filteredUsers.length}</span> usuarios
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange('prev')}
            disabled={safeCurrentPage === 1 || loading}
          >
            Anterior
          </Button>
          <div className="flex h-9 items-center rounded-lg border border-border/70 bg-background px-3 text-sm font-medium text-foreground">
            Página {safeCurrentPage} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange('next')}
            disabled={safeCurrentPage === totalPages || loading}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <UserDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingUser(null)
        }}
        user={
          editingUser
            ? {
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                status: editingUser.status,
              }
            : undefined
        }
        onSave={handleSaveUser}
      />

      <ConfirmDialog
        open={Boolean(confirmUser)}
        onClose={() => setConfirmUser(null)}
        onConfirm={handleConfirmToggle}
        title={
          confirmUser?.status === 'ACTIVE' ? 'Desactivar usuario' : 'Activar usuario'
        }
        description={
          confirmUser
            ? `¿Estás seguro de ${
                confirmUser.status === 'ACTIVE' ? 'desactivar' : 'activar'
              } a ${confirmUser.name}?`
            : ''
        }
        confirmText={confirmUser?.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
        variant={confirmUser?.status === 'ACTIVE' ? 'destructive' : 'default'}
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        isLoading={loading}
        message="Cargando usuarios..."
        icon={<Users className="h-8 w-8 text-primary" />}
      />
    </div>
  )
}

export default UsersPage

