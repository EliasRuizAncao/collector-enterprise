import { useState, useMemo, useEffect } from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  Printer,
  BarChart3,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Calendar as CalendarComponent } from '@/shared/components/ui/calendar'
import { Label } from '@/shared/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { useToast } from '@/shared/components/ui/use-toast'
import { cn } from '@/shared/lib/utils'
import useReports, {
  type CompletionReportData,
  type UserPerformanceData,
  type FormAnalyticsData,
  type ReportFilters,
} from '@/shared/hooks/useReports'
import useForms from '@/shared/hooks/useForms'
import useUsers from '@/shared/hooks/useUsers'
import { AreaChartCard, ComposedChartCard, PieChartCard } from '@/admin/components/reports/AdvancedCharts'
import LoadingOverlay from '@/shared/components/common/LoadingOverlay'
import PageLoader from '@/shared/components/common/PageLoader'
import { Switch } from '@/shared/components/ui/switch'
import { Database, Play } from 'lucide-react'

/**
 * Tipos de reporte disponibles
 */
type ReportType =
  | 'completion-by-user' // Formularios completados por usuario
  | 'completion-by-period' // Formularios por periodo
  | 'form-summary' // Resumen de obra (por formulario)
  | 'compliance' // Reporte de cumplimiento
  | 'user-performance' // Rendimiento de usuarios

// Datos mock para demostración
const MOCK_COMPLETION_DATA: CompletionReportData[] = [
  {
    userId: '1',
    userName: 'Carla Alarcón',
    userEmail: 'carla.alarcon@amaranto.cl',
    formId: 'f1',
    formTitle: 'Inspección de Seguridad',
    totalResponses: 45,
    assignedCount: 50,
    completedCount: 45,
    completionRate: 90.0,
    firstResponse: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    userId: '2',
    userName: 'Roberto Méndez',
    userEmail: 'roberto.mendez@amaranto.cl',
    formId: 'f1',
    formTitle: 'Inspección de Seguridad',
    totalResponses: 38,
    assignedCount: 40,
    completedCount: 38,
    completionRate: 95.0,
    firstResponse: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    userId: '1',
    userName: 'Carla Alarcón',
    userEmail: 'carla.alarcon@amaranto.cl',
    formId: 'f2',
    formTitle: 'Control de Calidad',
    totalResponses: 32,
    assignedCount: 35,
    completedCount: 32,
    completionRate: 91.4,
    firstResponse: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    userId: '3',
    userName: 'María González',
    userEmail: 'maria.gonzalez@amaranto.cl',
    formId: 'f2',
    formTitle: 'Control de Calidad',
    totalResponses: 28,
    assignedCount: 30,
    completedCount: 28,
    completionRate: 93.3,
    firstResponse: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    userId: '4',
    userName: 'Juan Pérez',
    userEmail: 'juan.perez@amaranto.cl',
    formId: 'f3',
    formTitle: 'Avance de Obra',
    totalResponses: 52,
    assignedCount: 55,
    completedCount: 52,
    completionRate: 94.5,
    firstResponse: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    userId: '2',
    userName: 'Roberto Méndez',
    userEmail: 'roberto.mendez@amaranto.cl',
    formId: 'f3',
    formTitle: 'Avance de Obra',
    totalResponses: 41,
    assignedCount: 45,
    completedCount: 41,
    completionRate: 91.1,
    firstResponse: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
]

const MOCK_COMPLETION_SUMMARY = {
  totalResponses: 236,
  totalUsers: 4,
  totalForms: 3,
  averageCompletionRate: 92.6,
}

const MOCK_PERFORMANCE_DATA: UserPerformanceData[] = [
  {
    userId: '1',
    userName: 'Carla Alarcón',
    userEmail: 'carla.alarcon@amaranto.cl',
    userRole: 'SUPERVISOR',
    totalResponses: 77,
    uniqueFormsCompleted: 2,
    daysActive: 15.5,
    averageResponsesPerDay: 4.97,
    firstResponse: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    performanceScore: 92,
  },
  {
    userId: '2',
    userName: 'Roberto Méndez',
    userEmail: 'roberto.mendez@amaranto.cl',
    userRole: 'SUPERVISOR',
    totalResponses: 79,
    uniqueFormsCompleted: 2,
    daysActive: 16.0,
    averageResponsesPerDay: 4.94,
    firstResponse: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    performanceScore: 91,
  },
  {
    userId: '3',
    userName: 'María González',
    userEmail: 'maria.gonzalez@amaranto.cl',
    userRole: 'OPERATOR',
    totalResponses: 28,
    uniqueFormsCompleted: 1,
    daysActive: 8.0,
    averageResponsesPerDay: 3.5,
    firstResponse: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    performanceScore: 85,
  },
  {
    userId: '4',
    userName: 'Juan Pérez',
    userEmail: 'juan.perez@amaranto.cl',
    userRole: 'OPERATOR',
    totalResponses: 52,
    uniqueFormsCompleted: 1,
    daysActive: 12.0,
    averageResponsesPerDay: 4.33,
    firstResponse: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    performanceScore: 88,
  },
  {
    userId: '5',
    userName: 'Ana Silva',
    userEmail: 'ana.silva@amaranto.cl',
    userRole: 'OPERATOR',
    totalResponses: 35,
    uniqueFormsCompleted: 2,
    daysActive: 10.0,
    averageResponsesPerDay: 3.5,
    firstResponse: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastResponse: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    performanceScore: 82,
  },
]

const MOCK_PERFORMANCE_SUMMARY = {
  totalUsers: 5,
  totalResponses: 271,
  averageResponsesPerUser: 54.2,
}

const MOCK_ANALYTICS_DATA: FormAnalyticsData = {
  form: {
    id: 'f1',
    title: 'Inspección de Seguridad',
    description: 'Formulario de inspección de seguridad en obra',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  summary: {
    totalResponses: 83,
    uniqueUsers: 2,
    averageResponsesPerDay: 13.8,
    period: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    },
  },
  temporalTrend: [
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), count: 12 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), count: 15 },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), count: 18 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), count: 14 },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), count: 16 },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), count: 8 },
  ],
  fieldsAnalysis: [],
  topUsers: [
    { userId: '1', userName: 'Carla Alarcón', userEmail: 'carla.alarcon@amaranto.cl', count: 45 },
    { userId: '2', userName: 'Roberto Méndez', userEmail: 'roberto.mendez@amaranto.cl', count: 38 },
  ],
}

