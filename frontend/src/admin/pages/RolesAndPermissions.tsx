import { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  Search,
  Save,
  AlertCircle,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Checkbox } from '@/shared/components/ui/checkbox'
import ConfirmDialog from '@/shared/components/common/ConfirmDialog'
import PageLoader from '@/shared/components/common/PageLoader'
import { useRoles, type Role } from '@/shared/hooks/useRoles'
import { useUserPermissions } from '@/shared/hooks/useUserPermissions'
import { Permission, PermissionGroups, PermissionLabels } from '@/shared/types/permissions'
import useUsers from '@/shared/hooks/useUsers'
import { cn } from '@/shared/lib/utils'

const RolesAndPermissions = () => {
  const { roles, loading, createRole, updateRole, deleteRole } = useRoles()
  const { users, fetchUsers } = useUsers()
  const { updateUserPermissions, getUserPermissions } = useUserPermissions()

  // Estado para diálogos
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [userPermissionsDialogOpen, setUserPermissionsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const [userCustomPermissions, setUserCustomPermissions] = useState<Permission[]>([])
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null)

  // Estado del formulario de rol
  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
    selectedPermissions: [] as Permission[],
  })

  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrar roles
  const filteredRoles = useMemo(() => {
    if (!searchQuery) return roles
    const query = searchQuery.toLowerCase()
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.displayName.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query),
    )
  }, [roles, searchQuery])

  // Abrir diálogo para crear rol
  const handleCreateRole = () => {
    setEditingRole(null)
    setRoleForm({
      name: '',
      displayName: '',
      description: '',
      selectedPermissions: [],
    })
    setRoleDialogOpen(true)
  }

  // Abrir diálogo para editar rol
  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      selectedPermissions: role.permissions,
    })
    setRoleDialogOpen(true)
  }

  // Guardar rol (crear o actualizar)
  const handleSaveRole = async () => {
    try {
      if (editingRole) {
        // Actualizar
        await updateRole(editingRole.id, {
          displayName: roleForm.displayName,
          description: roleForm.description || undefined,
          permissions: roleForm.selectedPermissions,
        })
      } else {
        // Crear
        await createRole({
          name: roleForm.name,
          displayName: roleForm.displayName,
          description: roleForm.description || undefined,
          permissions: roleForm.selectedPermissions,
        })
      }
      setRoleDialogOpen(false)
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  // Eliminar rol
  const handleDeleteRole = async () => {
    if (!confirmDelete) return
    try {
      await deleteRole(confirmDelete.id)
      setConfirmDelete(null)
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  // Toggle permiso en formulario
  const togglePermission = (permission: Permission) => {
    setRoleForm((prev) => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permission)
        ? prev.selectedPermissions.filter((p) => p !== permission)
        : [...prev.selectedPermissions, permission],
    }))
  }

  // Toggle grupo de permisos
  const togglePermissionGroup = (groupPermissions: Permission[]) => {
    const allSelected = groupPermissions.every((p) => roleForm.selectedPermissions.includes(p))
    setRoleForm((prev) => ({
      ...prev,
      selectedPermissions: allSelected
        ? prev.selectedPermissions.filter((p) => !groupPermissions.includes(p))
        : [...new Set([...prev.selectedPermissions, ...groupPermissions])],
    }))
  }

  // Abrir diálogo de permisos de usuario
  const handleEditUserPermissions = async (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName })
    const userPerms = await getUserPermissions(userId)
    setUserCustomPermissions(userPerms)
    setUserPermissionsDialogOpen(true)
  }

  // Guardar permisos de usuario
  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return
    try {
      await updateUserPermissions(selectedUser.id, userCustomPermissions)
      setUserPermissionsDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      // Error ya manejado en el hook
    }
  }

  // Cargar usuarios al montar
  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  if (loading && roles.length === 0) {
    return (
      <div className="flex h-full flex-col space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Roles y Permisos
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los roles del sistema y sus permisos asociados.
            </p>
          </div>
        </div>
        <PageLoader
          message="Cargando roles y permisos..."
          icon={<Shield className="h-12 w-12 text-primary" />}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Roles y Permisos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los roles del sistema y configura los permisos de cada uno.
          </p>
        </div>
        <Button onClick={handleCreateRole} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Rol
        </Button>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">Permisos de Usuarios</TabsTrigger>
        </TabsList>

        {/* Tab de Roles */}
        <TabsContent value="roles" className="space-y-4">
          {/* Búsqueda */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de roles */}
          <div className="grid gap-4">
            {filteredRoles.map((role) => {
              const isSystemRole = role.isSystem
              return (
                <Card key={role.id} className={cn(isSystemRole && 'border-blue-200 bg-blue-50/50')}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{role.displayName}</CardTitle>
                          {isSystemRole && (
                            <Badge variant="outline" className="text-xs">
                              Sistema
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {role._count?.users || 0} usuario{role._count?.users !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <CardDescription>
                          {role.description || 'Sin descripción'}
                        </CardDescription>
                        <div className="flex flex-wrap gap-1 pt-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {role.name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {role.permissions.length} permiso{role.permissions.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        {!isSystemRole && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDelete(role)}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Permisos:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 10).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {PermissionLabels[permission]}
                          </Badge>
                        ))}
                        {role.permissions.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 10} más
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {filteredRoles.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No se encontraron roles' : 'No hay roles creados'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab de Permisos de Usuarios */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permisos Personalizados por Usuario</CardTitle>
              <CardDescription>
                Asigna permisos adicionales o restringe permisos específicos para usuarios
                individuales. Estos permisos se combinan con los permisos del rol del usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Permisos Personalizados</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          Personalizados
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUserPermissions(user.id, user.name)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de crear/editar rol */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Modifica los permisos y detalles del rol.'
                : 'Crea un nuevo rol y asigna los permisos correspondientes.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre del rol (solo en creación) */}
            {!editingRole && (
              <div className="space-y-2">
                <Label htmlFor="role-name">
                  Nombre del Rol <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="role-name"
                  placeholder="supervisor"
                  value={roleForm.name}
                  onChange={(e) =>
                    setRoleForm((prev) => ({ ...prev, name: e.target.value.toLowerCase() }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Nombre único en minúsculas (ej: supervisor, jefe_obra)
                </p>
              </div>
            )}

            {/* Nombre para mostrar */}
            <div className="space-y-2">
              <Label htmlFor="role-display-name">
                Nombre para Mostrar <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role-display-name"
                placeholder="Supervisor de Obra"
                value={roleForm.displayName}
                onChange={(e) =>
                  setRoleForm((prev) => ({ ...prev, displayName: e.target.value }))
                }
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="role-description">Descripción</Label>
              <Textarea
                id="role-description"
                placeholder="Descripción del rol y sus responsabilidades..."
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            {/* Permisos */}
            <div className="space-y-4">
              <Label>Permisos</Label>
              <div className="space-y-4 rounded-lg border p-4">
                {Object.entries(PermissionGroups).map(([groupName, groupPermissions]) => {
                  const allSelected = groupPermissions.every((p) =>
                    roleForm.selectedPermissions.includes(p),
                  )
                  const someSelected = groupPermissions.some((p) =>
                    roleForm.selectedPermissions.includes(p),
                  )

                  return (
                    <div key={groupName} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          ref={(el) => {
                            if (el) {
                              ;(el as any).indeterminate = someSelected && !allSelected
                            }
                          }}
                          onCheckedChange={() => togglePermissionGroup(groupPermissions)}
                        />
                        <Label className="font-semibold capitalize">
                          {groupName.replace(/_/g, ' ')}
                        </Label>
                      </div>
                      <div className="ml-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {groupPermissions.map((permission) => (
                          <div key={permission} className="flex items-center gap-2">
                            <Checkbox
                              checked={roleForm.selectedPermissions.includes(permission)}
                              onCheckedChange={() => togglePermission(permission)}
                            />
                            <Label className="text-sm font-normal">
                              {PermissionLabels[permission]}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={
                !roleForm.displayName || (!editingRole && !roleForm.name) || loading
              }
            >
              <Save className="mr-2 h-4 w-4" />
              {editingRole ? 'Actualizar' : 'Crear'} Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de permisos de usuario */}
      <Dialog open={userPermissionsDialogOpen} onOpenChange={setUserPermissionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permisos Personalizados: {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Los permisos personalizados se combinan con los permisos del rol del usuario. Puedes
              agregar permisos adicionales o restringir permisos específicos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900">
                    Permisos Personalizados
                  </p>
                  <p className="text-xs text-amber-700">
                    Estos permisos se suman a los permisos del rol. Si necesitas restringir
                    permisos, considera cambiar el rol del usuario.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(PermissionGroups).map(([groupName, groupPermissions]) => {
                const allSelected = groupPermissions.every((p) =>
                  userCustomPermissions.includes(p),
                )
                const someSelected = groupPermissions.some((p) =>
                  userCustomPermissions.includes(p),
                )

                return (
                  <div key={groupName} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allSelected}
                        ref={(el) => {
                          if (el) {
                            ;(el as any).indeterminate = someSelected && !allSelected
                          }
                        }}
                        onCheckedChange={() => {
                          const allSelected = groupPermissions.every((p) =>
                            userCustomPermissions.includes(p),
                          )
                          setUserCustomPermissions((prev) =>
                            allSelected
                              ? prev.filter((p) => !groupPermissions.includes(p))
                              : [...new Set([...prev, ...groupPermissions])],
                          )
                        }}
                      />
                      <Label className="font-semibold capitalize">
                        {groupName.replace(/_/g, ' ')}
                      </Label>
                    </div>
                    <div className="ml-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {groupPermissions.map((permission) => (
                        <div key={permission} className="flex items-center gap-2">
                          <Checkbox
                            checked={userCustomPermissions.includes(permission)}
                            onCheckedChange={(checked) => {
                              setUserCustomPermissions((prev) =>
                                checked
                                  ? [...prev, permission]
                                  : prev.filter((p) => p !== permission),
                              )
                            }}
                          />
                          <Label className="text-sm font-normal">
                            {PermissionLabels[permission]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserPermissionsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserPermissions} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteRole}
        title="Eliminar Rol"
        description={
          confirmDelete
            ? `¿Estás seguro de que deseas eliminar el rol "${confirmDelete.displayName}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}

export default RolesAndPermissions

