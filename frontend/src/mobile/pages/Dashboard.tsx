import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MapPin,
  Clock,
  CheckCircle2,
  ClipboardList,
  QrCode,
  AlertTriangle,
  History,
  ChevronRight,
  Package,
  PackageCheck,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { useAuth } from '@/shared/hooks/useAuth'
import api from '@/shared/lib/api'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import RefreshContainer from '../components/RefreshContainer'

import { SkeletonList, SkeletonCard, AnimatedList } from '../components/animated'
import { NoAssignments, ErrorState } from '../components/empty'

/**
 * Tipo para una tarea/asignación
 */
interface Assignment {
  id: string
  formId: string
  formName: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed'
  progress?: number
  completedAt?: string
}

/**
 * Tipo para estadísticas rápidas
 */
interface QuickStats {
  pending: number
  completedToday: number
}

/**
 * Componente Hero Card con saludo y ubicación
 */
const HeroCard = () => {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState<string>('Cargando ubicación...')

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Obtener ubicación (geolocalización o ciudad guardada)
  useEffect(() => {
    const getLocation = async () => {
      try {
        // Intentar obtener geolocalización
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Intentar obtener ubicación desde el backend (evita problemas de CORS)
                try {
                  const response = await api.get('/geocoding/reverse', {
                    params: {
                      lat: position.coords.latitude,
                      lon: position.coords.longitude,
                    },
                    timeout: 3000,
                  })
                  setLocation(response.data.address || 'Ubicación actual')
                } catch {
                  // Si el backend no tiene el endpoint, usar fallback
                  setLocation('Ubicación actual')
                }
              } catch {
                setLocation('Ubicación actual')
              }
            },
            () => {
              // Si falla, usar ubicación guardada o default
              setLocation('Santiago, Chile')
            },
          )
        } else {
          setLocation('Santiago, Chile')
        }
      } catch {
        setLocation('Santiago, Chile')
      }
    }

    getLocation()
  }, [])

  const userName = user?.name?.split(' ')[0] || 'Usuario'
  const timeFormatted = format(currentTime, 'HH:mm')
  const dateFormatted = format(currentTime, 'EEEE, d \'de\' MMMM', { locale: es })

  return (
    <Card className="mb-4 overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-mobile-card">
      <CardContent className="p-5">
        <div className="space-y-3">
          <div>
            <h1 className="text-mobile-h1 text-foreground">
              Hola, {userName}
            </h1>
            <p className="text-mobile-caption text-muted-foreground mt-1">
              {dateFormatted}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-mobile-h3 font-semibold">{timeFormatted}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-mobile-caption text-muted-foreground truncate max-w-[120px]">
                {location}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Componente Quick Stats Cards
 */
const QuickStatsCards = ({
  stats,
  isLoading,
  onTap,
}: {
  stats: QuickStats
  isLoading: boolean
  onTap: (type: 'pending' | 'completed') => void
}) => {
  if (isLoading) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-3">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
    )
  }

  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      {/* Tareas Pendientes */}
      <Card
        className="mobile-card cursor-pointer touch-manipulation active:scale-[0.98]"
        onClick={() => onTap('pending')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-mobile-caption text-muted-foreground mb-1">
                Pendientes
              </p>
              <p className="text-mobile-h1 text-foreground">{stats.pending}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Tareas Completadas Hoy */}
      <Card
        className="mobile-card cursor-pointer touch-manipulation active:scale-[0.98] bg-green-50 dark:bg-green-950/20"
        onClick={() => onTap('completed')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-mobile-caption text-muted-foreground mb-1">
                Completadas
              </p>
              <p className="text-mobile-h1 text-green-600 dark:text-green-400">
                {stats.completedToday}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Componente Tarea Card
 */
const TaskCard = ({
  task,
  onTap,
}: {
  task: Assignment
  onTap: () => void
}) => {
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>
      case 'high':
        return <Badge className="bg-orange-500">Alta</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">Media</Badge>
      case 'low':
        return <Badge variant="secondary">Baja</Badge>
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      default:
        return 'bg-gray-300'
    }
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
  const dueDateFormatted = task.dueDate
    ? format(new Date(task.dueDate), "dd/MM 'a las' HH:mm")
    : null

  return (
    <Card
      className="mobile-card mb-3 cursor-pointer touch-manipulation active:scale-[0.98]"
      onClick={onTap}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className="text-mobile-h4 flex-1 font-semibold pr-2">
              {task.formName}
            </h3>
            {getPriorityBadge(task.priority)}
          </div>

          {/* Due Date */}
          {dueDateFormatted && (
            <div className="flex items-center gap-2">
              <Clock
                className={cn(
                  'h-4 w-4',
                  isOverdue ? 'text-destructive' : 'text-muted-foreground',
                )}
              />
              <span
                className={cn(
                  'text-mobile-caption',
                  isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground',
                )}
              >
                {isOverdue ? 'Vencida: ' : 'Hasta: '}
                {dueDateFormatted}
              </span>
            </div>
          )}

          {/* Progress Bar */}
          {task.progress !== undefined && task.progress > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-mobile-caption text-muted-foreground">
                <span>Progreso</span>
                <span>{Math.round(task.progress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full transition-all duration-300', getStatusColor(task.status))}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
              {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Componente Acceso Rápido Chips
 */
const QuickAccessChips = ({ onChipTap }: { onChipTap: (action: string) => void }) => {
  const chips = [
    { id: 'qr', label: 'Escanear QR', icon: QrCode, color: 'bg-blue-500' },
    { id: 'material-request', label: 'Solicitar Materiales', icon: Package, color: 'bg-green-500' },
    { id: 'warehouse-scan', label: 'Escanear QR Bodega', icon: PackageCheck, color: 'bg-orange-500' },
    { id: 'incident', label: 'Reportar', icon: AlertTriangle, color: 'bg-red-500' },
    { id: 'history', label: 'Historial', icon: History, color: 'bg-gray-500' },
  ]

  return (
    <div className="mb-6">
      <h2 className="text-mobile-h3 mb-3 font-semibold">Acceso Rápido</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {chips.map((chip) => {
          const Icon = chip.icon
          return (
            <button
              key={chip.id}
              onClick={() => onChipTap(chip.id)}
              className="tap-target flex min-w-[100px] flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-mobile-sm transition-all active:scale-95"
            >
              <div className={cn('rounded-full p-2', chip.color, 'text-white')}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-mobile-caption font-medium">{chip.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}


/**
 * Dashboard Mobile - Vista principal para operadores de campo
 */
const MobileDashboard = () => {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Assignment[]>([])
  const [stats, setStats] = useState<QuickStats>({ pending: 0, completedToday: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar tareas
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.get('/assignments/today', { timeout: 5000 })
        const data = response.data

        setTasks(data.tasks || [])
        setStats(data.stats || { pending: 0, completedToday: 0 })
      } catch (apiError: any) {
        // Si falla la API (404, timeout, etc.), usar datos mock para desarrollo
        if (apiError?.response?.status === 404 || apiError?.code === 'ECONNABORTED') {
          console.warn('Endpoint /assignments/today no disponible, usando datos mock')
        }
        const mockTasks: Assignment[] = [
          {
            id: '1',
            formId: 'f1',
            formName: 'Inspección de Obra',
            dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            priority: 'high',
            status: 'pending',
          },
          {
            id: '2',
            formId: 'f2',
            formName: 'Control de Materiales',
            dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            priority: 'medium',
            status: 'in_progress',
            progress: 60,
          },
        ]

        const mockStats: QuickStats = {
          pending: 5,
          completedToday: 3,
        }

        // Solo usar mocks en desarrollo
        if (import.meta.env.DEV) {
          setTasks(mockTasks)
          setStats(mockStats)
        } else {
          throw apiError
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar tareas')
      console.error('Error loading tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar al montar
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Handler para pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await loadTasks()
  }, [loadTasks])

  // Handlers
  const handleTaskTap = (taskId: string) => {
    navigate(`/mobile/form/${taskId}`)
  }

  const handleStatsTap = (type: 'pending' | 'completed') => {
    navigate('/mobile/assignments', { state: { filter: type } })
  }

  const handleChipTap = (action: string) => {
    switch (action) {
      case 'qr':
        navigate('/mobile/camera?mode=qr')
        break
      case 'material-request':
        navigate('/mobile/warehouse/request')
        break
      case 'warehouse-scan':
        navigate('/mobile/warehouse/scan')
        break
      case 'incident':
        // TODO: Abrir modal de reporte
        console.log('Reportar incidente')
        break
      case 'history':
        navigate('/mobile/history')
        break
      default:
        break
    }
  }

  return (
    <RefreshContainer onRefresh={handleRefresh} disabled={isLoading}>
      <div className="space-y-4">
        {/* Hero Card */}
        <HeroCard />

        {/* Quick Stats */}
        <QuickStatsCards stats={stats} isLoading={isLoading} onTap={handleStatsTap} />

        {/* Acceso Rápido */}
        <QuickAccessChips onChipTap={handleChipTap} />

        {/* Tareas de Hoy */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-mobile-h3 font-semibold">Tareas de Hoy</h2>
            {tasks.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/mobile/assignments')}
                className="text-mobile-caption"
              >
                Ver todas
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <SkeletonList count={3} className="space-y-3" itemClassName="h-32" />
          )}

          {/* Error State */}
          {error && !isLoading && (
            <ErrorState
              error={error}
              onRetry={() => loadTasks()}
              variant="inline"
            />
          )}

          {/* Empty State */}
          {!isLoading && !error && tasks.length === 0 && (
            <NoAssignments
              variant="inline"
              title="No tienes tareas para hoy"
              description="Las tareas asignadas para hoy aparecerán aquí"
            />
          )}

          {/* Tasks List */}
          {!isLoading && !error && tasks.length > 0 && (
            <AnimatedList
              enableStagger
              className="space-y-3"
              keyExtractor={(_item, index) => {
                const task = tasks[index]
                return task?.id || index
              }}
            >
              {tasks.slice(0, 3).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTap={() => handleTaskTap(task.id)}
                />
              ))}
            </AnimatedList>
          )}
        </div>
      </div>
    </RefreshContainer>
  )
}

export default MobileDashboard
