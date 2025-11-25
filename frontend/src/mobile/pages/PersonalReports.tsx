/**
 * PersonalReports - Vista de reportes personales para operador
 * Métricas, visualizaciones y gamificación
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, eachDayOfInterval, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MobileBarChart,
  MobileLineChart,
  MobileProgressRing,
  MobileHeatMap,
  type MobileBarChartData,
  type MobileLineChartData,
  type MobileHeatMapData,
} from '../components/charts'
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  MapPin,
  Camera,
  Download,
  Share2,
  Filter,
  Calendar,
  FileText,
  AlertCircle,
  Sparkles,
  Trophy,
  Star,
  Zap,
  Flame,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import RefreshContainer from '../components/RefreshContainer'
import { SkeletonCard } from '../components/animated'
import { useOfflineAssignments } from '../hooks/useOfflineAssignments'
import FilterSystem, { type FilterConfig } from '../components/FilterSystem'
import ExportSheet from '../components/ExportSheet'
import InsightsCarousel from '../components/InsightsCarousel'
import { insightsEngine, type Insight, type UserData } from '../utils/insightsEngine'
import { useSyncManager } from '../hooks/useSyncManager'
import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'
import { useAuth } from '@/shared/hooks/useAuth'

/**
 * Tipo de período
 */
type PeriodType = 'today' | 'week' | 'month' | 'custom'

/**
 * Métricas de productividad
 */
interface ProductivityMetrics {
  tasksCompleted: number
  averageTimePerTask: number // minutos
  completionRate: number // porcentaje
  comparisonWithPrevious: number // porcentaje de cambio
}

/**
 * Métricas de calidad
 */
interface QualityMetrics {
  formsWithoutErrors: number
  resubmissionsNeeded: number
  feedbackReceived: number
  errorRate: number // porcentaje
}

/**
 * Métricas de actividad
 */
interface ActivityMetrics {
  activeDays: number
  hoursWorked: number
  locationsVisited: number
  photosCaptured: number
}

/**
 * Logro/Badge
 */
interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  unlocked: boolean
  progress?: number // 0-100
}


/**
 * Componente Achievement Badge
 */
