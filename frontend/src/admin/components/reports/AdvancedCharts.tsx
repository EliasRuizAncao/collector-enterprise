import { useRef } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

interface ChartCardProps<TData extends Record<string, unknown>> {
  title: string
  description?: string
  data: TData[]
  /**
   * El primer elemento de dataKeys se utiliza como llave del eje X (si aplica).
   * Los elementos restantes se renderizan como series del gráfico.
   */
  dataKeys: string[]
  colors?: string[]
  showLegend?: boolean
}

const defaultColors = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--muted))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  'hsl(var(--success))',
]

/**
 * Exporta un gráfico a imagen PNG
 */
const exportChartToImage = async (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
  if (!chartRef.current) {
    console.warn('No se puede exportar: referencia del gráfico no encontrada')
    return
  }

  try {
    // Importar html2canvas dinámicamente
    const html2canvas = (await import('html2canvas')).default

    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    })

    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('Error al exportar gráfico a imagen:', error)
  }
}

/**
 * Gráfico de torta (Pie Chart) para mostrar distribución
 */
export const PieChartCard = <TData extends Record<string, unknown>>({
  title,
  description,
  data,
  dataKeys,
  colors = defaultColors,
  showLegend = true,
}: ChartCardProps<TData>) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [nameKey, valueKey] = dataKeys

  // Si no hay datos, mostrar mensaje
  if (!data || data.length === 0) {
    return (
      <Card className="border-border/70">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="flex h-72 items-center justify-center">
          <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
        </CardContent>
      </Card>
    )
  }

  // Renderizar leyenda personalizada si está habilitada
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: any) => {
    if (percent < 0.05) return null // No mostrar etiquetas menores al 5%

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <Card className="border-border/70" ref={chartRef}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => void exportChartToImage(chartRef, title.toLowerCase().replace(/\s+/g, '-'))}
          title="Exportar gráfico como imagen"
        >
          <Download className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="h-72 w-full min-h-[288px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={288}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="hsl(var(--primary))"
              dataKey={valueKey}
              nameKey={nameKey}
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
              }}
              formatter={(value: number) => [value, valueKey]}
              labelFormatter={(label) => `${nameKey}: ${label}`}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

/**
 * Gráfico de área para mostrar tendencias temporales
 */
export const AreaChartCard = <TData extends Record<string, unknown>>({
  title,
  description,
  data,
  dataKeys,
  colors = defaultColors,
  showLegend = true,
}: ChartCardProps<TData>) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [xKey, ...seriesKeys] = dataKeys

  // Si no hay datos, mostrar mensaje
  if (!data || data.length === 0) {
    return (
      <Card className="border-border/70">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
        </CardHeader>
        <CardContent className="flex h-72 items-center justify-center">
          <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/70" ref={chartRef}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => void exportChartToImage(chartRef, title.toLowerCase().replace(/\s+/g, '-'))}
          title="Exportar gráfico como imagen"
        >
          <Download className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="h-72 w-full min-h-[288px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={288}>
          <AreaChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
            <defs>
              {seriesKeys.map((_key, index) => (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`color${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={colors[index % colors.length]}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={colors[index % colors.length]}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="4 8" stroke="hsl(var(--muted-foreground) / 0.2)" />
            {xKey ? (
              <XAxis
                dataKey={xKey}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
            ) : null}
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {seriesKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fillOpacity={1}
                fill={`url(#color${index})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

/**
 * Gráfico combinado (Composed Chart) - Barras + Línea
 * Útil para mostrar múltiples métricas en un solo gráfico
 */
export const ComposedChartCard = <TData extends Record<string, unknown>>({
  title,
  description,
  data,
  dataKeys,
  colors = defaultColors,
  showLegend = true,
}: ChartCardProps<TData> & {
  /**
   * Indica qué series deben ser barras (índices de dataKeys)
   * Las demás serán líneas
   */
  barSeries?: number[]
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [xKey, ...seriesKeys] = dataKeys

  // Si no hay datos, mostrar mensaje
  if (!data || data.length === 0) {
    return (
      <Card className="border-border/70">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
        </CardHeader>
        <CardContent className="flex h-72 items-center justify-center">
          <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
        </CardContent>
      </Card>
    )
  }

  // Por defecto, la primera serie es barra y las demás son línea
  const barSeries = (title: string) => {
    // Si el título contiene "completados" o "cantidad", usar barras para todas
    if (title.toLowerCase().includes('completados') || title.toLowerCase().includes('cantidad')) {
      return seriesKeys.map((_, i) => i)
    }
    // Por defecto, solo la primera es barra
    return [0]
  }

  const barIndices = barSeries(title)

  return (
    <Card className="border-border/70" ref={chartRef}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => void exportChartToImage(chartRef, title.toLowerCase().replace(/\s+/g, '-'))}
          title="Exportar gráfico como imagen"
        >
          <Download className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="h-72 w-full min-h-[288px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={288}>
          <ComposedChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 8" stroke="hsl(var(--muted-foreground) / 0.2)" />
            {xKey ? (
              <XAxis
                dataKey={xKey}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
            ) : null}
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {seriesKeys.map((key, index) => {
              if (barIndices.includes(index)) {
                return (
                  <Bar
                    key={key}
                    yAxisId="left"
                    dataKey={key}
                    fill={colors[index % colors.length]}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                )
              }
              return (
                <Line
                  key={key}
                  yAxisId="right"
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

