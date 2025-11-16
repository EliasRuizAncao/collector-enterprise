/**
 * ReportsDashboard - Dashboard simplificado para mobile
 * Versión compacta enfocada en métricas esenciales
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, subDays, startOfDay, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import { MobileBarChart, type MobileBarChartData } from '../components/charts'
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Flame,
  BarChart3,
  Download,
  Share2,
  Target,
  RefreshCw,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  Calendar,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import RefreshContainer from '../components/RefreshContainer'
import { SkeletonCard } from '../components/animated'
import { useOfflineAssignments } from '../hooks/useOfflineAssignments'
import api from '@/shared/lib/api'
import { useToast } from '@/shared/components/ui/use-toast'

/**
 * Tipo para estadísticas del dashboard
 */
interface DashboardStats {
  completedToday: number
  pending: number
  completionRate: number
  currentStreak: number
  lastSync?: Date
  hasPendingChanges: boolean
}

/**
 * Tipo para datos del gráfico (últimos 7 días)
 */
interface ChartDataPoint {
  date: Date
  dateLabel: string
  count: number
}

/**
 * Tipo para insight rápido
 */
interface QuickInsight {
  id: string
  type: 'improvement' | 'milestone' | 'streak' | 'motivation'
  message: string
  icon: React.ReactNode
  color: string
}

/**
 * Componente Stats Card
 */
const StatsCard = ({
  value,
  label,
  icon,
  color,
  onTap,
}: {
  value: number | string
  label: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  onTap?: () => void
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    orange: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
    purple: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
  }

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }

  return (
    <Card
      className={cn(
        'mobile-card touch-manipulation transition-all active:scale-[0.98]',
        colorClasses[color],
        onTap && 'cursor-pointer hover:shadow-md',
      )}
      onClick={onTap}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className={cn('opacity-60', iconColorClasses[color])}>{icon}</div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}


/**
 * Componente Quick Insight Card
 */
