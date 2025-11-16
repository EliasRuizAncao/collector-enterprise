/**
 * MobileProgressRing - Anillo de progreso circular optimizado para mobile
 * Circular progress, número central grande, color según progreso, animación
 */

import { useEffect, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { motion } from 'framer-motion'

interface MobileProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  label?: string
  showValue?: boolean
  color?: string
  className?: string
  animated?: boolean
}

const MobileProgressRing = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 12,
  label,
  showValue = true,
  color,
  className,
  animated = true,
}: MobileProgressRingProps) => {
  const [displayValue, setDisplayValue] = useState(0)

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  // Determinar color según progreso
  const getColor = () => {
    if (color) return color

    if (percentage >= 80) return 'hsl(var(--primary))'
    if (percentage >= 60) return 'hsl(142, 76%, 36%)' // green
    if (percentage >= 40) return 'hsl(38, 92%, 50%)' // yellow
    if (percentage >= 20) return 'hsl(25, 95%, 53%)' // orange
    return 'hsl(0, 84%, 60%)' // red
  }

  const progressColor = getColor()

  // Animación del valor
  useEffect(() => {
    if (!animated) {
      setDisplayValue(value)
      return
    }

    const duration = 1000 // 1 segundo
    const steps = 60
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(increment * step, value)
      setDisplayValue(current)

      if (step >= steps) {
        clearInterval(timer)
        setDisplayValue(value)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, animated])

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted opacity-20"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={animated ? { strokeDashoffset: circumference } : {}}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: animated ? 1 : 0, ease: 'easeOut' }}
            style={{
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.2))',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <motion.div
              initial={animated ? { scale: 0.5, opacity: 0 } : {}}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: animated ? 0.3 : 0, duration: 0.3 }}
              className="text-center"
            >
              <div
                className="text-2xl font-bold"
                style={{ color: progressColor }}
              >
                {Math.round(displayValue)}
              </div>
              {max !== 100 && (
                <div className="text-xs text-muted-foreground">/ {max}</div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {label && (
        <motion.p
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animated ? 0.5 : 0 }}
          className="text-xs font-medium text-muted-foreground mt-2 text-center"
        >
          {label}
        </motion.p>
      )}
    </div>
  )
}

export default MobileProgressRing

