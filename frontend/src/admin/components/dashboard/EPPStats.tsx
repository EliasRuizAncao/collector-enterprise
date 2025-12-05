import { useMemo } from 'react'
import { Camera, HardHat, Shield, Hand, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import KPICard from './KPICard'
import { BarChartCard } from './Charts'
import { cn } from '@/shared/lib/utils'

// Interfaz para detecciones EPP (mock)
interface EPPDetection {
  casco: number
  chaleco: number
  guante: number
  zapato: number
  'no casco': number
  'no chaleco': number
  'no guante': number
}

interface EPPDetectionRecord {
  id: string
  timestamp: string
  detections: EPPDetection
  isCompliant: boolean
  missingItems: string[]
  location?: string
}

// Datos mock de detecciones EPP
const MOCK_EPP_DETECTIONS: EPPDetectionRecord[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    detections: { casco: 8, chaleco: 7, guante: 6, zapato: 8, 'no casco': 1, 'no chaleco': 2, 'no guante': 3 },
    isCompliant: false,
    missingItems: ['chaleco', 'guante'],
    location: 'Obra Norte',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    detections: { casco: 12, chaleco: 12, guante: 12, zapato: 12, 'no casco': 0, 'no chaleco': 0, 'no guante': 0 },
    isCompliant: true,
    missingItems: [],
    location: 'Obra Sur',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    detections: { casco: 5, chaleco: 5, guante: 4, zapato: 5, 'no casco': 0, 'no chaleco': 0, 'no guante': 1 },
    isCompliant: false,
    missingItems: ['guante'],
    location: 'Obra Este',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    detections: { casco: 15, chaleco: 15, guante: 15, zapato: 15, 'no casco': 0, 'no chaleco': 0, 'no guante': 0 },
    isCompliant: true,
    missingItems: [],
    location: 'Obra Central',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    detections: { casco: 6, chaleco: 5, guante: 5, zapato: 6, 'no casco': 1, 'no chaleco': 2, 'no guante': 2 },
    isCompliant: false,
    missingItems: ['casco', 'chaleco', 'guante'],
    location: 'Obra Norte',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    detections: { casco: 10, chaleco: 10, guante: 10, zapato: 10, 'no casco': 0, 'no chaleco': 0, 'no guante': 0 },
    isCompliant: true,
    missingItems: [],
    location: 'Obra Sur',
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    detections: { casco: 9, chaleco: 8, guante: 8, zapato: 9, 'no casco': 1, 'no chaleco': 1, 'no guante': 1 },
    isCompliant: false,
    missingItems: ['casco', 'chaleco'],
    location: 'Obra Este',
  },
  {
    id: '8',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    detections: { casco: 20, chaleco: 20, guante: 20, zapato: 20, 'no casco': 0, 'no chaleco': 0, 'no guante': 0 },
    isCompliant: true,
    missingItems: [],
    location: 'Obra Central',
  },
]

// Generar más datos históricos para las últimas 7 días
const generateHistoricalData = (): EPPDetectionRecord[] => {
  const historical: EPPDetectionRecord[] = []
  const locations = ['Obra Norte', 'Obra Sur', 'Obra Este', 'Obra Central']
  
  for (let day = 6; day >= 0; day--) {
    const date = subDays(new Date(), day)
    const recordsPerDay = Math.floor(Math.random() * 10) + 5 // 5-15 registros por día
    
    for (let i = 0; i < recordsPerDay; i++) {
      const hour = Math.floor(Math.random() * 12) + 7 // Entre 7 AM y 7 PM
      const minute = Math.floor(Math.random() * 60)
      const timestamp = new Date(date.setHours(hour, minute, 0))
      
      const isCompliant = Math.random() > 0.3 // 70% de cumplimiento
      const detections: EPPDetection = {
        casco: Math.floor(Math.random() * 20) + 5,
        chaleco: Math.floor(Math.random() * 20) + 5,
        guante: Math.floor(Math.random() * 20) + 5,
        zapato: Math.floor(Math.random() * 20) + 5,
        'no casco': isCompliant ? 0 : Math.floor(Math.random() * 3),
        'no chaleco': isCompliant ? 0 : Math.floor(Math.random() * 3),
        'no guante': isCompliant ? 0 : Math.floor(Math.random() * 3),
      }
      
      const missingItems: string[] = []
      if (detections['no casco'] > 0) missingItems.push('casco')
      if (detections['no chaleco'] > 0) missingItems.push('chaleco')
      if (detections['no guante'] > 0) missingItems.push('guante')
      
      historical.push({
        id: `hist-${day}-${i}`,
        timestamp: timestamp.toISOString(),
        detections,
        isCompliant,
        missingItems,
        location: locations[Math.floor(Math.random() * locations.length)],
      })
    }
  }
  
  return historical
}

interface EPPStatsProps {
  useMockData?: boolean
}

