import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Clock, CheckCircle2, MapPin, Info, Loader2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { useHaptics } from '../hooks/useHaptics'
import type { SyncStatus } from '../hooks/useOfflineAssignments'
import { fadeIn, tapScale, getReducedMotionVariants } from '../utils/animations'
import { OfflineModeBadge } from './offline'

/**
 * Tipo para una tarea/asignación
 */
export interface Assignment {
  id: string
  formId: string
  formName: string
  description?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed'
  progress?: number
  completedAt?: string
  assignedAt: string
  location?: string
  completedFields?: number
  totalFields?: number
}

/**
 * Props del componente AssignmentCard
 */
interface AssignmentCardProps {
  /**
   * Datos de la asignación
   */
  assignment: Assignment
  /**
   * Callback cuando se hace tap en el card
   */
  onTap?: () => void
  /**
   * Callback cuando se inicia la tarea
   */
  onStart?: () => void
  /**
   * Callback cuando se ve detalle
   */
  onView?: () => void
  /**
   * Callback cuando se completa la tarea
   */
  onComplete?: () => void
  /**
   * Si true, muestra skeleton loading
   */
  isLoading?: boolean
  /**
   * Si true, está ejecutando una acción
   */
  isProcessing?: boolean
  /**
   * Si true, deshabilita interacciones
   */
  disabled?: boolean
  /**
   * Estado de sincronización de esta asignación
   */
  syncStatus?: SyncStatus
}

/**
 * Componente AssignmentCard - Card de tarea con swipe actions
 * Card táctil con interacciones nativas inspiradas en iOS y Android
 */
