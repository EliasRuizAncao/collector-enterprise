/**
 * MobilePieChart - Gráfico de donut optimizado para mobile
 * Donut style, tap en slice, legend abajo, max 6 slices
 */

import { useState, useCallback, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { cn } from '@/shared/lib/utils'
import { motion } from 'framer-motion'

export interface MobilePieChartData {
  name: string
  value: number
  color?: string
}

interface MobilePieChartProps {
  data: MobilePieChartData[]
  height?: number
  showLegend?: boolean
  showCenterValue?: boolean
  centerValue?: string | number
  onSliceTap?: (data: MobilePieChartData, index: number) => void
  className?: string
  maxSlices?: number
}

/**
 * Tooltip personalizado para mobile
 */
const MobilePieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg"
    >
      <p className="text-sm font-semibold mb-1">{data.name}</p>
      <p className="text-lg font-bold text-primary">{data.value}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {data.percentage?.toFixed(1)}%
      </p>
    </motion.div>
  )
}

/**
 * Legend personalizado para mobile (abajo)
 */
const MobileLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

const MobilePieChart = ({
  data,
  height = 300,
  showLegend = true,
  showCenterValue = false,
  centerValue,
  onSliceTap,
  className,
  maxSlices = 6,
}: MobilePieChartProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // Agrupar datos si hay más de maxSlices
  const processedData = useMemo(() => {
    if (data.length <= maxSlices) return data

    const sorted = [...data].sort((a, b) => b.value - a.value)
    const main = sorted.slice(0, maxSlices - 1)
    const others = sorted.slice(maxSlices - 1)

    const othersSum = others.reduce((sum, item) => sum + item.value, 0)

    return [
      ...main,
      {
        name: 'Otros',
        value: othersSum,
        color: 'hsl(var(--muted))',
      },
    ]
  }, [data, maxSlices])

  // Calcular porcentajes
  const total = useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.value, 0)
  }, [processedData])

  const dataWithPercentage = useMemo(() => {
    return processedData.map((item) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }))
  }, [processedData, total])

  // Colores por defecto
  const defaultColors = [
    'hsl(var(--primary))',
    'hsl(var(--primary) / 0.8)',
    'hsl(var(--primary) / 0.6)',
    'hsl(var(--primary) / 0.4)',
    'hsl(var(--muted-foreground))',
    'hsl(var(--muted))',
  ]

  // Handler para tap en slice
  const handleSliceClick = useCallback(
    (data: any, index: number) => {
      setSelectedIndex(index)
      onSliceTap?.(data, index)
    },
    [onSliceTap],
  )

  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
      </div>
    )
  }

  return (
    <div className={cn('w-full touch-manipulation', className)}>
      <div style={{ height: showLegend ? height - 60 : height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              innerRadius={showCenterValue ? '60%' : '50%'}
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              animationDuration={500}
              onClick={handleSliceClick}
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || defaultColors[index % defaultColors.length]}
                  opacity={selectedIndex === index ? 1 : selectedIndex !== null ? 0.3 : 0.9}
                  style={{
                    transition: 'opacity 0.2s ease',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<MobilePieTooltip />} />
            {showCenterValue && (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl font-bold fill-foreground"
              >
                {centerValue !== undefined ? centerValue : total}
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {showLegend && (
        <MobileLegend
          payload={dataWithPercentage.map((item, index) => ({
            value: item.name,
            color: item.color || defaultColors[index % defaultColors.length],
          }))}
        />
      )}
    </div>
  )
}

export default MobilePieChart