const AchievementBadge = ({ achievement }: { achievement: Achievement }) => {
  return (
    <Card
      className={cn(
        'mobile-card relative overflow-hidden transition-all',
        achievement.unlocked
          ? 'border-2 border-primary shadow-md'
          : 'opacity-60 border-dashed',
      )}
    >
      {achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            Desbloqueado
          </Badge>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              achievement.unlocked ? 'bg-primary/10' : 'bg-muted',
            )}
            style={{ color: achievement.unlocked ? achievement.color : undefined }}
          >
            {achievement.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
            {achievement.progress !== undefined && !achievement.unlocked && (
              <div className="mt-2">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {achievement.progress}% completado
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


/**
 * Componente PersonalReports
 */
const PersonalReports = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const { assignments, isOnline } = useOfflineAssignments()
  const { lastSyncDate } = useSyncManager()

  const [period, setPeriod] = useState<PeriodType>(
    (searchParams.get('period') as PeriodType) || 'week',
  )
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const exportContentRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  // Datos del período
  const periodData = useMemo(() => {
    const now = new Date()
    let start: Date
    let end: Date = endOfDay(now)
    let previousStart: Date
    let previousEnd: Date

    switch (period) {
      case 'today':
        start = startOfDay(now)
        previousStart = startOfDay(subDays(now, 1))
        previousEnd = endOfDay(subDays(now, 1))
        break
      case 'week':
        start = startOfWeek(now, { locale: es })
        end = endOfWeek(now, { locale: es })
        previousStart = startOfWeek(subWeeks(now, 1), { locale: es })
        previousEnd = endOfWeek(subWeeks(now, 1), { locale: es })
        break
      case 'month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        previousStart = startOfMonth(subMonths(now, 1))
        previousEnd = endOfMonth(subMonths(now, 1))
        break
      case 'custom':
        // TODO: Implementar selector de fechas personalizado
        start = startOfWeek(now, { locale: es })
        end = endOfWeek(now, { locale: es })
        previousStart = startOfWeek(subWeeks(now, 1), { locale: es })
        previousEnd = endOfWeek(subWeeks(now, 1), { locale: es })
        break
    }

    return { start, end, previousStart, previousEnd }
  }, [period])

  // Filtrar asignaciones por período
  const periodAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (!a.completedAt) return false
      const completedDate = new Date(a.completedAt)
      return completedDate >= periodData.start && completedDate <= periodData.end
    })
  }, [assignments, periodData])

  // Filtrar asignaciones del período anterior
  const previousPeriodAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (!a.completedAt) return false
      const completedDate = new Date(a.completedAt)
      return completedDate >= periodData.previousStart && completedDate <= periodData.previousEnd
    })
  }, [assignments, periodData])

  // Calcular métricas de productividad
  const productivityMetrics = useMemo((): ProductivityMetrics => {
    const tasksCompleted = periodAssignments.length
    const previousCompleted = previousPeriodAssignments.length

    // Tiempo promedio (simulado, en producción vendría del backend)
    const averageTimePerTask = periodAssignments.length > 0 ? 25 : 0 // minutos

    // Tasa de completitud
    const totalAssigned = assignments.filter(
      (a) => new Date(a.assignedAt) >= periodData.start && new Date(a.assignedAt) <= periodData.end,
    ).length
    const completionRate = totalAssigned > 0 ? Math.round((tasksCompleted / totalAssigned) * 100) : 0

    // Comparación con período anterior
    const comparison =
      previousCompleted > 0
        ? Math.round(((tasksCompleted - previousCompleted) / previousCompleted) * 100)
        : tasksCompleted > 0
          ? 100
          : 0

    return {
      tasksCompleted,
      averageTimePerTask,
      completionRate,
      comparisonWithPrevious: comparison,
    }
  }, [periodAssignments, previousPeriodAssignments, assignments, periodData])

  // Calcular métricas de calidad
  const qualityMetrics = useMemo((): QualityMetrics => {
    // Simulado, en producción vendría del backend
    const formsWithoutErrors = Math.round(periodAssignments.length * 0.85)
    const resubmissionsNeeded = Math.round(periodAssignments.length * 0.1)
    const feedbackReceived = Math.round(periodAssignments.length * 0.3)
    const errorRate = periodAssignments.length > 0
      ? Math.round((resubmissionsNeeded / periodAssignments.length) * 100)
      : 0

    return {
      formsWithoutErrors,
      resubmissionsNeeded,
      feedbackReceived,
      errorRate,
    }
  }, [periodAssignments])

  // Calcular métricas de actividad
  const activityMetrics = useMemo((): ActivityMetrics => {
    const activeDaysSet = new Set<string>()
    periodAssignments.forEach((a) => {
      if (a.completedAt) {
        activeDaysSet.add(format(new Date(a.completedAt), 'yyyy-MM-dd'))
      }
    })

    const activeDays = activeDaysSet.size
    const hoursWorked = activeDays * 8 // Simulado
    const locationsVisited = new Set(periodAssignments.map((a) => a.location).filter(Boolean)).size
    const photosCaptured = periodAssignments.length * 2 // Simulado

    return {
      activeDays,
      hoursWorked,
      locationsVisited,
      photosCaptured,
    }
  }, [periodAssignments])

  // Calcular logros
  const achievements = useMemo((): Achievement[] => {
    const allAchievements: Achievement[] = []

    // Racha de días
    let streak = 0
    const today = startOfDay(new Date())
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(today, i)
      const hasCompleted = assignments.some(
        (a) =>
          a.status === 'completed' &&
          a.completedAt &&
          isSameDay(new Date(a.completedAt), checkDate),
      )
      if (hasCompleted) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    allAchievements.push({
      id: 'streak-7',
      title: 'Racha de 7 días',
      description: 'Completa tareas 7 días consecutivos',
      icon: <Flame className="h-5 w-5" />,
      color: '#f59e0b',
      unlocked: streak >= 7,
      progress: Math.min((streak / 7) * 100, 100),
    })

    // 100 tareas completadas
    const totalCompleted = assignments.filter((a) => a.status === 'completed').length
    allAchievements.push({
      id: '100-tasks',
      title: '100 tareas completadas',
      description: 'Llega a 100 tareas completadas',
      icon: <Target className="h-5 w-5" />,
      color: '#10b981',
      unlocked: totalCompleted >= 100,
      progress: Math.min((totalCompleted / 100) * 100, 100),
    })

    // Perfeccionista
    const perfectForms = qualityMetrics.formsWithoutErrors
    allAchievements.push({
      id: 'perfectionist',
      title: 'Perfeccionista',
      description: 'Completa 50 formularios sin errores',
      icon: <Star className="h-5 w-5" />,
      color: '#8b5cf6',
      unlocked: perfectForms >= 50,
      progress: Math.min((perfectForms / 50) * 100, 100),
    })

    return allAchievements
  }, [assignments, qualityMetrics])

  // Datos para gráficos
  const dailyActivityData = useMemo(() => {
    const days = eachDayOfInterval({ start: periodData.start, end: periodData.end })
    return days.map((day) => {
      const count = periodAssignments.filter(
        (a) => a.completedAt && isSameDay(new Date(a.completedAt), day),
      ).length
      return {
        date: day,
        dateLabel: format(day, 'EEE', { locale: es }),
        count,
      }
    })
  }, [periodAssignments, periodData])

  // Generar insights usando el engine
  const generateInsights = useCallback(() => {
    const userData: UserData = {
      assignments,
      lastSyncDate: lastSyncDate || undefined,
      isOnline,
      activeHours: 0, // TODO: calcular desde datos reales
    }

    const generatedInsights = insightsEngine.generateInsights(userData)
    setInsights(generatedInsights)
  }, [assignments, lastSyncDate, isOnline])

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Generar insights
      generateInsights()

      // Intentar obtener datos del servidor
      try {
        await api.get('/reports/personal', {
          params: {
            start: periodData.start.toISOString(),
            end: periodData.end.toISOString(),
          },
        })
      } catch (err) {
        // Si falla, usar datos locales
        console.warn('No se pudieron cargar reportes del servidor, usando datos locales')
      }
    } catch (err: any) {
      console.error('Error al cargar reportes:', err)
      setError('No se pudieron cargar los reportes')
    } finally {
      setIsLoading(false)
    }
  }, [periodData, generateInsights])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Recalcular insights cuando cambian los datos
  useEffect(() => {
    if (!isLoading && assignments.length > 0) {
      generateInsights()
    }
  }, [assignments, lastSyncDate, isOnline, isLoading, generateInsights])

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await loadData()
    toast({
      title: 'Reportes actualizados',
      duration: 2000,
    })
  }, [loadData, toast])

  // Preparar datos para exportación
  const exportData = useMemo(() => {
    return periodAssignments.map((a) => ({
      Fecha: a.completedAt ? format(new Date(a.completedAt), 'dd/MM/yyyy HH:mm', { locale: es }) : '',
      Tarea: a.formName,
      Estado: a.status === 'completed' ? 'Completada' : a.status === 'in_progress' ? 'En progreso' : 'Pendiente',
      Progreso: a.progress ? `${a.progress}%` : '0%',
      Prioridad: a.priority || 'N/A',
      Ubicación: a.location || 'N/A',
    }))
  }, [periodAssignments])

  // Metadata para exportación
  const exportMetadata = useMemo(() => {
    const periodLabel =
      period === 'today'
        ? 'Hoy'
        : period === 'week'
          ? 'Esta semana'
          : period === 'month'
            ? 'Este mes'
            : 'Personalizado'
    return {
      userId: user?.id,
      userName: user?.name || user?.email,
      period: `${periodLabel} (${format(periodData.start, 'dd/MM/yyyy')} - ${format(periodData.end, 'dd/MM/yyyy')})`,
      appVersion: '1.0.0',
    }
  }, [period, periodData, user])

  // Configuración de filtros
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        id: 'formIds',
        type: 'multiselect',
        label: 'Tipo de formulario',
        category: 'General',
        options: Array.from(new Set(assignments.map((a) => a.formId))).map((id) => {
          const assignment = assignments.find((a) => a.formId === id)
          return { value: id, label: assignment?.formName || id }
        }),
      },
      {
        id: 'locations',
        type: 'multiselect',
        label: 'Ubicación',
        category: 'General',
        options: Array.from(new Set(assignments.map((a) => a.location).filter(Boolean))).map(
          (loc) => ({ value: loc!, label: loc! }),
        ),
      },
    ],
    [assignments],
  )

  return (
    <RefreshContainer onRefresh={handleRefresh} disabled={isLoading}>
      <div className="flex min-h-screen flex-col pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
          <h1 className="flex-1 text-xl font-bold">Mis Reportes</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFiltersOpen(true)}
            className="h-9 w-9"
            aria-label="Filtros"
          >
            <Filter className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9 w-9"
            aria-label="Actualizar"
          >
            <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="sticky top-14 z-10 border-b bg-background px-4 py-2">
          <Tabs value={period} onValueChange={(value) => {
            setPeriod(value as PeriodType)
            setSearchParams({ period: value })
          }}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="today" className="text-xs">Hoy</TabsTrigger>
              <TabsTrigger value="week" className="text-xs">Esta semana</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Este mes</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs">Personalizado</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Contenido - Ref para captura PNG */}
        <div ref={exportContentRef} className="flex-1 space-y-4 p-4">
          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} className="h-32" />
                ))}
              </div>
              <SkeletonCard className="h-64" />
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <Card className="border-destructive">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
                <h3 className="text-lg font-semibold mb-2">Error al cargar reportes</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <>
              {/* Métricas de Productividad */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5" />
                    Productividad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <MobileProgressRing
                      value={productivityMetrics.tasksCompleted}
                      max={50}
                      label="Tareas completadas"
                      size={100}
                      animated={true}
                    />
                    <MobileProgressRing
                      value={productivityMetrics.completionRate}
                      max={100}
                      label="Tasa de completitud"
                      size={100}
                      animated={true}
                    />
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tiempo promedio</span>
                      <span className="text-sm font-semibold">
                        {productivityMetrics.averageTimePerTask} min/tarea
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Comparación</span>
                      <div className="flex items-center gap-2">
                        {productivityMetrics.comparisonWithPrevious >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            productivityMetrics.comparisonWithPrevious >= 0
                              ? 'text-green-500'
                              : 'text-red-500',
                          )}
                        >
                          {Math.abs(productivityMetrics.comparisonWithPrevious)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Métricas de Calidad */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Award className="h-5 w-5" />
                    Calidad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MobileBarChart
                    data={[
                      { name: 'Sin errores', value: qualityMetrics.formsWithoutErrors, color: 'hsl(var(--primary))' },
                      { name: 'Resubmisiones', value: qualityMetrics.resubmissionsNeeded, color: 'hsl(var(--destructive))' },
                      { name: 'Con feedback', value: qualityMetrics.feedbackReceived, color: 'hsl(var(--primary) / 0.7)' },
                    ]}
                    height={200}
                    showGrid={true}
                    onBarTap={(data, index) => {
                      toast({
                        title: data.name,
                        description: `Valor: ${data.value}`,
                        duration: 2000,
                      })
                    }}
                  />
                </CardContent>
              </Card>

              {/* Métricas de Actividad */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-5 w-5" />
                    Actividad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{activityMetrics.activeDays}</div>
                      <div className="text-xs text-muted-foreground">Días activos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{activityMetrics.hoursWorked}h</div>
                      <div className="text-xs text-muted-foreground">Horas trabajadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{activityMetrics.locationsVisited}</div>
                      <div className="text-xs text-muted-foreground">Ubicaciones</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{activityMetrics.photosCaptured}</div>
                      <div className="text-xs text-muted-foreground">Fotos</div>
                    </div>
                  </div>

                  {/* Gráfico de línea */}
                  <MobileLineChart
                    data={dailyActivityData.map((d) => ({
                      name: d.dateLabel,
                      value: d.count,
                      label: format(d.date, 'dd/MM/yyyy', { locale: es }),
                    }))}
                    height={200}
                    showGrid={true}
                    smooth={true}
                    showDots={true}
                    onPointTap={(data, index) => {
                      toast({
                        title: data.label || data.name,
                        description: `${data.value} actividad${data.value !== 1 ? 'es' : ''}`,
                        duration: 2000,
                      })
                    }}
                  />
                </CardContent>
              </Card>

              {/* Heat Map de Actividad */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5" />
                    Calendario de actividad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MobileHeatMap
                    data={dailyActivityData.map((d) => ({
                      date: d.date,
                      value: d.count,
                      label: `${d.count} actividad${d.count !== 1 ? 'es' : ''}`,
                    }))}
                    startDate={periodData.start}
                    endDate={periodData.end}
                    onCellTap={(data) => {
                      toast({
                        title: format(data.date, 'dd/MM/yyyy', { locale: es }),
                        description: data.label || `${data.value} actividad${data.value !== 1 ? 'es' : ''}`,
                        duration: 2000,
                      })
                    }}
                  />
                </CardContent>
              </Card>

              {/* Insights Automáticos */}
              {insights.length > 0 && (
                <InsightsCarousel
                  insights={insights}
                  onDismiss={(insightId) => {
                    insightsEngine.markAsSeen(insightId)
                    setInsights((prev) => prev.filter((i) => i.id !== insightId))
                  }}
                  onAction={(insight) => {
                    if (insight.action?.label === 'Ver tareas') {
                      navigate('/mobile/assignments')
                    } else if (insight.action?.label === 'Ver tarea') {
                      // TODO: navegar a tarea específica
                      toast({
                        title: 'Navegando a tarea',
                        description: 'Funcionalidad en desarrollo',
                      })
                    } else if (insight.action?.label === 'Sincronizar' || insight.action?.label === 'Sincronizar ahora') {
                      // TODO: trigger sync
                      toast({
                        title: 'Sincronizando...',
                        description: 'Los datos se están sincronizando',
                      })
                    }
                  }}
                  maxVisible={5}
                />
              )}

              {/* Logros y Badges */}
              {achievements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="h-5 w-5" />
                      Logros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {achievements.map((achievement) => (
                        <AchievementBadge key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Acciones de Exportar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Download className="h-5 w-5" />
                    Exportar y compartir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => setIsExportOpen(true)}
                    className="w-full gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exportar reporte
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Empty State */}
          {!isLoading && !error && periodAssignments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">No hay datos para este período</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Completa tareas para ver tus reportes aquí
                </p>
                <Button onClick={() => navigate('/mobile/assignments')}>
                  Ver tareas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters Modal */}
        <FilterSystem
          filters={filterConfigs}
          values={filterValues}
          onChange={setFilterValues}
          onApply={() => setIsFiltersOpen(false)}
          onReset={() => setFilterValues({})}
          open={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          storageKey="personal-reports-filters"
          persistInUrl={true}
        />

        {/* Export Sheet */}
        <ExportSheet
          open={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          title="Exportar Reporte Personal"
          data={exportData}
          element={exportContentRef.current}
          metadata={exportMetadata}
          dateRange={periodData}
        />
      </div>
    </RefreshContainer>
  )
}

export default PersonalReports

