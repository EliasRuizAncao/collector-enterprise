import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { type ReactNode } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'

interface KPICardProps {
  title: string
  value: number | string
  change?: number
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  helperText?: string
}

// Determina el color del badge según la tendencia y el valor
const getBadgeVariant = (trend: KPICardProps['trend'], change?: number) => {
  if (trend === 'neutral') {
    return 'muted' as const
  }

  if (typeof change === 'number' && change < 0) {
    return 'destructive' as const
  }

  return trend === 'up' ? ('success' as const) : ('destructive' as const)
}

const KPICard = ({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  helperText,
}: KPICardProps) => {
  const TrendIcon =
    trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus

  const formattedChange = typeof change === 'number' ? `${Math.abs(change).toFixed(1)}%` : null

  return (
    <Card className="relative overflow-hidden border-border/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {icon ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </span>
          ) : null}
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {helperText ? (
              <CardDescription className="text-xs text-muted-foreground/80">
                {helperText}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex items-end justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-3xl font-semibold tracking-tight text-foreground">{value}</span>
        </div>
        {formattedChange ? (
          <Badge
            variant={getBadgeVariant(trend, change)}
            className={cn(
              'flex items-center gap-1 border-transparent',
              trend === 'neutral' && 'bg-muted text-muted-foreground',
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {formattedChange}
          </Badge>
        ) : null}
      </CardContent>

      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </Card>
  )
}

export default KPICard


