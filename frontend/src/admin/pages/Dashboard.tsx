import { useState, useEffect, useMemo } from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  FileCheck,
  FileSpreadsheet,
  Percent,
  Users,
  Play,
  Database,
  LayoutDashboard,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Calendar as CalendarComponent } from '@/shared/components/ui/calendar'
import { Label } from '@/shared/components/ui/label'
import { useToast } from '@/shared/components/ui/use-toast'
import KPICard from '@/admin/components/dashboard/KPICard'
import { LineChartCard, BarChartCard } from '@/admin/components/dashboard/Charts'
import ActivityTable from '@/admin/components/dashboard/ActivityTable'
import PendingAssignments from '@/admin/components/dashboard/PendingAssignments'
import EPPStats from '@/admin/components/dashboard/EPPStats'
import { usePermission } from '@/shared/hooks/usePermission'
import { useAuth } from '@/shared/hooks/useAuth'
import { Permission } from '@/shared/types/permissions'
import useDashboard, {
  type ActivityItem,
  type FormsCompletedSeries,
  type FormsByTypeData,
} from '@/shared/hooks/useDashboard'
import { cn } from '@/shared/lib/utils'
import PageLoader from '@/shared/components/common/PageLoader'

// Datos mock para demostración
const MOCK_KPI_CARDS = [
  {
    id: 'active-forms',
    title: 'Formularios Activos',
    value: '128',
    change: 8.4,
    helper: 'vs semana anterior',
    icon: FileSpreadsheet,
  },
  {
    id: 'completed-forms',
    title: 'Formularios Completados',
    value: '342',
    change: 12.5,
    helper: 'Hoy / Semana',
    icon: FileCheck,
  },
  {
    id: 'active-users',
    title: 'Usuarios Activos',
    value: '57',
    change: -3.1,
    helper: 'vs mes anterior',
    icon: Users,
  },
  {
    id: 'completion-rate',
    title: 'Tasa de Completitud',
    value: '92%',
    change: 4.6,
    helper: 'vs objetivo mensual',
    icon: Percent,
  },
]

const MOCK_FORMS_COMPLETION_BY_DAY: FormsCompletedSeries[] = [
  { day: 'Lun', date: '', completados: 42 },
  { day: 'Mar', date: '', completados: 38 },
  { day: 'Mié', date: '', completados: 44 },
  { day: 'Jue', date: '', completados: 51 },
  { day: 'Vie', date: '', completados: 58 },
  { day: 'Sáb', date: '', completados: 47 },
  { day: 'Dom', date: '', completados: 33 },
]

const MOCK_FORMS_BY_TYPE: FormsByTypeData[] = [
  { type: 'Seguridad', cantidad: 56 },
  { type: 'Calidad', cantidad: 32 },
  { type: 'Avance', cantidad: 68 },
  { type: 'Logística', cantidad: 24 },
  { type: 'Ambiental', cantidad: 19 },
]

const MOCK_RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    user: 'Carla Alarcón',
    action: 'Completó formulario',
    module: 'Formularios',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    status: 'success',
  },
  {
    id: '2',
    user: 'Rafael Abello',
    action: 'Actualizó usuario',
    module: 'Usuarios',
    timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    status: 'success',
  },
  {
    id: '3',
    user: 'Renato Parra',
    action: 'Reportó incidente',
    module: 'Incidentes',
    timestamp: new Date(Date.now() - 39 * 60 * 1000).toISOString(),
    status: 'warning',
  },
  {
    id: '4',
    user: 'Elías Ruiz',
    action: 'Programó formulario',
    module: 'Formularios',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'success',
  },
  {
    id: '5',
    user: 'Paula Lagos',
    action: 'Rechazó formulario',
    module: 'Formularios',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'error',
  },
  {
    id: '6',
    user: 'Cristian Jara',
    action: 'Importó planillas',
    module: 'Usuarios',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'success',
  },
  {
    id: '7',
    user: 'Valentina Ríos',
    action: 'Comentó formulario',
    module: 'Formularios',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'success',
  },
  {
    id: '8',
    user: 'Jorge Muñoz',
    action: 'Completó formulario',
    module: 'Formularios',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'success',
  },
  {
    id: '9',
    user: 'Nicole Díaz',
    action: 'Editó configuración',
    module: 'Configuración',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'warning',
  },
  {
    id: '10',
    user: 'Marcelo Gómez',
    action: 'Eliminó formulario',
    module: 'Formularios',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'warning',
  },
]

