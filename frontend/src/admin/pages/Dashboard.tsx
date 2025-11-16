import { BarChart3, Calendar, FileCheck, FileSpreadsheet, Percent, Users } from 'lucide-react'
import { subHours, subMinutes } from 'date-fns'

import { Button } from '@/shared/components/ui/button'
import KPICard from '@/admin/components/dashboard/KPICard'
import { LineChartCard, BarChartCard } from '@/admin/components/dashboard/Charts'
import ActivityTable from '@/admin/components/dashboard/ActivityTable'
import PendingAssignments from '@/admin/components/dashboard/PendingAssignments'
import { useAuthStore } from '@/shared/store/authStore'

type KpiCard = {
  id: string
  title: string
  value: string | number
  change: number
  helper: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

type ActivityItem = {
  id: string
  user: string
  action: string
  module: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

const kpiCards: KpiCard[] = [
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

const formsCompletionByDay = [
  { day: 'Lun', completados: 42 },
  { day: 'Mar', completados: 38 },
  { day: 'Mié', completados: 44 },
  { day: 'Jue', completados: 51 },
  { day: 'Vie', completados: 58 },
  { day: 'Sáb', completados: 47 },
  { day: 'Dom', completados: 33 },
]

const formsByType = [
  { type: 'Seguridad', cantidad: 56 },
  { type: 'Calidad', cantidad: 32 },
  { type: 'Avance', cantidad: 68 },
  { type: 'Logística', cantidad: 24 },
  { type: 'Ambiental', cantidad: 19 },
]

const recentActivity: ActivityItem[] = [
  {
    id: '1',
    user: 'Carla Alarcón',
    action: 'Completó formulario',
    module: 'Formularios',
    timestamp: subMinutes(new Date(), 12).toISOString(),
    status: 'success',
  },
  {
    id: '2',
    user: 'Rafael Abello',
    action: 'Actualizó usuario',
    module: 'Usuarios',
    timestamp: subMinutes(new Date(), 24).toISOString(),
    status: 'success',
  },
  {
    id: '3',
    user: 'Renato Parra',
    action: 'Reportó incidente',
    module: 'Incidentes',
    timestamp: subMinutes(new Date(), 39).toISOString(),
    status: 'warning',
  },
  {
    id: '4',
    user: 'Elías Ruiz',
    action: 'Programó formulario',
    module: 'Formularios',
    timestamp: subHours(new Date(), 1).toISOString(),
    status: 'success',
  },
  {
    id: '5',
    user: 'Paula Lagos',
    action: 'Rechazó formulario',
    module: 'Formularios',
    timestamp: subHours(new Date(), 1).toISOString(),
    status: 'error',
  },
  {
    id: '6',
    user: 'Cristian Jara',
    action: 'Importó planillas',
    module: 'Usuarios',
    timestamp: subHours(new Date(), 2).toISOString(),
    status: 'success',
  },
  {
    id: '7',
    user: 'Valentina Ríos',
    action: 'Comentó formulario',
    module: 'Formularios',
    timestamp: subHours(new Date(), 3).toISOString(),
    status: 'success',
  },
  {
    id: '8',
    user: 'Jorge Muñoz',
    action: 'Completó formulario',
    module: 'Formularios',
    timestamp: subHours(new Date(), 4).toISOString(),
    status: 'success',
  },
  {
    id: '9',
    user: 'Nicole Díaz',
    action: 'Editó configuración',
    module: 'Configuración',
    timestamp: subHours(new Date(), 4).toISOString(),
    status: 'warning',
  },
  {
    id: '10',
    user: 'Marcelo Gómez',
    action: 'Eliminó formulario',
    module: 'Formularios',
    timestamp: subHours(new Date(), 5).toISOString(),
    status: 'warning',
  },
]

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  const isOperator = user?.role === 'OPERATOR' || user?.role === 'SUPERVISOR'
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  return (
    <div className="space-y-6">
      {/* Encabezado con controles */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {isOperator
              ? 'Visualiza tus formularios asignados y completa tus tareas pendientes.'
              : 'Visualiza el estado general de los formularios y la actividad reciente de Amaranto.'}
          </p>
        </div>
        {isAdminOrManager && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Rango: Últimos 7 días
            </Button>
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Comparar periodos
            </Button>
          </div>
        )}
      </div>

      {/* Formularios asignados (solo para operadores y supervisores) - Prioridad alta */}
      {isOperator && <PendingAssignments />}

      {/* KPIs y gráficos (solo para ADMIN y MANAGER) */}
      {isAdminOrManager && (
        <>
          {/* Grid de KPIs */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map(({ id, title, value, change, helper, icon: Icon }) => (
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
            <LineChartCard
              title="Formularios completados últimos 7 días"
              description="Seguimiento diario de formularios completados en todas las obras activas."
              data={formsCompletionByDay}
              dataKeys={['day', 'completados']}
            />

            <BarChartCard
              title="Formularios por tipo"
              description="Distribución de formularios activos según el tipo y la operación asociada."
              data={formsByType}
              dataKeys={['type', 'cantidad']}
            />
          </div>

          {/* Actividad reciente */}
          <ActivityTable activities={recentActivity} />
        </>
      )}
    </div>
  )
}

export default Dashboard
