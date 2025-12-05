import { useState, useEffect } from 'react'
import { UserPlus, X, Users } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'

interface Supervisor {
  id: string
  name: string
  email: string
  role: {
    id: string
    name: string
    displayName: string
  }
}

interface SupervisorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
}

const SupervisorDialog = ({ open, onOpenChange, userId, userName }: SupervisorDialogProps) => {
  const { toast } = useToast()
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [allUsers, setAllUsers] = useState<Supervisor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && userId) {
      fetchSupervisors()
      fetchAllUsers()
    }
  }, [open, userId])

  const fetchSupervisors = async () => {
    try {
      const { data } = await api.get(`/users/${userId}/supervisors`)
      setSupervisors(data.data || [])
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Error al cargar superiores',
        variant: 'destructive',
      })
    }
  }

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/users', { params: { limit: 100 } })
      // Filtrar el usuario actual
      const filtered = (data.data || []).filter((u: any) => u.id !== userId)
      setAllUsers(filtered)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Error al cargar usuarios',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignSupervisor = async (supervisorId: string) => {
    try {
      await api.post(`/users/${userId}/supervisors`, { supervisorId })
      toast({
        title: 'Superior asignado',
        description: 'El superior ha sido asignado correctamente',
      })
      fetchSupervisors()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Error al asignar superior',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveSupervisor = async (supervisorId: string) => {
    try {
      await api.delete(`/users/${userId}/supervisors/${supervisorId}`)
      toast({
        title: 'Superior eliminado',
        description: 'El superior ha sido eliminado correctamente',
      })
      fetchSupervisors()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Error al eliminar superior',
        variant: 'destructive',
      })
    }
  }

  const filteredUsers = allUsers.filter(
    (user) =>
      !supervisors.some((s) => s.id === user.id) &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Superiores de {userName}
          </DialogTitle>
          <DialogDescription>
            Asigna o elimina superiores que pueden autorizar solicitudes de este usuario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Superiores actuales */}
          <div>
            <div className="mb-2 text-sm font-medium">Superiores Asignados</div>
            {supervisors.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No hay superiores asignados
              </div>
            ) : (
              <div className="space-y-2">
                {supervisors.map((supervisor) => (
                  <div
                    key={supervisor.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{supervisor.name}</div>
                      <div className="text-sm text-muted-foreground">{supervisor.email}</div>
                      <Badge variant="outline" className="mt-1">
                        {supervisor.role.displayName}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSupervisor(supervisor.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agregar superiores */}
          <div>
            <div className="mb-2 text-sm font-medium">Agregar Superior</div>
            <Input
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            {loading ? (
              <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                Cargando usuarios...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                {searchTerm ? 'No se encontraron usuarios' : 'Busca un usuario para agregar'}
              </div>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-2 hover:bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {user.role.displayName}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignSupervisor(user.id)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SupervisorDialog