const EPPStats = ({ useMockData = true }: EPPStatsProps) => {
  const allDetections = useMemo(() => {
    if (useMockData) {
      return [...MOCK_EPP_DETECTIONS, ...generateHistoricalData()]
    }
    return []
  }, [useMockData])

  // Filtrar detecciones del día actual
  const todayDetections = useMemo(() => {
    const today = startOfDay(new Date())
    const endToday = endOfDay(new Date())
    return allDetections.filter((d) => {
      const date = new Date(d.timestamp)
      return date >= today && date <= endToday
    })
  }, [allDetections])

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalToday = todayDetections.length
    const compliantToday = todayDetections.filter((d) => d.isCompliant).length
    const nonCompliantToday = totalToday - compliantToday
    const complianceRate = totalToday > 0 ? (compliantToday / totalToday) * 100 : 0

    // Total de detecciones por tipo (sumar todos los valores positivos)
    const totalDetections = todayDetections.reduce(
      (acc, d) => ({
        casco: acc.casco + d.detections.casco,
        chaleco: acc.chaleco + d.detections.chaleco,
        guante: acc.guante + d.detections.guante,
        zapato: acc.zapato + d.detections.zapato,
        'no casco': acc['no casco'] + d.detections['no casco'],
        'no chaleco': acc['no chaleco'] + d.detections['no chaleco'],
        'no guante': acc['no guante'] + d.detections['no guante'],
      }),
      { casco: 0, chaleco: 0, guante: 0, zapato: 0, 'no casco': 0, 'no chaleco': 0, 'no guante': 0 },
    )

    // Infracciones totales
    const totalViolations = totalDetections['no casco'] + totalDetections['no chaleco'] + totalDetections['no guante']

    return {
      totalToday,
      compliantToday,
      nonCompliantToday,
      complianceRate,
      totalDetections,
      totalViolations,
    }
  }, [todayDetections])

  // Datos para gráfico de cumplimiento por día (últimos 7 días)
  const complianceByDay = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      
      const dayDetections = allDetections.filter((d) => {
        const date = new Date(d.timestamp)
        return date >= dayStart && date <= dayEnd
      })
      
      const total = dayDetections.length
      const compliant = dayDetections.filter((d) => d.isCompliant).length
      const rate = total > 0 ? (compliant / total) * 100 : 0
      
      days.push({
        day: format(day, 'EEE', { locale: es }),
        fecha: format(day, 'dd/MM', { locale: es }),
        cumplimiento: Math.round(rate),
        total,
        infracciones: total - compliant,
      })
    }
    return days
  }, [allDetections])

  // Datos para gráfico de detecciones por tipo
  const detectionsByType = useMemo(() => {
    return [
      { tipo: 'Cascos', detectados: stats.totalDetections.casco, faltantes: stats.totalDetections['no casco'] },
      { tipo: 'Chalecos', detectados: stats.totalDetections.chaleco, faltantes: stats.totalDetections['no chaleco'] },
      { tipo: 'Guantes', detectados: stats.totalDetections.guante, faltantes: stats.totalDetections['no guante'] },
      { tipo: 'Zapatos', detectados: stats.totalDetections.zapato, faltantes: 0 },
    ]
  }, [stats])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
            <Camera className="h-6 w-6 text-primary" />
            Monitoreo EPP
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Estadísticas de detecciones de Equipos de Protección Personal
          </p>
        </div>
        {useMockData && (
          <Badge variant="outline" className="gap-2">
            <AlertTriangle className="h-3 w-3" />
            Datos Mock
          </Badge>
        )}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Detecciones Hoy"
          value={stats.totalToday.toString()}
          change={12.5}
          trend="up"
          helperText="vs día anterior"
          icon={<Camera className="h-5 w-5" />}
        />
        <KPICard
          title="Tasa de Cumplimiento"
          value={`${stats.complianceRate.toFixed(1)}%`}
          change={stats.complianceRate > 80 ? 5.2 : -3.1}
          trend={stats.complianceRate > 80 ? 'up' : 'down'}
          helperText="Objetivo: 95%"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPICard
          title="Infracciones Detectadas"
          value={stats.nonCompliantToday.toString()}
          change={stats.nonCompliantToday > 0 ? -15.0 : 0}
          trend={stats.nonCompliantToday > 0 ? 'down' : 'neutral'}
          helperText="Hoy"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <KPICard
          title="Personas sin EPP"
          value={stats.totalViolations.toString()}
          change={-8.3}
          trend="down"
          helperText="Total hoy"
          icon={<HardHat className="h-5 w-5" />}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 xl:grid-cols-2">
        <BarChartCard
          title="Cumplimiento por Día"
          description="Tasa de cumplimiento de EPP en los últimos 7 días"
          data={complianceByDay as unknown as Record<string, unknown>[]}
          dataKeys={['day', 'cumplimiento']}
        />

        <BarChartCard
          title="Detecciones por Tipo de EPP"
          description="Total de detecciones y faltantes por tipo de equipo"
          data={detectionsByType as unknown as Record<string, unknown>[]}
          dataKeys={['tipo', 'detectados', 'faltantes']}
        />
      </div>

      {/* Resumen de detecciones por tipo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={cn(stats.totalDetections['no casco'] > 0 && 'border-red-500 border-2')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <HardHat className="h-5 w-5" />
              Cascos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stats.totalDetections.casco}</span>
              <span className="text-sm text-muted-foreground">detectados</span>
            </div>
            {stats.totalDetections['no casco'] > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-semibold">
                ⚠️ {stats.totalDetections['no casco']} sin casco
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={cn(stats.totalDetections['no chaleco'] > 0 && 'border-red-500 border-2')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Chalecos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stats.totalDetections.chaleco}</span>
              <span className="text-sm text-muted-foreground">detectados</span>
            </div>
            {stats.totalDetections['no chaleco'] > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-semibold">
                ⚠️ {stats.totalDetections['no chaleco']} sin chaleco
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={cn(stats.totalDetections['no guante'] > 0 && 'border-amber-500 border-2')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Hand className="h-5 w-5" />
              Guantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stats.totalDetections.guante}</span>
              <span className="text-sm text-muted-foreground">detectados</span>
            </div>
            {stats.totalDetections['no guante'] > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 font-semibold">
                ⚠️ {stats.totalDetections['no guante']} sin guantes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Zapatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stats.totalDetections.zapato}</span>
              <span className="text-sm text-muted-foreground">detectados</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default EPPStats