const QuickInsightCard = ({ insight }: { insight: QuickInsight }) => {
  return (
    <Card className="mobile-card min-w-[280px] border-l-4" style={{ borderLeftColor: insight.color }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5" style={{ color: insight.color }}>
            {insight.icon}
          </div>
          <p className="text-sm font-medium flex-1">{insight.message}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Componente ReportsDashboard
 */
const ReportsDashboard = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { assignments, isOnline, syncStatus, pendingChanges } = useOfflineAssignments()

  const [stats, setStats] = useState<DashboardStats>({
    completedToday: 0,
    pending: 0,
    completionRate: 0,
    currentStreak: 0,
    hasPendingChanges: false,
  })
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [insights, setInsights] = useState<QuickInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Calcular estadísticas
  const calculateStats = useCallback(() => {
    const today = startOfDay(new Date())
    const completedToday = assignments.filter(
      (a) => a.status === 'completed' && a.completedAt && startOfDay(new Date(a.completedAt)) >= today,
    ).length

    const pending = assignments.filter((a) => a.status === 'pending' || a.status === 'in_progress').length

    const total = assignments.length
    const completed = assignments.filter((a) => a.status === 'completed').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Calcular racha actual (días consecutivos con al menos una tarea completada)
    let streak = 0
    const todayStart = startOfDay(new Date())
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(todayStart, i)
      const hasCompleted = assignments.some(
        (a) =>
          a.status === 'completed' &&
          a.completedAt &&
          startOfDay(new Date(a.completedAt)).getTime() === checkDate.getTime(),
      )
      if (hasCompleted) {
        streak++
      } else if (i > 0) {
        // Solo romper la racha si no es hoy (puede que aún no haya completado hoy)
        break
      }
    }

    setStats({
      completedToday,
      pending,
      completionRate,
      currentStreak: streak,
      hasPendingChanges: pendingChanges > 0,
    })
  }, [assignments, pendingChanges])

  // Calcular datos del gráfico (últimos 7 días)
  const calculateChartData = useCallback(() => {
    const data: ChartDataPoint[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const dateStart = startOfDay(date)

      const count = assignments.filter(
        (a) =>
          a.status === 'completed' &&
          a.completedAt &&
          startOfDay(new Date(a.completedAt)).getTime() === dateStart.getTime(),
      ).length

      let dateLabel: string
      if (isToday(date)) {
        dateLabel = 'Hoy'
      } else if (isYesterday(date)) {
        dateLabel = 'Ayer'
      } else {
        dateLabel = format(date, 'EEE', { locale: es })
      }

      data.push({
        date,
        dateLabel,
        count,
      })
    }

    setChartData(data)
  }, [assignments])

  // Calcular insights
  const calculateInsights = useCallback(() => {
    const newInsights: QuickInsight[] = []

    // Comparar con semana pasada
    const lastWeekStart = subDays(startOfDay(new Date()), 7)
    const thisWeekStart = subDays(startOfDay(new Date()), 0)
    const lastWeekCompleted = assignments.filter(
      (a) =>
        a.status === 'completed' &&
        a.completedAt &&
        new Date(a.completedAt) >= lastWeekStart &&
        new Date(a.completedAt) < thisWeekStart,
    ).length
    const thisWeekCompleted = assignments.filter(
      (a) =>
        a.status === 'completed' &&
        a.completedAt &&
        new Date(a.completedAt) >= thisWeekStart,
    ).length

    if (lastWeekCompleted > 0 && thisWeekCompleted > lastWeekCompleted) {
      const improvement = Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
      newInsights.push({
        id: 'improvement',
        type: 'improvement',
        message: `Vas ${improvement}% mejor que la semana pasada`,
        icon: <TrendingUp className="h-5 w-5" />,
        color: '#10b981',
      })
    }

    // Racha
    if (stats.currentStreak > 0) {
      newInsights.push({
        id: 'streak',
        type: 'streak',
        message: `¡Racha de ${stats.currentStreak} día${stats.currentStreak !== 1 ? 's' : ''}!`,
        icon: <Flame className="h-5 w-5" />,
        color: '#f59e0b',
      })
    }

    // Récord personal (simulado)
    const maxDaily = Math.max(...chartData.map((d) => d.count), 0)
    const todayCount = chartData[chartData.length - 1]?.count || 0
    if (maxDaily > 0 && todayCount > 0 && todayCount < maxDaily) {
      const remaining = maxDaily - todayCount
      newInsights.push({
        id: 'milestone',
        type: 'milestone',
        message: `Completa ${remaining} más para tu récord`,
        icon: <Target className="h-5 w-5" />,
        color: '#3b82f6',
      })
    }

    // Motivación general
    if (newInsights.length === 0) {
      newInsights.push({
        id: 'motivation',
        type: 'motivation',
        message: '¡Sigue así! Cada tarea cuenta',
        icon: <Sparkles className="h-5 w-5" />,
        color: '#8b5cf6',
      })
    }

    setInsights(newInsights)
  }, [stats.currentStreak, chartData])

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Calcular estadísticas locales
      calculateStats()
      calculateChartData()

      // Intentar obtener datos del servidor
      try {
        const response = await api.get('/dashboard/stats')
        const serverStats = response.data

        // Combinar con datos locales
        setStats((prev) => ({
          ...prev,
          ...serverStats,
        }))

        if (serverStats.lastSync) {
          setLastSync(new Date(serverStats.lastSync))
        }
      } catch (err) {
        // Si falla, usar solo datos locales
        console.warn('No se pudieron cargar estadísticas del servidor, usando datos locales')
      }
    } catch (err: any) {
      console.error('Error al cargar datos del dashboard:', err)
      setError('No se pudieron cargar las estadísticas')
    } finally {
      setIsLoading(false)
    }
  }, [calculateStats, calculateChartData])

  // Efecto inicial
  useEffect(() => {
    void loadData()
  }, [loadData])

  // Recalcular cuando cambian las asignaciones
  useEffect(() => {
    if (!isLoading) {
      calculateStats()
      calculateChartData()
    }
  }, [assignments, isLoading, calculateStats, calculateChartData])

  // Recalcular insights cuando cambian las stats
  useEffect(() => {
    if (!isLoading && chartData.length > 0) {
      calculateInsights()
    }
  }, [stats, chartData, isLoading, calculateInsights])

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await loadData()
    toast({
      title: 'Datos actualizados',
      description: 'Las estadísticas se han actualizado',
      duration: 2000,
    })
  }, [loadData, toast])

  // Handlers
  const handleStatCardTap = useCallback(
    (type: 'completed' | 'pending' | 'rate' | 'streak') => {
      switch (type) {
        case 'completed':
          navigate('/mobile/assignments?filter=completed')
          break
        case 'pending':
          navigate('/mobile/assignments?filter=pending')
          break
        case 'rate':
        case 'streak':
          // Navegar a reportes completos
          navigate('/mobile/reports')
          break
      }
    },
    [navigate],
  )

  const handleBarTap = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      navigate(`/mobile/reports?date=${dateStr}`)
    },
    [navigate],
  )

  const handleQuickAccess = useCallback(
    (action: 'reports' | 'export' | 'share' | 'goals') => {
      switch (action) {
        case 'reports':
          navigate('/mobile/reports')
          break
        case 'export':
          toast({
            title: 'Exportar datos',
            description: 'Funcionalidad en desarrollo',
          })
          break
        case 'share':
          toast({
            title: 'Compartir progreso',
            description: 'Funcionalidad en desarrollo',
          })
          break
        case 'goals':
          navigate('/mobile/settings')
          break
      }
    },
    [navigate, toast],
  )

  // Formatear última sincronización
  const lastSyncFormatted = useMemo(() => {
    if (!lastSync) return 'Nunca'
    const now = new Date()
    const diffMs = now.getTime() - lastSync.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours} h`
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
  }, [lastSync])

  return (
    <RefreshContainer onRefresh={handleRefresh} disabled={isLoading}>
      <div className="flex min-h-screen flex-col pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
          <h1 className="flex-1 text-xl font-bold">Dashboard</h1>
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

        {/* Contenido */}
        <div className="flex-1 space-y-4 p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} className="h-24" />
                ))}
              </div>
              <SkeletonCard className="h-48" />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="border-destructive">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
                <h3 className="text-lg font-semibold mb-2">Error al cargar datos</h3>
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
              {/* Stats Cards Grid 2x2 */}
              <div className="grid grid-cols-2 gap-3">
                <StatsCard
                  value={stats.completedToday}
                  label="Completadas hoy"
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  color="green"
                  onTap={() => handleStatCardTap('completed')}
                />
                <StatsCard
                  value={stats.pending}
                  label="Pendientes"
                  icon={<Clock className="h-6 w-6" />}
                  color="orange"
                  onTap={() => handleStatCardTap('pending')}
                />
                <StatsCard
                  value={`${stats.completionRate}%`}
                  label="Tasa de cumplimiento"
                  icon={<TrendingUp className="h-6 w-6" />}
                  color="blue"
                  onTap={() => handleStatCardTap('rate')}
                />
                <StatsCard
                  value={stats.currentStreak}
                  label="Racha actual"
                  icon={<Flame className="h-6 w-6" />}
                  color="red"
                  onTap={() => handleStatCardTap('streak')}
                />
              </div>

              {/* Gráfico Principal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5" />
                    Actividad reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart data={chartData} onBarTap={handleBarTap} />
                </CardContent>
              </Card>

              {/* Insights Rápidos */}
              {insights.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 px-1">Insights</h3>
                  <div className="flex gap-3 overflow-x-auto overscroll-contain scrollbar-hide pb-2">
                    {insights.map((insight) => (
                      <QuickInsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                </div>
              )}

              {/* Accesos Rápidos */}
              <div>
                <h3 className="text-sm font-semibold mb-3 px-1">Accesos rápidos</h3>
                <div className="flex gap-2 overflow-x-auto overscroll-contain scrollbar-hide pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/mobile/reports/personal')}
                    className="gap-2 whitespace-nowrap"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Mis reportes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAccess('reports')}
                    className="gap-2 whitespace-nowrap"
                  >
                    <FileText className="h-4 w-4" />
                    Ver reportes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAccess('export')}
                    className="gap-2 whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" />
                    Exportar datos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAccess('share')}
                    className="gap-2 whitespace-nowrap"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAccess('goals')}
                    className="gap-2 whitespace-nowrap"
                  >
                    <Target className="h-4 w-4" />
                    Metas
                  </Button>
                </div>
              </div>

              {/* Última Sincronización */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Última sync: {lastSyncFormatted}</span>
                  {stats.hasPendingChanges && (
                    <Badge variant="outline" className="text-xs">
                      Pendiente
                    </Badge>
                  )}
                </div>
                {!isOnline && (
                  <Badge variant="secondary" className="text-xs">
                    Offline
                  </Badge>
                )}
              </div>
            </>
          )}

          {/* Empty State */}
          {!isLoading && !error && assignments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">¡Comienza a trabajar!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Completa tareas para ver tus estadísticas aquí
                </p>
                <Button onClick={() => navigate('/mobile/assignments')}>
                  Ver tareas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RefreshContainer>
  )
}

export default ReportsDashboard

