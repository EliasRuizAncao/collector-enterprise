/**
 * InsightsCarousel - Componente para mostrar insights en cards deslizables
 * Cards horizontales con swipe, dismiss, y acciones
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  Sun,
  Target,
  AlertTriangle,
  WifiOff,
  Flame,
  Trophy,
  Crown,
  AlertCircle,
  Wifi,
  Coffee,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { type Insight } from '../utils/insightsEngine'

interface InsightsCarouselProps {
  insights: Insight[]
  onDismiss?: (insightId: string) => void
  onAction?: (insight: Insight) => void
  onViewMore?: () => void
  maxVisible?: number
  className?: string
}

/**
 * Mapeo de iconos
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  Sun,
  Target,
  AlertTriangle,
  WifiOff,
  Flame,
  Trophy,
  Crown,
  AlertCircle,
  Wifi,
  Coffee,
  Sparkles,
}

/**
 * Colores por categoría
 */
const categoryColors = {
  positive: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
  warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
  info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  urgent: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
}

const categoryIconColors = {
  positive: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
  urgent: 'text-red-600 dark:text-red-400',
}

const InsightsCarousel = ({
  insights,
  onDismiss,
  onAction,
  onViewMore,
  maxVisible = 5,
  className,
}: InsightsCarouselProps) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleInsights = insights.filter((i) => !dismissed.has(i.id)).slice(0, maxVisible)

  const handleDismiss = useCallback(
    (insightId: string) => {
      setDismissed((prev) => new Set(prev).add(insightId))
      onDismiss?.(insightId)
    },
    [onDismiss],
  )

  const handleAction = useCallback(
    (insight: Insight) => {
      onAction?.(insight)
    },
    [onAction],
  )

  if (visibleInsights.length === 0) {
    return null
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Insights
        </h3>
        {onViewMore && insights.length > maxVisible && (
          <Button variant="ghost" size="sm" onClick={onViewMore} className="h-7 text-xs">
            Ver más ({insights.length - maxVisible})
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto overscroll-contain scrollbar-hide pb-2">
        <AnimatePresence mode="popLayout">
          {visibleInsights.map((insight, index) => {
            const IconComponent = iconMap[insight.icon || 'Sparkles'] || Sparkles

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="flex-shrink-0 w-[280px]"
              >
                <Card
                  className={cn(
                    'mobile-card relative overflow-hidden border-l-4',
                    categoryColors[insight.category],
                  )}
                  style={{
                    borderLeftColor:
                      insight.category === 'positive'
                        ? 'hsl(142, 76%, 36%)'
                        : insight.category === 'warning'
                          ? 'hsl(38, 92%, 50%)'
                          : insight.category === 'urgent'
                            ? 'hsl(0, 84%, 60%)'
                            : 'hsl(217, 91%, 60%)',
                  }}
                >
                  {insight.dismissible && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() => handleDismiss(insight.id)}
                      aria-label="Descartar"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg flex-shrink-0',
                          categoryIconColors[insight.category],
                        )}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h4 className="text-sm font-semibold mb-1">{insight.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {insight.message}
                          </p>
                        </div>

                        {insight.action && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(insight)}
                            className="w-full text-xs h-7"
                          >
                            {insight.action.label}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              insight.category === 'positive' && 'border-green-500 text-green-700 dark:text-green-400',
                              insight.category === 'warning' && 'border-amber-500 text-amber-700 dark:text-amber-400',
                              insight.category === 'urgent' && 'border-red-500 text-red-700 dark:text-red-400',
                              insight.category === 'info' && 'border-blue-500 text-blue-700 dark:text-blue-400',
                            )}
                          >
                            {insight.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default InsightsCarousel

