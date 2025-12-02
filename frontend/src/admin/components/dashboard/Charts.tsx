import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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
   * El primer elemento de dataKeys se utiliza como llave del eje X.
   * Los elementos restantes se renderizan como series del gráfico.
   */
  dataKeys: string[]
  colors?: string[]
}

const defaultColors = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--muted))',
]

export const LineChartCard = <TData extends Record<string, unknown>>({
  title,
  description,
  data,
  dataKeys,
  colors = defaultColors,
}: ChartCardProps<TData>) => {
  const [xKey, ...seriesKeys] = dataKeys

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

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="h-72 w-full min-h-[288px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={288}>
          <LineChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
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
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                borderRadius: '12px',
                borderColor: 'hsl(var(--border))',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {seriesKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export const BarChartCard = <TData extends Record<string, unknown>>({
  title,
  description,
  data,
  dataKeys,
  colors = defaultColors,
}: ChartCardProps<TData>) => {
  const [xKey, ...seriesKeys] = dataKeys

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

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="h-72 w-full min-h-[288px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={288}>
          <BarChart data={data} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
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
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                borderRadius: '12px',
                borderColor: 'hsl(var(--border))',
              }}
              cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {seriesKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


