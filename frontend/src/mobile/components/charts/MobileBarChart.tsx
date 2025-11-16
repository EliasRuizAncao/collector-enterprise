/**
 * MobileBarChart - Gráfico de barras optimizado para mobile
 * Barras anchas, tap-friendly, swipe horizontal
 */

import { useState, useCallback, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid } from 'recharts'
import { cn } from '@/shared/lib/utils'
import { motion } from 'framer-motion'

export interface MobileBarChartData {
  name: string
  value: number
  label?: string
  color?: string
}

interface MobileBarChartProps {
  data: MobileBarChartData[]
  height?: number
  showGrid?: boolean
  showValues?: boolean
  maxVisible?: number
  onBarTap?: (data: MobileBarChartData, index: number) => void
  className?: string
  barColor?: string
  axisLabelRotation?: number
}

/**
 * Tooltip personalizado para mobile
 */
const MobileTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg"
    >
      <p className="text-sm font-semibold mb-1">{label || data.name}</p>
      <p className="text-lg font-bold text-primary">{data.value}</p>
      {data.label && <p className="text-xs text-muted-foreground mt-1">{data.label}</p>}
    </motion.div>
  )
}

const MobileBarChart = ({
  data,
  height = 250,
  showGrid = true,
  showValues = true,
  maxVisible = 7,
  onBarTap,
  className,
  barColor = 'hsl(var(--primary))',
  axisLabelRotation = 0,
}: MobileBarChartProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [scrollOffset, setScrollOffset] = useState(0)

  // Limitar datos visibles y manejar scroll
  const visibleData = useMemo(() => {
    const start = Math.max(0, scrollOffset)
    const end = Math.min(data.length, start + maxVisible)
    return data.slice(start, end)
  }, [data, scrollOffset, maxVisible])

  // Colores para las barras
  const barColors = useMemo(() => {
    return visibleData.map((item, index) => {
      if (selectedIndex === index) {
        return item.color || barColor
      }
      return item.color || barColor
    })
  }, [visibleData, selectedIndex, barColor])

  // Handler para tap en barra
  const handleBarClick = useCallback(
    (data: any, index: number) => {
      const actualIndex = scrollOffset + index
      setSelectedIndex(actualIndex)
      onBarTap?.(data, actualIndex)
    },
    [scrollOffset, onBarTap],
  )

  // Swipe handlers (básico - se puede mejorar con gesture library)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Implementación básica de swipe
    // En producción, usar react-swipeable o similar
  }, [])

  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
      </div>
    )
  }

  return (
    <div
      className={cn('w-full touch-manipulation', className)}
      onTouchStart={handleTouchStart}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={visibleData}
          margin={{ top: 10, right: 10, left: -20, bottom: axisLabelRotation !== 0 ? 40 : 20 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted))"
              opacity={0.3}
              vertical={false}
            />
          )}
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            angle={axisLabelRotation}
            textAnchor={axisLabelRotation !== 0 ? 'end' : 'middle'}
            height={axisLabelRotation !== 0 ? 60 : 30}
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            width={40}
          />
          <Tooltip content={<MobileTooltip />} />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            cursor="pointer"
            onClick={handleBarClick}
            onMouseEnter={(_, index) => setSelectedIndex(scrollOffset + index)}
            onMouseLeave={() => setSelectedIndex(null)}
          >
            {visibleData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={barColors[index]}
                opacity={selectedIndex === scrollOffset + index ? 1 : 0.8}
                style={{
                  transition: 'opacity 0.2s ease',
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Indicadores de scroll si hay más datos */}
      {data.length > maxVisible && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={() => setScrollOffset(Math.max(0, scrollOffset - 1))}
            disabled={scrollOffset === 0}
            className="px-3 py-1 text-xs rounded-md bg-muted disabled:opacity-50"
          >
            ←
          </button>
          <span className="text-xs text-muted-foreground">
            {scrollOffset + 1}-{Math.min(scrollOffset + maxVisible, data.length)} de {data.length}
          </span>
          <button
            onClick={() => setScrollOffset(Math.min(data.length - maxVisible, scrollOffset + 1))}
            disabled={scrollOffset >= data.length - maxVisible}
            className="px-3 py-1 text-xs rounded-md bg-muted disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}

export default MobileBarChart

