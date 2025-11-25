/**
 * Página de Sesiones Activas - Mobile
 * Gestionar sesiones activas del usuario
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Smartphone, Monitor, Tablet, LogOut, AlertTriangle, ArrowUpDown } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { useToast } from '@/shared/components/ui/use-toast'
import SortOptions, { type SortOption, type SortDirection } from '../components/SortOptions'
import api from '@/shared/lib/api'

/**
 * Tipo para sesión activa
 */
interface ActiveSession {
  id: string
  device: string
  deviceType: 'mobile' | 'desktop' | 'tablet'
  browser: string
  location?: string
  ipAddress?: string
  lastActivity: Date
  isCurrent: boolean
}

/**
 * Página de Sesiones Activas
 */
const Sessions = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null)
  const [showSort, setShowSort] = useState(false)
  const [sort, setSort] = useState<string>('date_recent')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Cargar sesiones activas
  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true)
      try {
        // Endpoint a implementar en backend: GET /auth/sessions
        const response = await api.get('/auth/sessions')
        setSessions(response.data)
      } catch (error: any) {
        console.error('Error al cargar sesiones:', error)
        // Datos de ejemplo para desarrollo
        setSessions([
          {
            id: '1',
            device: 'iPhone 13 Pro',
            deviceType: 'mobile',
            browser: 'Safari',
            location: 'Santiago, Chile',
            ipAddress: '192.168.1.1',
            lastActivity: new Date(),
            isCurrent: true,
          },
          {
            id: '2',
            device: 'Chrome en Windows',
            deviceType: 'desktop',
            browser: 'Chrome',
            location: 'Santiago, Chile',
            ipAddress: '192.168.1.2',
            lastActivity: new Date(Date.now() - 3600000), // 1 hora atrás
            isCurrent: false,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    void loadSessions()
  }, [])

  // Cerrar sesión en otro dispositivo
  const handleRevokeSession = async (sessionId: string) => {
    try {
      // Endpoint a implementar en backend: DELETE /auth/sessions/:id
      await api.delete(`/auth/sessions/${sessionId}`)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      setSessionToRevoke(null)
      toast({
        title: 'Sesión cerrada',
        description: 'La sesión ha sido cerrada exitosamente',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo cerrar la sesión',
        variant: 'destructive',
      })
    }
  }

  // Cerrar todas las demás sesiones
  const handleRevokeAllSessions = async () => {
    try {
      // Endpoint a implementar en backend: DELETE /auth/sessions
      await api.delete('/auth/sessions')
      setSessions((prev) => prev.filter((s) => s.isCurrent))
      toast({
        title: 'Sesiones cerradas',
        description: 'Todas las demás sesiones han sido cerradas',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cerrar las sesiones',
        variant: 'destructive',
      })
    }
  }

  // Obtener ícono según tipo de dispositivo
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />
      case 'tablet':
        return <Tablet className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">Cargando sesiones...</p>
      </div>
    )
  }

  // Configuración de ordenamiento para sesiones
  const sortOptions: SortOption[] = useMemo(
    () => [
      {
        value: 'date_recent',
        label: 'Última actividad (más reciente primero)',
        description: 'Ordenar por última actividad, más recientes primero',
      },
      {
        value: 'date_oldest',
        label: 'Última actividad (más antigua primero)',
        description: 'Ordenar por última actividad, más antiguas primero',
      },
      {
        value: 'name_asc',
        label: 'Dispositivo (A-Z)',
        description: 'Ordenar alfabéticamente por nombre de dispositivo',
      },
      {
        value: 'name_desc',
        label: 'Dispositivo (Z-A)',
        description: 'Ordenar alfabéticamente inverso',
      },
      {
        value: 'deviceType',
        label: 'Tipo de dispositivo',
        description: 'Ordenar por tipo: móvil, tablet, desktop',
      },
    ],
    [],
  )

  // Ordenar sesiones
  const sortSessions = useCallback(
    (sessionsToSort: ActiveSession[], sortValue: string, direction: SortDirection) => {
      const sorted = [...sessionsToSort]

      switch (sortValue) {
        case 'date_recent':
          sorted.sort((a, b) => {
            return b.lastActivity.getTime() - a.lastActivity.getTime()
          })
          break

        case 'date_oldest':
          sorted.sort((a, b) => {
            return a.lastActivity.getTime() - b.lastActivity.getTime()
          })
          break

        case 'name_asc':
          sorted.sort((a, b) => {
            return a.device.localeCompare(b.device, 'es', { sensitivity: 'base' })
          })
          break

        case 'name_desc':
          sorted.sort((a, b) => {
            return b.device.localeCompare(a.device, 'es', { sensitivity: 'base' })
          })
          break

        case 'deviceType':
          const typeOrder: Record<string, number> = { mobile: 1, tablet: 2, desktop: 3 }
          sorted.sort((a, b) => {
            const orderA = typeOrder[a.deviceType] || 0
            const orderB = typeOrder[b.deviceType] || 0
            return direction === 'asc' ? orderA - orderB : orderB - orderA
          })
          break

        default:
          break
      }

      return sorted
    },
    [],
  )

  const currentSession = sessions.find((s) => s.isCurrent)
  const otherSessionsFiltered = sessions.filter((s) => !s.isCurrent)
  const otherSessions = useMemo(
    () => sortSessions(otherSessionsFiltered, sort, sortDirection),
    [otherSessionsFiltered, sort, sortDirection, sortSessions],
  )

  // Handler para cambio de ordenamiento
  const handleSortChange = useCallback((newSort: string, newDirection: SortDirection) => {
    setSort(newSort)
    setSortDirection(newDirection)
  }, [])

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-xl font-bold">Sesiones Activas</h1>
        {otherSessions.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSort(true)}
            className="h-9 w-9"
            aria-label="Ordenar"
          >
            <ArrowUpDown className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 space-y-6 p-4">
        {/* Sesión actual */}
        {currentSession && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getDeviceIcon(currentSession.deviceType)}
                Sesión actual
              </CardTitle>
              <CardDescription>Esta es tu sesión actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dispositivo</span>
                  <span className="text-sm font-medium">{currentSession.device}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Navegador</span>
                  <span className="text-sm font-medium">{currentSession.browser}</span>
                </div>
                {currentSession.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ubicación</span>
                    <span className="text-sm font-medium">{currentSession.location}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Última actividad</span>
                  <span className="text-sm font-medium">
                    {formatDistanceToNow(currentSession.lastActivity, {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">
                Sesión actual
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Otras sesiones */}
        {otherSessions.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Otras sesiones</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAllSessions}
                className="text-destructive"
              >
                Cerrar todas
              </Button>
            </div>

            <div className="space-y-4">
              {otherSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{getDeviceIcon(session.deviceType)}</div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-medium">{session.device}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.browser}
                            </p>
                          </div>
                          {session.location && (
                            <p className="text-xs text-muted-foreground">
                              {session.location}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Última actividad:{' '}
                            {formatDistanceToNow(session.lastActivity, {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSessionToRevoke(session.id)}
                        className="text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {otherSessions.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                No hay otras sesiones activas
              </p>
            </CardContent>
          </Card>
        )}

        {/* Advertencia */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  ¿Ves una sesión sospechosa?
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Si ves una sesión que no reconoces, ciérrala inmediatamente y cambia tu
                  contraseña.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmación para cerrar sesión */}
      <AlertDialog
        open={sessionToRevoke !== null}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cerrará la sesión en ese dispositivo. El usuario tendrá que
              iniciar sesión nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && handleRevokeSession(sessionToRevoke)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sort Options Modal */}
      {otherSessions.length > 0 && (
        <SortOptions
          options={sortOptions}
          currentSort={sort}
          currentDirection={sortDirection}
          onChange={handleSortChange}
          open={showSort}
          onOpen={() => setShowSort(true)}
          onClose={() => setShowSort(false)}
          storageKey="sessions-sort"
          showButton={false}
        />
      )}
    </div>
  )
}

export default Sessions