const AssignmentCard = ({
  assignment,
  onTap,
  onStart,
  onView,
  onComplete,
  isLoading = false,
  isProcessing = false,
  disabled = false,
  syncStatus = 'synced',
}: AssignmentCardProps) => {
  const navigate = useNavigate()
  const haptics = useHaptics()
  const cardRef = useRef<HTMLDivElement>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const startTime = useRef<number>(0)

  // Reset swipe cuando se completa la acción
  useEffect(() => {
    if (!isProcessing && swipeOffset !== 0) {
      const timer = setTimeout(() => {
        setSwipeOffset(0)
        setSwipeDirection(null)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isProcessing, swipeOffset])

  // Handlers para swipe manual
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isProcessing) return

    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    startTime.current = Date.now()
    setIsSwiping(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isProcessing || touchStartX.current === 0) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current

    // Solo activar swipe si el movimiento horizontal es mayor que el vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true)
      setSwipeOffset(deltaX)
      setSwipeDirection(deltaX > 0 ? 'right' : 'left')
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    if (disabled || isProcessing || !isSwiping) {
      touchStartX.current = 0
      return
    }

    const threshold = 100
    const velocity = Math.abs(swipeOffset) / (Date.now() - startTime.current)

    // Si se alcanzó el threshold o velocidad alta, activar acción
    if (Math.abs(swipeOffset) >= threshold || velocity > 0.5) {
      haptics.medium()

      if (swipeDirection === 'right' && onComplete) {
        // Swipe right: completar
        haptics.success()
        onComplete()
      } else if (swipeDirection === 'left' && onView) {
        // Swipe left: ver detalles
        haptics.light()
        onView()
      }
    }

    // Reset
    setSwipeOffset(0)
    setIsSwiping(false)
    setSwipeDirection(null)
    touchStartX.current = 0
  }

  // Handler para tap normal
  const handleTap = () => {
    if (disabled || isProcessing || isSwiping) return

    haptics.light('card-tap')

    if (onTap) {
      onTap()
    } else {
      navigate(`/mobile/form/${assignment.id}`)
    }
  }

  // Helpers
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>
      case 'high':
        return <Badge className="bg-orange-500">Alta</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">Media</Badge>
      case 'low':
        return <Badge variant="secondary">Baja</Badge>
      default:
        return null
    }
  }

  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'urgent':
        return 'border-l-destructive'
      case 'high':
        return 'border-l-orange-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-muted-foreground'
      default:
        return 'border-l-border'
    }
  }

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) {
      return <Badge variant="destructive">Vencida</Badge>
    }

    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completada</Badge>
      case 'in_progress':
        return <Badge className="bg-amber-500">En progreso</Badge>
      case 'pending':
        return <Badge className="bg-blue-500">Pendiente</Badge>
      default:
        return null
    }
  }

  const getDueDateColor = (dueDate?: string): string => {
    if (!dueDate) return 'text-muted-foreground'

    const due = new Date(dueDate)
    const now = new Date()
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 0) {
      return 'text-destructive font-medium' // Vencido
    } else if (diffHours < 24) {
      return 'text-amber-600 dark:text-amber-400 font-medium' // <24h
    } else {
      return 'text-muted-foreground' // >24h
    }
  }

  const getCardBackground = (status: string, isOverdue: boolean): string => {
    if (isOverdue) {
      return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
    }

    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
      default:
        return ''
    }
  }

  // Calcular si está vencido
  const isOverdue = Boolean(
    assignment.dueDate && new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed'
  )
  const dueDateFormatted = assignment.dueDate
    ? format(new Date(assignment.dueDate), "dd/MM 'a las' HH:mm")
    : null

  // Calcular si está cerca de vencer (<24h)
  const isNearDue =
    assignment.dueDate &&
    !isOverdue &&
    new Date(assignment.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000

  // Skeleton loading
  if (isLoading) {
    return (
      <Card className="mobile-card mb-3 animate-pulse">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="h-5 w-3/4 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Determinar qué acción mostrar en swipe right
  const rightAction = assignment.status === 'pending' ? onStart : onComplete
  const rightActionLabel = assignment.status === 'pending' ? 'Iniciar' : 'Completar'
  const rightActionIcon = assignment.status === 'pending' ? CheckCircle2 : CheckCircle2

  return (
    <div className="relative mb-3">
      {/* Swipe Action - Left (Ver Detalles) */}
      {swipeOffset < 0 && onView && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex items-center justify-end rounded-l-lg bg-blue-500 px-6 transition-opacity duration-200',
            Math.abs(swipeOffset) >= 100 ? 'opacity-100' : 'opacity-50',
          )}
          style={{
            width: `${Math.min(Math.abs(swipeOffset), 120)}px`,
            transform: `translateX(${Math.min(swipeOffset + 120, 0)}px)`,
          }}
        >
          <div className="flex flex-col items-center gap-2 text-white">
            <Info className="h-6 w-6" />
            <span className="text-xs font-medium">Detalles</span>
          </div>
        </div>
      )}

      {/* Swipe Action - Right (Completar/Iniciar) */}
      {swipeOffset > 0 && rightAction && (
        <div
          className={cn(
            'absolute inset-y-0 right-0 flex items-center justify-start rounded-r-lg bg-green-500 px-6 transition-opacity duration-200',
            swipeOffset >= 100 ? 'opacity-100' : 'opacity-50',
          )}
          style={{
            width: `${Math.min(swipeOffset, 120)}px`,
            transform: `translateX(${Math.max(swipeOffset - 120, 0)}px)`,
          }}
        >
          <div className="flex flex-col items-center gap-2 text-white">
            {(() => {
              const Icon = rightActionIcon
              return <Icon className="h-6 w-6" />
            })()}
            <span className="text-xs font-medium">{rightActionLabel}</span>
          </div>
        </div>
      )}

      {/* Main Card */}
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={getReducedMotionVariants(fadeIn)}
        {...tapScale}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
        transition={isSwiping ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
      >
        <Card
          ref={cardRef}
          className={cn(
            'mobile-card relative cursor-pointer touch-manipulation',
            getPriorityColor(assignment.priority),
            'border-l-4',
            getCardBackground(assignment.status, isOverdue),
            disabled && 'opacity-50 pointer-events-none',
            isProcessing && 'opacity-75 pointer-events-none',
          )}
          onClick={handleTap}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`Tarea: ${assignment.formName}`}
          aria-disabled={disabled || isProcessing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleTap()
            }
          }}
        >
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold leading-tight line-clamp-2">
                  {assignment.formName}
                </h3>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                {getStatusBadge(assignment.status, isOverdue)}
                {getPriorityBadge(assignment.priority)}
                {/* Offline Badge */}
                {syncStatus !== 'synced' && (
                  <OfflineModeBadge 
                    label={syncStatus === 'pending' ? 'Pendiente' : syncStatus === 'error' ? 'Error' : 'Local'}
                  />
                )}
              </div>
            </div>

            {/* Description */}
            {assignment.description && (
              <p className="text-sm leading-tight line-clamp-1 text-muted-foreground">
                {assignment.description}
              </p>
            )}

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Due Date Chip */}
              {dueDateFormatted && (
                <div className={cn('flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5')}>
                  <Clock className={cn('h-4 w-4 shrink-0', getDueDateColor(assignment.dueDate))} />
                  <span className={cn('text-xs font-medium', getDueDateColor(assignment.dueDate))}>
                    {isOverdue ? 'Vencida: ' : isNearDue ? 'Próxima: ' : 'Hasta: '}
                    {dueDateFormatted}
                  </span>
                </div>
              )}

              {/* Location Chip */}
              {assignment.location && (
                <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground truncate max-w-[150px]">
                    {assignment.location}
                  </span>
                </div>
              )}

              {/* Progress */}
              {assignment.progress !== undefined &&
                assignment.progress > 0 &&
                assignment.status !== 'completed' && (
                  <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
                    {assignment.completedFields !== undefined && assignment.totalFields !== undefined ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        {assignment.completedFields}/{assignment.totalFields}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {Math.round(assignment.progress)}%
                      </span>
                    )}
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${assignment.progress}%` }}
                      />
                    </div>
                  </div>
                )}
            </div>

            {/* Full Progress Bar (si está en progreso) */}
            {assignment.progress !== undefined &&
              assignment.progress > 0 &&
              assignment.status !== 'completed' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progreso</span>
                    <span>{Math.round(assignment.progress)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        assignment.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300',
                      )}
                      style={{ width: `${assignment.progress}%` }}
                    />
                  </div>
                </div>
              )}
          </div>
        </CardContent>

        {/* Action Buttons (alternativos a swipe, accesibilidad) */}
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-200 hover:opacity-100 focus-within:opacity-100">
          {onView && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full touch-manipulation"
              onClick={(e) => {
                e.stopPropagation()
                haptics.light('view-button')
                onView()
              }}
              aria-label="Ver detalles"
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
          {rightAction && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full touch-manipulation bg-green-500 text-white hover:bg-green-600"
              onClick={(e) => {
                e.stopPropagation()
                haptics.medium('action-button')
                rightAction()
              }}
              aria-label={rightActionLabel}
            >
              {(() => {
                const Icon = rightActionIcon
                return <Icon className="h-4 w-4" />
              })()}
            </Button>
          )}
        </div>
      </Card>
      </motion.div>
    </div>
  )
}

export default AssignmentCard