const Dashboard = () => {
  const { toast } = useToast()
  const { hasPermission, permissions } = usePermission()
  const { user } = useAuth()
  const hasMobileAccess = hasPermission(Permission.ACCESS_MOBILE_APP)
  const hasAdminAccess = hasPermission(Permission.ACCESS_ADMIN_PANEL)

  // Debug: Log de permisos y acceso
  useEffect(() => {
    console.log('[Dashboard] Estado de permisos:', {
      hasUser: !!user,
      permissionsCount: permissions?.length || 0,
      hasAdminAccess,
      hasMobileAccess,
      permissions: permissions?.slice(0, 10), // Primeros 10
      userRole: user?.role,
    })
  }, [user, permissions, hasAdminAccess, hasMobileAccess])

  // Estado para usar datos mock
  const [useMockData, setUseMockData] = useState(() => {
    const stored = localStorage.getItem('dashboard-use-mock-data')
    return stored ? JSON.parse(stored) : false
  })

  // Estado para rango de fechas
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfDay(subDays(new Date(), 7)),
    to: endOfDay(new Date()),
  })
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Hook para datos reales
  const {
    kpis,
    formsCompletedSeries,
    formsByType,
    topForms,
    recentActivity,
    loading,
    error,
    fetchAll,
    startAutoRefresh,
    stopAutoRefresh,
  } = useDashboard()

  // Cargar datos al montar y cuando cambia el rango de fechas
  useEffect(() => {
    if (hasAdminAccess && !useMockData) {
      void fetchAll({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      })
    }
  }, [hasAdminAccess, useMockData, dateRange, fetchAll])

  // Si hay errores persistentes y no estamos usando mock, sugerir activarlo
  useEffect(() => {
    if (error && !useMockData && hasAdminAccess && !loading) {
      // Esperar un poco antes de sugerir mock (por si es un error temporal)
      const timer = setTimeout(() => {
        toast({
          title: 'Problema de conexión',
          description:
            'No se pudo conectar a la base de datos. ¿Quieres activar el modo demostración para ver el dashboard?',
          variant: 'destructive',
          duration: 10000,
        })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, useMockData, hasAdminAccess, loading, toast])

  // Iniciar auto-refresh cada 30 segundos (solo si no estamos usando mock)
  useEffect(() => {
    if (hasAdminAccess && !useMockData) {
      startAutoRefresh(30000)
      return () => {
        stopAutoRefresh()
      }
    }
  }, [hasAdminAccess, useMockData, startAutoRefresh, stopAutoRefresh])

  // Toggle para usar datos mock
  const toggleMockData = () => {
    const newValue = !useMockData
    setUseMockData(newValue)
    localStorage.setItem('dashboard-use-mock-data', JSON.stringify(newValue))

    if (newValue) {
      stopAutoRefresh()
      toast({
        title: 'Modo demostración activado',
        description: 'Estás viendo datos mock para demostración.',
      })
    } else {
      startAutoRefresh(30000)
      void fetchAll({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      })
      toast({
        title: 'Modo datos reales activado',
        description: 'Estás viendo datos reales del sistema.',
      })
    }
  }

  // Seleccionar datos a mostrar (mock o reales)
  const displayKPIs = useMemo(() => {
    if (useMockData) {
      return MOCK_KPI_CARDS
    }

    if (!kpis) {
      return null
    }

    return [
      {
        id: 'active-forms',
        title: 'Formularios Activos',
        value: kpis.totalActiveForms.value,
        change: kpis.totalActiveForms.change,
        helper: 'vs semana anterior',
        icon: FileSpreadsheet,
      },
      {
        id: 'completed-forms',
        title: 'Formularios Completados',
        value: `${kpis.formsCompletedToday.value} / ${kpis.formsCompletedThisWeek.value}`,
        change: kpis.formsCompletedThisWeek.change,
        helper: 'Hoy / Semana',
        icon: FileCheck,
      },
      {
        id: 'active-users',
        title: 'Usuarios Activos',
        value: kpis.activeUsers.value,
        change: kpis.activeUsers.change,
        helper: 'vs mes anterior',
        icon: Users,
      },
      {
        id: 'completion-rate',
        title: 'Tasa de Completitud',
        value: `${kpis.completionRate.value}%`,
        change: kpis.completionRate.change,
        helper: 'vs objetivo mensual',
        icon: Percent,
      },
    ]
  }, [useMockData, kpis])

  const displayFormsCompleted = useMemo(() => {
    if (useMockData) {
      return MOCK_FORMS_COMPLETION_BY_DAY
    }
    return formsCompletedSeries.length > 0 ? formsCompletedSeries : []
  }, [useMockData, formsCompletedSeries])

  const displayFormsByType = useMemo(() => {
    if (useMockData) {
      return MOCK_FORMS_BY_TYPE
    }
    return topForms.length > 0 ? topForms : formsByType
  }, [useMockData, topForms, formsByType])

  const displayRecentActivity = useMemo(() => {
    if (useMockData) {
      return MOCK_RECENT_ACTIVITY
    }
    return recentActivity.length > 0 ? recentActivity : []
  }, [useMockData, recentActivity])

  // Formatear rango de fechas para mostrar
  const dateRangeText = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return 'Seleccionar rango'
    return `${format(dateRange.from, 'dd MMM', { locale: es })} - ${format(dateRange.to, 'dd MMM', { locale: es })}`
  }, [dateRange])

  // Mostrar loader inicial solo si está cargando y no hay datos (con timeout)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  
  useEffect(() => {
    if (loading && !useMockData && hasAdminAccess && !displayKPIs) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true)
      }, 5000) // Mostrar mensaje después de 5 segundos
      return () => clearTimeout(timer)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading, useMockData, hasAdminAccess, displayKPIs])

  // Si está cargando por mucho tiempo, mostrar mensaje de error en lugar de loader infinito
  if (loading && !useMockData && hasAdminAccess && !displayKPIs && loadingTimeout) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {hasMobileAccess
                ? 'Visualiza tus formularios asignados y completa tus tareas pendientes.'
                : 'Visualiza el estado general de los formularios y la actividad reciente de Amaranto.'}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <Database className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold text-destructive">Problema de conexión</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            No se pudo conectar a la base de datos. El servidor de base de datos puede estar inactivo o no disponible.
          </p>
          <Button onClick={toggleMockData} variant="default" className="gap-2">
            <Database className="h-4 w-4" />
            Activar Modo Demostración
          </Button>
        </div>
      </div>
    )
  }

  // Mostrar loader normal si está cargando sin timeout
  if (loading && !useMockData && hasAdminAccess && !displayKPIs && !loadingTimeout) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {hasMobileAccess
                ? 'Visualiza tus formularios asignados y completa tus tareas pendientes.'
                : 'Visualiza el estado general de los formularios y la actividad reciente de Amaranto.'}
            </p>
          </div>
        </div>
        <PageLoader
          message="Cargando dashboard..."
          icon={<LayoutDashboard className="h-12 w-12 text-primary" />}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con controles */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {hasMobileAccess
              ? 'Visualiza tus formularios asignados y completa tus tareas pendientes.'
              : 'Visualiza el estado general de los formularios y la actividad reciente de Amaranto.'}
          </p>
        </div>
        {hasAdminAccess && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de rango de fechas */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'gap-2',
                    !dateRange.from && 'text-muted-foreground',
                    !useMockData && 'pointer-events-auto',
                    useMockData && 'pointer-events-none opacity-50',
                  )}
                  disabled={useMockData}
                >
                  <Calendar className="h-4 w-4" />
                  {dateRangeText}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Desde</Label>
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => {
                        if (date) {
                          setDateRange((prev) => ({ ...prev, from: startOfDay(date) }))
                        }
                      }}
                      initialFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hasta</Label>
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => {
                        if (date) {
                          setDateRange((prev) => ({ ...prev, to: endOfDay(date) }))
                          setDatePickerOpen(false)
                        }
                      }}
                      disabled={(date) => date < (dateRange.from || new Date())}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Toggle para datos mock */}
            <Button
              variant={useMockData ? 'default' : 'outline'}
              className={cn(
                'gap-2 transition-all duration-300',
                useMockData &&
                  'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/50',
              )}
              onClick={toggleMockData}
              title={
                useMockData
                  ? 'Activar datos reales'
                  : 'Activar datos mock para demostración'
              }
            >
              {useMockData ? (
                <>
                  <Database className="h-4 w-4 animate-pulse" />
                  <span className="hidden sm:inline">Modo Demo</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Datos Reales</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Mensaje de error mejorado */}
      {error && !useMockData && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-destructive">Error de conexión</h3>
              <p className="text-sm text-destructive/80">{error}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                La base de datos puede estar inactiva o no disponible. Activa el modo demostración para ver el dashboard con datos de ejemplo.
              </p>
            </div>
            <Button onClick={toggleMockData} variant="outline" size="sm" className="shrink-0">
              <Database className="mr-2 h-4 w-4" />
              Activar Demo
            </Button>
          </div>
        </div>
      )}

      {/* Formularios asignados (solo para operadores y supervisores) - Prioridad alta */}
      {hasMobileAccess && <PendingAssignments />}

      {/* Mensaje si no tiene acceso a ningún dashboard */}
      {!hasAdminAccess && !hasMobileAccess && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-8 text-center">
          <LayoutDashboard className="mx-auto mb-4 h-12 w-12 text-yellow-600" />
          <h3 className="mb-2 text-lg font-semibold">Sin acceso al dashboard</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            No tienes permisos para acceder al panel administrativo ni a la aplicación móvil.
          </p>
          <p className="text-xs text-muted-foreground">
            Permisos disponibles: {permissions?.length || 0}
            {permissions && permissions.length > 0 && (
              <span className="ml-2">({permissions.slice(0, 3).join(', ')}...)</span>
            )}
          </p>
        </div>
      )}

      {/* KPIs y gráficos (solo para ADMIN y MANAGER) */}
      {hasAdminAccess && (
        <>
          {/* Grid de KPIs */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {loading && !useMockData && !displayKPIs
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-3 rounded-lg border p-6">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))
              : displayKPIs?.map(({ id, title, value, change, helper, icon: Icon }) => (
                  <KPICard
                    key={id}
                    title={title}
                    value={value}
                    change={change}
                    trend={change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}
                    helperText={helper}
                    icon={<Icon className="h-5 w-5" />}
                  />
                ))}
          </div>

          {/* Gráficos principales */}
          <div className="grid gap-4 xl:grid-cols-2">
            {loading && !useMockData && displayFormsCompleted.length === 0 ? (
              <>
                <div className="space-y-4 rounded-lg border p-6">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-72 w-full" />
                </div>
                <div className="space-y-4 rounded-lg border p-6">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-72 w-full" />
                </div>
              </>
            ) : (
              <>
                <LineChartCard
                  title="Formularios completados"
                  description={`Seguimiento diario de formularios completados (${dateRangeText}).`}
                  data={displayFormsCompleted as unknown as Record<string, unknown>[]}
                  dataKeys={['day', 'completados']}
                />

                <BarChartCard
                  title="Formularios más usados"
                  description="Distribución de formularios más utilizados en el sistema."
                  data={displayFormsByType as unknown as Record<string, unknown>[]}
                  dataKeys={['type', 'cantidad']}
                />
              </>
            )}
          </div>

          {/* Estadísticas EPP */}
          <EPPStats useMockData={useMockData} />

          {/* Actividad reciente */}
          {loading && !useMockData && displayRecentActivity.length === 0 ? (
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <ActivityTable activities={displayRecentActivity} />
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