const Reports = () => {
  const { toast } = useToast()
  const {
    getCompletionReport,
    getUserPerformanceReport,
    getFormAnalyticsReport,
    exportReportToExcel,
    exportReportToPDF,
    loading,
    exportLoading,
    exportType,
    error,
  } = useReports()
  const { forms, fetchForms } = useForms()
  const { users, fetchUsers } = useUsers()

  // Estado del reporte
  const [reportType, setReportType] = useState<ReportType>('completion-by-user')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date()),
  })
  const [selectedFormId, setSelectedFormId] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  
  // Estado para usar datos mock
  const [useMockData, setUseMockData] = useState(() => {
    const stored = localStorage.getItem('reports-use-mock-data')
    return stored ? JSON.parse(stored) : false
  })

  // Datos del reporte
  const [completionData, setCompletionData] = useState<CompletionReportData[]>([])
  const [completionSummary, setCompletionSummary] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<UserPerformanceData[]>([])
  const [performanceSummary, setPerformanceSummary] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<FormAnalyticsData | null>(null)

  // Cargar formularios y usuarios al montar
  useEffect(() => {
    void fetchForms({ status: 'PUBLISHED' })
    void fetchUsers()
  }, [fetchForms, fetchUsers])

  // Toggle para usar datos mock
  const toggleMockData = () => {
    const newValue = !useMockData
    setUseMockData(newValue)
    localStorage.setItem('reports-use-mock-data', JSON.stringify(newValue))
    toast({
      title: newValue ? 'Datos mock activados' : 'Datos mock desactivados',
      description: newValue
        ? 'Estás viendo datos mock para demostración.'
        : 'Ahora se mostrarán datos reales del sistema.',
    })
  }

  // Generar reporte basado en el tipo seleccionado
  const generateReport = async () => {
    // Si está usando datos mock, usar datos mock directamente
    if (useMockData) {
      switch (reportType) {
        case 'completion-by-user':
        case 'completion-by-period':
        case 'form-summary':
        case 'compliance': {
          setCompletionData(MOCK_COMPLETION_DATA)
          setCompletionSummary(MOCK_COMPLETION_SUMMARY)
          break
        }

        case 'user-performance': {
          setPerformanceData(MOCK_PERFORMANCE_DATA)
          setPerformanceSummary(MOCK_PERFORMANCE_SUMMARY)
          break
        }
      }

      // Si hay un formulario seleccionado, usar analytics mock
      if (selectedFormId) {
        setAnalyticsData(MOCK_ANALYTICS_DATA)
      }
      return
    }

    // Usar datos reales del backend
    const filters: ReportFilters = {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    }

    if (selectedFormId) {
      filters.formId = selectedFormId
    }

    if (selectedUserId) {
      filters.userId = selectedUserId
    }

    try {
      switch (reportType) {
        case 'completion-by-user':
        case 'completion-by-period':
        case 'form-summary':
        case 'compliance': {
          const result = await getCompletionReport(filters)
          if (result) {
            setCompletionData(result.data)
            setCompletionSummary(result.summary)
          }
          break
        }

        case 'user-performance': {
          const result = await getUserPerformanceReport({ ...filters, limit: 50 })
          if (result) {
            setPerformanceData(result.data)
            setPerformanceSummary(result.summary)
          }
          break
        }
      }

      // Si hay un formulario seleccionado, obtener analíticas también
      if (selectedFormId) {
        const analytics = await getFormAnalyticsReport(selectedFormId, filters)
        if (analytics) {
          setAnalyticsData(analytics)
        }
      }
    } catch (err) {
      console.error('Error al generar reporte:', err)
      toast({
        title: 'Error al generar reporte',
        description: 'No se pudieron cargar los datos. ¿Deseas usar datos mock para demostración?',
        variant: 'destructive',
        action: (
          <Button onClick={toggleMockData} variant="outline" size="sm">
            Activar Mock
          </Button>
        ),
      })
    }
  }

  // Mapear tipos de reporte del frontend a tipos del backend
  const getBackendReportType = (): 'completion' | 'user-performance' | 'form-analytics' | null => {
    switch (reportType) {
      case 'completion-by-user':
      case 'completion-by-period':
      case 'form-summary':
      case 'compliance':
        return 'completion'
      case 'user-performance':
        return 'user-performance'
      default:
        return null
    }
  }

  // Exportar a Excel usando el backend
  const handleExportExcel = async () => {
    const backendType = getBackendReportType()
    if (!backendType) {
      toast({
        title: 'Tipo de reporte no válido',
        description: 'Selecciona un tipo de reporte válido.',
        variant: 'destructive',
      })
      return
    }

    // Si hay formulario seleccionado, usar form-analytics en lugar de completion
    const exportType =
      selectedFormId && backendType === 'completion' ? 'form-analytics' : backendType

    const filters: ReportFilters = {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    }

    if (selectedFormId) {
      filters.formId = selectedFormId
    }

    if (selectedUserId) {
      filters.userId = selectedUserId
    }

    if (exportType === 'user-performance') {
      filters.limit = 50
    }

    await exportReportToExcel(exportType as 'completion' | 'user-performance' | 'form-analytics', filters)
  }

  // Exportar a PDF usando el backend
  const handleExportPDF = async () => {
    const backendType = getBackendReportType()
    if (!backendType) {
      toast({
        title: 'Tipo de reporte no válido',
        description: 'Selecciona un tipo de reporte válido.',
        variant: 'destructive',
      })
      return
    }

    // Si hay formulario seleccionado, usar form-analytics en lugar de completion
    const exportType =
      selectedFormId && backendType === 'completion' ? 'form-analytics' : backendType

    const filters: ReportFilters = {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    }

    if (selectedFormId) {
      filters.formId = selectedFormId
    }

    if (selectedUserId) {
      filters.userId = selectedUserId
    }

    if (exportType === 'user-performance') {
      filters.limit = 50
    }

    await exportReportToPDF(exportType as 'completion' | 'user-performance' | 'form-analytics', filters)
  }

  // Imprimir reporte
  const handlePrint = () => {
    window.print()
  }

  // Formatear rango de fechas para mostrar
  const dateRangeText = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return 'Seleccionar rango'
    return `${format(dateRange.from, 'dd MMM', { locale: es })} - ${format(dateRange.to, 'dd MMM', { locale: es })}`
  }, [dateRange])

  // Preparar datos para gráficos
  const chartData = useMemo(() => {
    switch (reportType) {
      case 'completion-by-user':
      case 'completion-by-period': {
        // Agrupar por formulario para gráfico de torta
        const byForm = completionData.reduce((acc, item) => {
          if (!acc[item.formId]) {
            acc[item.formId] = { form: item.formTitle, total: 0 }
          }
          acc[item.formId].total += item.totalResponses
          return acc
        }, {} as Record<string, { form: string; total: number }>)

        return Object.values(byForm).map((item) => ({
          name: item.form,
          value: item.total,
        }))
      }

      case 'user-performance': {
        return performanceData.slice(0, 10).map((item) => ({
          name: item.userName,
          totalResponses: item.totalResponses,
          uniqueForms: item.uniqueFormsCompleted,
          avgPerDay: item.averageResponsesPerDay,
        }))
      }

      default:
        return []
    }
  }, [reportType, completionData, performanceData])

  // Datos de tendencia temporal si hay analytics
  const temporalTrendData = useMemo(() => {
    if (!analyticsData) return []

    return analyticsData.temporalTrend.map((item) => ({
      date: format(new Date(item.date), 'dd MMM', { locale: es }),
      count: item.count,
    }))
  }, [analyticsData])

  // Mostrar loader inicial si está cargando y no hay datos
  if (loading && completionData.length === 0 && performanceData.length === 0 && !completionSummary && !performanceSummary) {
    return (
      <div className="flex h-full flex-col space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reportes</h1>
            <p className="text-sm text-muted-foreground">
              Genera y exporta reportes detallados del sistema.
            </p>
          </div>
        </div>
        <PageLoader
          message="Cargando reportes..."
          icon={<BarChart3 className="h-12 w-12 text-primary" />}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Genera y exporta reportes detallados del sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={generateReport} disabled={loading && !useMockData} className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Generar Reporte
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <Database className={cn('h-4 w-4', useMockData ? 'text-primary' : 'text-muted-foreground')} />
            <div className="flex items-center gap-2">
              <Label htmlFor="mock-data-toggle" className="text-sm font-normal cursor-pointer">
                Datos Mock
              </Label>
              <Switch
                id="mock-data-toggle"
                checked={useMockData}
                onCheckedChange={toggleMockData}
              />
            </div>
          </div>
          {completionData.length > 0 || performanceData.length > 0 ? (
            <>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={exportLoading || loading}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={exportLoading || loading}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={handlePrint} disabled={exportLoading} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Filtros del Reporte</CardTitle>
              <CardDescription>Configura los parámetros para generar el reporte.</CardDescription>
            </div>
            {useMockData && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary">
                <Play className="h-4 w-4" />
                <span>Modo Demo (Datos Mock)</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Tipo de reporte */}
            <div className="space-y-2">
              <Label>Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={(value: string) => setReportType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completion-by-user">
                    Formularios completados por usuario
                  </SelectItem>
                  <SelectItem value="completion-by-period">Formularios por periodo</SelectItem>
                  <SelectItem value="form-summary">Resumen de obra (por formulario)</SelectItem>
                  <SelectItem value="compliance">Reporte de cumplimiento</SelectItem>
                  <SelectItem value="user-performance">Rendimiento de usuarios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rango de fechas */}
            <div className="space-y-2">
              <Label>Rango de Fechas</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !dateRange.from && 'text-muted-foreground')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRangeText}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
            </div>

            {/* Formulario específico */}
            <div className="space-y-2">
              <Label>Formulario (Opcional)</Label>
              <Select
                value={selectedFormId || 'all'}
                onValueChange={(value: string) => setSelectedFormId(value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los formularios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los formularios</SelectItem>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Usuario específico */}
            <div className="space-y-2">
              <Label>Usuario (Opcional)</Label>
              <Select
                value={selectedUserId || 'all'}
                onValueChange={(value: string) => setSelectedUserId(value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensaje de error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Preview del reporte */}
      {/* Mostrar skeleton solo si no hay datos y está cargando por primera vez */}
      {loading && completionData.length === 0 && performanceData.length === 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Resumen estadístico */}
          {(completionSummary || performanceSummary) && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {completionSummary && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Respuestas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{completionSummary.totalResponses}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{completionSummary.totalUsers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Formularios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{completionSummary.totalForms}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Tasa Promedio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {completionSummary.averageCompletionRate.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {performanceSummary && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceSummary.totalUsers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Respuestas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceSummary.totalResponses}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Promedio por Usuario</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {performanceSummary.averageResponsesPerUser.toFixed(1)}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Gráficos */}
          {(chartData.length > 0 || temporalTrendData.length > 0) && (
            <div className="grid gap-4 xl:grid-cols-2">
              {chartData.length > 0 && reportType !== 'user-performance' && (
                <PieChartCard
                  title="Distribución por Formulario"
                  description="Cantidad de respuestas por formulario"
                  data={chartData as Record<string, unknown>[]}
                  dataKeys={['name', 'value']}
                />
              )}

              {temporalTrendData.length > 0 && (
                <AreaChartCard
                  title="Tendencia Temporal"
                  description="Evolución de respuestas en el tiempo"
                  data={temporalTrendData as Record<string, unknown>[]}
                  dataKeys={['date', 'count']}
                />
              )}

              {reportType === 'user-performance' && chartData.length > 0 && (
                <ComposedChartCard
                  title="Rendimiento de Usuarios"
                  description="Comparación de métricas por usuario"
                  data={chartData as Record<string, unknown>[]}
                  dataKeys={['name', 'totalResponses', 'uniqueForms', 'avgPerDay']}
                />
              )}
            </div>
          )}

          {/* Tabla de datos */}
          {(completionData.length > 0 || performanceData.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Datos del Reporte</CardTitle>
                <CardDescription>
                  {completionData.length > 0 && `${completionData.length} registros`}
                  {performanceData.length > 0 && `${performanceData.length} usuarios`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {reportType === 'user-performance' ? (
                          <>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Total Respuestas</TableHead>
                            <TableHead>Formularios Únicos</TableHead>
                            <TableHead>Días Activos</TableHead>
                            <TableHead>Promedio/Día</TableHead>
                            <TableHead>Score</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Formulario</TableHead>
                            <TableHead>Total Respuestas</TableHead>
                            <TableHead>Asignaciones</TableHead>
                            <TableHead>Completadas</TableHead>
                            <TableHead>Tasa Completitud</TableHead>
                            <TableHead>Última Respuesta</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportType === 'user-performance'
                        ? performanceData.map((item) => (
                            <TableRow key={item.userId}>
                              <TableCell className="font-medium">{item.userName}</TableCell>
                              <TableCell>{item.userEmail}</TableCell>
                              <TableCell>{item.userRole}</TableCell>
                              <TableCell>{item.totalResponses}</TableCell>
                              <TableCell>{item.uniqueFormsCompleted}</TableCell>
                              <TableCell>{item.daysActive.toFixed(1)}</TableCell>
                              <TableCell>{item.averageResponsesPerDay.toFixed(2)}</TableCell>
                              <TableCell>{item.performanceScore}</TableCell>
                            </TableRow>
                          ))
                        : completionData.map((item, index) => (
                            <TableRow key={`${item.userId}-${item.formId}-${index}`}>
                              <TableCell className="font-medium">{item.userName}</TableCell>
                              <TableCell>{item.formTitle}</TableCell>
                              <TableCell>{item.totalResponses}</TableCell>
                              <TableCell>{item.assignedCount}</TableCell>
                              <TableCell>{item.completedCount}</TableCell>
                              <TableCell>{item.completionRate.toFixed(1)}%</TableCell>
                              <TableCell>
                                {format(new Date(item.lastResponse), 'dd MMM yyyy', { locale: es })}
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Loading Overlay para generación y exportación */}
      <LoadingOverlay
        isLoading={loading || exportLoading}
        type={exportType || (loading ? 'generating' : 'default')}
        message={loading ? 'Generando reporte...' : undefined}
        icon={
          !exportType && loading ? (
            <BarChart3 className="h-8 w-8 text-primary" />
          ) : undefined
        }
      />
    </div>
  )
}

export default Reports

