/**
 * MobileHeatMap - Mapa de calor tipo calendario optimizado para mobile
 * Calendar view, cells grandes, tap en cell, legend, swipe para cambiar mes
 */

import { useState, useMemo, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/shared/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

export interface MobileHeatMapData {
  date: Date
  value: number
  label?: string
}

interface MobileHeatMapProps {
  data: MobileHeatMapData[]
  startDate?: Date
  endDate?: Date
  cellSize?: number
  onCellTap?: (data: MobileHeatMapData) => void
  className?: string
  showLegend?: boolean
  enableSwipe?: boolean
}

const MobileHeatMap = ({
  data,
  startDate,
  endDate,
  cellSize = 36,
  onCellTap,
  className,
  showLegend = true,
  enableSwipe = true,
}: MobileHeatMapProps) => {
  const [currentMonth, setCurrentMonth] = useState(() => startDate || new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Calcular días del mes actual
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Obtener valor para un día
  const getDayValue = useCallback(
    (day: Date) => {
      const dayData = data.find((d) => isSameDay(d.date, day))
      return dayData?.value || 0
    },
    [data],
  )

  // Calcular intensidad de color
  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => d.value), 1)
  }, [data])

  const getIntensity = (value: number) => {
    if (value === 0) return 0
    return Math.min(value / maxValue, 1)
  }

  const getColorClass = (intensity: number) => {
    if (intensity === 0) return 'bg-muted'
    if (intensity < 0.25) return 'bg-green-200 dark:bg-green-900'
    if (intensity < 0.5) return 'bg-green-400 dark:bg-green-700'
    if (intensity < 0.75) return 'bg-green-600 dark:bg-green-500'
    return 'bg-green-800 dark:bg-green-300'
  }

  // Navegar meses
  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }, [])

  // Handler para tap en cell
  const handleCellTap = useCallback(
    (day: Date) => {
      const dayData = data.find((d) => isSameDay(d.date, day))
      if (dayData) {
        setSelectedDate(day)
        onCellTap?.(dayData)
      }
    },
    [data, onCellTap],
  )

  return (
    <div className={cn('w-full touch-manipulation', className)}>
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMonth.toISOString()}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1"
        >
          {/* Espacios vacíos al inicio del mes */}
          {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} style={{ width: cellSize, height: cellSize }} />
          ))}

          {/* Días del mes */}
          {monthDays.map((day) => {
            const value = getDayValue(day)
            const intensity = getIntensity(value)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isCurrentDay = isToday(day)

            return (
              <motion.button
                key={day.toISOString()}
                type="button"
                onClick={() => handleCellTap(day)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'rounded-md text-xs font-medium transition-all duration-200 touch-manipulation',
                  'flex items-center justify-center',
                  getColorClass(intensity),
                  value > 0 && 'text-white dark:text-black',
                  value === 0 && 'text-muted-foreground',
                  isSelected && 'ring-2 ring-primary ring-offset-2',
                  isCurrentDay && 'ring-2 ring-blue-500',
                )}
                style={{ width: cellSize, height: cellSize }}
                title={`${format(day, 'dd/MM')}: ${value} actividad${value !== 1 ? 'es' : ''}`}
              >
                {format(day, 'd')}
              </motion.button>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xs text-muted-foreground">Menos</span>
          <div className="flex gap-0.5">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
              <div
                key={i}
                className={cn('w-3 h-3 rounded', getColorClass(intensity))}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Más</span>
        </div>
      )}

      {/* Tooltip para fecha seleccionada */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2 rounded-lg bg-muted text-center"
        >
          <p className="text-sm font-semibold">
            {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
          </p>
          <p className="text-xs text-muted-foreground">
            {getDayValue(selectedDate)} actividad{getDayValue(selectedDate) !== 1 ? 'es' : ''}
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default MobileHeatMap

