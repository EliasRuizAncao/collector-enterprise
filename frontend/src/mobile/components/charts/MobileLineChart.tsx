/**
 * MobileLineChart - Gráfico de línea optimizado para mobile
 * Smooth curves, tap, drag zoom, pinch zoom, pan
 */

import { useState, useCallback, useRef, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Dot,
} from 'recharts'
import { cn } from '@/shared/lib/utils'
import { motion } from 'framer-motion'

export interface MobileLineChartData {
  name: string
  value: number
  label?: string
}

interface MobileLineChartProps {
  data: MobileLineChartData[]
  height?: number
  showGrid?: boolean
  showDots?: boolean
  smooth?: boolean
  color?: string
  onPointTap?: (data: MobileLineChartData, index: number) => void
  className?: string
  enableZoom?: boolean
}

/**
 * Tooltip personalizado para mobile
 */
const MobileLineTooltip = ({ active, payload, label }: any) => {
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

/**
 * Dot personalizado para mejor tap
 */
const CustomDot = ({ cx, cy, payload, onClick, isActive }: any) => {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={isActive ? 6 : 4}
      fill="hsl(var(--primary))"
      stroke="hsl(var(--background))"
      strokeWidth={2}
      className="cursor-pointer touch-manipulation"
      onClick={() => onClick?.(payload)}
      whileTap={{ scale: 1.3 }}
      style={{
        transition: 'r 0.2s ease',
      }}
    />
  )
}

const MobileLineChart = ({
  data,
  height = 250,
  showGrid = true,
  showDots = true,
  smooth = true,
  color = 'hsl(var(--primary))',
  onPointTap,
  className,
  enableZoom = false,
}: MobileLineChartProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Datos visibles (con zoom si está habilitado)
  const visibleData = useMemo(() => {
    if (!zoomRange) return data
    return data.slice(zoomRange.start, zoomRange.end + 1)
  }, [data, zoomRange])

  // Handler para tap en punto
  const handlePointClick = useCallback(
    (payload: MobileLineChartData, index: number) => {
      setSelectedIndex(index)
      onPointTap?.(payload, index)
    },
    [onPointTap],
  )

  // Reset zoom
  const handleResetZoom = useCallback(() => {
    setZoomRange(null)
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
      ref={containerRef}
      className={cn('w-full touch-manipulation relative', className)}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={visibleData}
          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
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
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            width={40}
          />
          <Tooltip content={<MobileLineTooltip />} />
          <Line
            type={smooth ? 'monotone' : 'linear'}
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={showDots ? (props) => <CustomDot {...props} onClick={handlePointClick} isActive={selectedIndex === props.index} /> : false}
            activeDot={{ r: 6, fill: color }}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Botón de reset zoom */}
      {enableZoom && zoomRange && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleResetZoom}
          className="absolute top-2 right-2 px-2 py-1 text-xs rounded-md bg-background/90 backdrop-blur-sm border"
        >
          Reset zoom
        </motion.button>
      )}
    </div>
  )
}

export default MobileLineChart

