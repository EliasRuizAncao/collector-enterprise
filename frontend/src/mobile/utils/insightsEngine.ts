/**
 * insightsEngine.ts - Motor de generación de insights automáticos
 * Analiza datos del usuario y genera insights relevantes y accionables
 */

import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, subDays, subWeeks, subMonths, isToday, isTomorrow, getDay, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Tipo de insight
 */
export type InsightType = 'productivity' | 'pattern' | 'alert' | 'motivational' | 'recommendation'

/**
 * Categoría de insight (para filtrado)
 */
export type InsightCategory = 'positive' | 'warning' | 'info' | 'urgent'

/**
 * Insight generado
 */
export interface Insight {
  id: string
  type: InsightType
  category: InsightCategory
  title: string
  message: string
  icon?: string
  action?: {
    label: string
    onClick?: () => void
  }
  dismissible?: boolean
  priority?: number // 1-10, mayor = más importante
  timestamp: Date
}

/**
 * Datos del usuario para análisis
 */
export interface UserData {
  assignments: Array<{
    id: string
    formName: string
    status: 'pending' | 'in_progress' | 'completed'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    dueDate?: string
    completedAt?: string
    assignedAt?: string
    progress?: number
    location?: string
  }>
  lastSyncDate?: Date
  isOnline?: boolean
  activeHours?: number
  teamAverage?: number
}

/**
 * Motor de generación de insights
 */
export class InsightsEngine {
  private seenInsights: Set<string> = new Set()

  /**
   * Generar todos los insights relevantes
   */
  generateInsights(userData: UserData): Insight[] {
    const insights: Insight[] = []

    // Limpiar insights vistos antiguos (más de 7 días)
    this.cleanOldSeenInsights()

    // 1. Análisis de productividad
    insights.push(...this.generateProductivityInsights(userData))

    // 2. Detección de patrones
    insights.push(...this.generatePatternInsights(userData))

    // 3. Alertas importantes
    insights.push(...this.generateAlertInsights(userData))

    // 4. Insights motivacionales
    insights.push(...this.generateMotivationalInsights(userData))

    // 5. Recomendaciones
    insights.push(...this.generateRecommendationInsights(userData))

    // Filtrar insights ya vistos y ordenar por prioridad
    return insights
      .filter((insight) => !this.seenInsights.has(insight.id))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 10) // Máximo 10 insights
  }

  /**
   * Generar insights de productividad
   */
  private generateProductivityInsights(userData: UserData): Insight[] {
    const insights: Insight[] = []
    const assignments = userData.assignments

    // Comparar con semana pasada
    const thisWeekStart = startOfWeek(new Date(), { locale: es })
    const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { locale: es })
    const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { locale: es })

    const thisWeekCompleted = assignments.filter(
      (a) =>
        a.status === 'completed' &&
        a.completedAt &&
        new Date(a.completedAt) >= thisWeekStart,
    ).length

    const lastWeekCompleted = assignments.filter(
      (a) =>
        a.status === 'completed' &&
        a.completedAt &&
        new Date(a.completedAt) >= lastWeekStart &&
        new Date(a.completedAt) <= lastWeekEnd,
    ).length

    if (lastWeekCompleted > 0 && thisWeekCompleted > lastWeekCompleted) {
      const improvement = Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
      insights.push({
        id: `productivity-improvement-${format(new Date(), 'yyyy-MM-dd')}`,
        type: 'productivity',
        category: 'positive',
        title: 'Mejora de productividad',
        message: `Completaste ${improvement}% más tareas que la semana pasada`,
        icon: 'TrendingUp',
        priority: 7,
        timestamp: new Date(),
        dismissible: true,
      })
    }

    // Mejor día de la semana
    const bestDay = this.findBestDay(assignments)
    if (bestDay) {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      insights.push({
        id: `pattern-best-day-${bestDay.day}`,
        type: 'pattern',
        category: 'info',
        title: 'Tu mejor día',
        message: `Tu mejor día es ${dayNames[bestDay.day]} (promedio ${bestDay.average} tareas)`,
        icon: 'Calendar',
        priority: 5,
        timestamp: new Date(),
        dismissible: true,
      })
    }

    // Mejora en tiempo promedio
    const timeImprovement = this.calculateTimeImprovement(assignments)
    if (timeImprovement && timeImprovement.improvement > 0) {
      insights.push({
        id: `productivity-time-improvement-${format(new Date(), 'yyyy-MM-dd')}`,
        type: 'productivity',
        category: 'positive',
        title: 'Tiempo mejorado',
        message: `Tu tiempo promedio mejoró en ${timeImprovement.improvement} minutos`,
        icon: 'Clock',
        priority: 6,
        timestamp: new Date(),
        dismissible: true,
      })
    }

    return insights
  }

  /**
   * Generar insights de patrones
   */
  private generatePatternInsights(userData: UserData): Insight[] {
    const insights: Insight[] = []
    const assignments = userData.assignments

    // Tareas más rápidas por tipo
    const fastestType = this.findFastestTaskType(assignments)
    if (fastestType) {
      insights.push({
        id: `pattern-fastest-type-${fastestType.type}`,
        type: 'pattern',
        category: 'info',
        title: 'Tareas más rápidas',
        message: `Tus tareas más rápidas son tipo "${fastestType.type}"`,
        icon: 'Zap',
        priority: 4,
        timestamp: new Date(),
        dismissible: true,
      })
    }

    // Mejor momento del día
    const bestTimeOfDay = this.findBestTimeOfDay(assignments)
    if (bestTimeOfDay) {
      insights.push({
        id: `pattern-best-time-${bestTimeOfDay}`,
        type: 'pattern',
        category: 'info',
        title: 'Mejor momento',
        message: `Completas más tareas en la ${bestTimeOfDay}`,
        icon: 'Sun',
        priority: 4,
        timestamp: new Date(),
        dismissible: true,
      })
    }

    // Mejor día para tasa de acierto
    const bestAccuracyDay = this.findBestAccuracyDay(assignments)
    if (bestAccuracyDay) {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      insights.push({
        id: `pattern-accuracy-day-${bestAccuracyDay.day}`,
        type: 'pattern',
        category: 'info',
        title: 'Día más preciso',
        message: `Tienes mejor tasa de acierto los ${dayNames[bestAccuracyDay.day]}`,
        icon: 'Target',
        priority: 5,
        timestamp: new Date(),
        dismissible: true,
      })
    }

    return insights
  }

  /**
   * Generar alertas importantes
   */
  private generateAlertInsights(userData: UserData): Insight[] {
    const insights: Insight[] = []
    const assignments = userData.assignments

    // Tareas que vencen mañana
    const tomorrow = startOfDay(isTomorrow(new Date()) ? new Date() : subDays(new Date(), 1))
    const tomorrowEnd = endOfDay(tomorrow)
    const urgentTasks = assignments.filter(
      (a) =>
        a.status !== 'completed' &&
        a.dueDate &&
        new Date(a.dueDate) >= tomorrow &&
        new Date(a.dueDate) <= tomorrowEnd,
    )

    if (urgentTasks.length > 0) {
      insights.push({
        id: `alert-urgent-tomorrow-${format(tomorrow, 'yyyy-MM-dd')}`,
        type: 'alert',
        category: 'urgent',
        title: 'Tareas urgentes',
        message: `Tienes ${urgentTasks.length} tarea${urgentTasks.length !== 1 ? 's' : ''} que vencen mañana`,
        icon: 'AlertTriangle',
        priority: 9,
        timestamp: new Date(),
        dismissible: false,
        action: {
          label: 'Ver tareas',
        },
      })
    }

    // No ha completado tareas hoy
    const todayCompleted = assignments.filter(
      (a) => a.status === 'completed' && a.completedAt && isToday(new Date(a.completedAt)),
    ).length

    if (todayCompleted === 0) {
      insights.push({
        id: `alert-no-tasks-today-${format(new Date(), 'yyyy-MM-dd')}`,
        type: 'alert',
        category: 'warning',
        title: 'Sin actividad hoy',
        message: 'No has completado tareas hoy',
        icon: 'Clock',
        priority: 6,
        timestamp: new Date(),
        dismissible: true,
        action: {
          label: 'Ver tareas',
        },
      })
    }

    // No sincronizado
    if (userData.lastSyncDate) {
      const daysSinceSync = Math.floor(
        (new Date().getTime() - userData.lastSyncDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (daysSinceSync >= 2) {
        insights.push({
          id: `alert-no-sync-${daysSinceSync}`,
          type: 'alert',
          category: 'warning',
          title: 'Sincronización pendiente',
          message: `Llevas ${daysSinceSync} días sin sincronizar`,
          icon: 'WifiOff',
          priority: 7,
          timestamp: new Date(),
          dismissible: true,
          action: {
            label: 'Sincronizar ahora',
          },
        })
      }
    }

    return insights
  }

  /**
   * Generar insights motivacionales
   */
  private generateMotivationalInsights(userData: UserData): Insight[] {
    const insights: Insight[] = []
    const assignments = userData.assignments

    // Racha de días
    const streak = this.calculateStreak(assignments)
    if (streak >= 3) {
      insights.push({
        id: `motivational-streak-${streak}`,
        type: 'motivational',
        category: 'positive',
        title: '¡Racha activa!',
        message: `¡Racha de ${streak} día${streak !== 1 ? 's' : ''}! Sigue así`,
        icon: 'Flame',
        priority: 8,
        timestamp: new Date(),
        dismissible: true,
      })
    }

    // Cerca del récord personal
    const record = this.getPersonalRecord(assignments)
    const todayCount = assignments.filter(
      (a) => a.status === 'completed' && a.completedAt && isToday(new Date(a.completedAt)),
    ).length

    if (record > 0 && todayCount > 0 && record - todayCount <= 3 && record - todayCount > 0) {
      const remaining = record - todayCount
      insights.push({
        id: `motivational-record-${remaining}`,
        type: 'motivational',
        category: 'positive',
        title: 'Cerca del récord',
        message: `Estás a ${remaining} tarea${remaining !== 1 ? 's' : ''} de tu récord personal`,
        icon: 'Trophy',
        priority: 7,
        timestamp: new Date(),
        dismissible: true,
      })
    }

    // Comparación con equipo (si hay datos)
    if (userData.teamAverage !== undefined) {
      const userAverage = this.calculateWeeklyAverage(assignments)
      if (userAverage > userData.teamAverage * 1.2) {
        insights.push({
          id: `motivational-team-leader-${format(new Date(), 'yyyy-MM-dd')}`,
          type: 'motivational',
          category: 'positive',
          title: 'Líder del equipo',
          message: 'Eres el más rápido del equipo esta semana',
          icon: 'Crown',
          priority: 8,
          timestamp: new Date(),
          dismissible: true,
        })
      }
    }

    return insights
  }

  /**
   * Generar recomendaciones
   */
  private generateRecommendationInsights(userData: UserData): Insight[] {
    const insights: Insight[] = []
    const assignments = userData.assignments

    // Tarea urgente recomendada
    const urgentTask = assignments
      .filter((a) => a.status !== 'completed' && a.priority === 'urgent')
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        return 0
      })[0]

    if (urgentTask) {
      insights.push({
        id: `recommendation-urgent-${urgentTask.id}`,
        type: 'recommendation',
        category: 'urgent',
        title: 'Tarea urgente',
        message: `Considera completar "${urgentTask.formName}" primero (es urgente)`,
        icon: 'AlertCircle',
        priority: 9,
        timestamp: new Date(),
        dismissible: true,
        action: {
          label: 'Ver tarea',
        },
      })
    }

    // Recomendación de sincronización
    if (userData.isOnline && userData.lastSyncDate) {
      const hoursSinceSync = (new Date().getTime() - userData.lastSyncDate.getTime()) / (1000 * 60 * 60)
      if (hoursSinceSync > 2 && hoursSinceSync < 6) {
        insights.push({
          id: `recommendation-sync-${format(new Date(), 'yyyy-MM-dd-HH')}`,
          type: 'recommendation',
          category: 'info',
          title: 'Sincronizar ahora',
          message: 'Sincroniza ahora, tienes buena conexión',
          icon: 'Wifi',
          priority: 5,
          timestamp: new Date(),
          dismissible: true,
          action: {
            label: 'Sincronizar',
          },
        })
      }
    }

    // Recomendación de descanso
    if (userData.activeHours && userData.activeHours >= 3) {
      insights.push({
        id: `recommendation-break-${format(new Date(), 'yyyy-MM-dd-HH')}`,
        type: 'recommendation',
        category: 'info',
        title: 'Toma un descanso',
        message: `Toma un descanso, llevas ${userData.activeHours} horas activo`,
        icon: 'Coffee',
        priority: 4,
        timestamp: new Date(),
        dismissible: true,
      })
    }

    return insights
  }

  /**
   * Encontrar mejor día de la semana
   */
  private findBestDay(assignments: any[]): { day: number; average: number } | null {
    const dayCounts: Record<number, number[]> = {}

    assignments
      .filter((a) => a.status === 'completed' && a.completedAt)
      .forEach((a) => {
        const day = getDay(new Date(a.completedAt!))
        if (!dayCounts[day]) {
          dayCounts[day] = []
        }
        dayCounts[day].push(1)
      })

    let bestDay: { day: number; average: number } | null = null
    let maxAverage = 0

    Object.entries(dayCounts).forEach(([day, counts]) => {
      const average = counts.length / 7 // Promedio semanal
      if (average > maxAverage) {
        maxAverage = average
        bestDay = { day: parseInt(day), average: Math.round(average * 10) / 10 }
      }
    })

    return bestDay
  }

  /**
   * Calcular mejora en tiempo
   */
  private calculateTimeImprovement(assignments: any[]): { improvement: number } | null {
    // Simulado - en producción vendría del backend
    // Comparar tiempo promedio de esta semana vs semana pasada
    const thisWeek = assignments.filter(
      (a) =>
        a.status === 'completed' &&
        a.completedAt &&
        new Date(a.completedAt) >= startOfWeek(new Date(), { locale: es }),
    )

    const lastWeek = assignments.filter(
      (a) =>
        a.status === 'completed' &&
        a.completedAt &&
        new Date(a.completedAt) >= startOfWeek(subWeeks(new Date(), 1), { locale: es }) &&
        new Date(a.completedAt) < startOfWeek(new Date(), { locale: es }),
    )

    // Simulado: asumir 25 min promedio, calcular mejora
    if (thisWeek.length > 0 && lastWeek.length > 0) {
      const improvement = Math.round(Math.random() * 20) // Simulado
      if (improvement > 0) {
        return { improvement }
      }
    }

    return null
  }

  /**
   * Encontrar tipo de tarea más rápida
   */
  private findFastestTaskType(assignments: any[]): { type: string; average: number } | null {
    const typeCounts: Record<string, number[]> = {}

    assignments
      .filter((a) => a.status === 'completed' && a.completedAt)
      .forEach((a) => {
        const type = a.formName.split(' ')[0] || 'General' // Simplificado
        if (!typeCounts[type]) {
          typeCounts[type] = []
        }
        typeCounts[type].push(1)
      })

    let fastest: { type: string; average: number } | null = null
    let maxCount = 0

    Object.entries(typeCounts).forEach(([type, counts]) => {
      if (counts.length > maxCount) {
        maxCount = counts.length
        fastest = { type, average: counts.length }
      }
    })

    return fastest
  }

  /**
   * Encontrar mejor momento del día
   */
  private findBestTimeOfDay(assignments: any[]): string | null {
    const timeCounts: Record<string, number> = {
      mañana: 0,
      tarde: 0,
      noche: 0,
    }

    assignments
      .filter((a) => a.status === 'completed' && a.completedAt)
      .forEach((a) => {
        const hour = new Date(a.completedAt!).getHours()
        if (hour >= 6 && hour < 12) {
          timeCounts.mañana++
        } else if (hour >= 12 && hour < 18) {
          timeCounts.tarde++
        } else {
          timeCounts.noche++
        }
      })

    const max = Math.max(...Object.values(timeCounts))
    if (max === 0) return null

    const best = Object.entries(timeCounts).find(([, count]) => count === max)
    return best ? best[0] : null
  }

  /**
   * Encontrar día con mejor tasa de acierto
   */
  private findBestAccuracyDay(assignments: any[]): { day: number; accuracy: number } | null {
    // Simulado - en producción calcularía tasa de errores/resubmisiones
    const dayAccuracy: Record<number, { total: number; correct: number }> = {}

    assignments
      .filter((a) => a.status === 'completed' && a.completedAt)
      .forEach((a) => {
        const day = getDay(new Date(a.completedAt!))
        if (!dayAccuracy[day]) {
          dayAccuracy[day] = { total: 0, correct: 0 }
        }
        dayAccuracy[day].total++
        // Simulado: 85% de acierto promedio
        if (Math.random() > 0.15) {
          dayAccuracy[day].correct++
        }
      })

    let bestDay: { day: number; accuracy: number } | null = null
    let maxAccuracy = 0

    Object.entries(dayAccuracy).forEach(([day, data]) => {
      const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0
      if (accuracy > maxAccuracy && data.total >= 3) {
        maxAccuracy = accuracy
        bestDay = { day: parseInt(day), accuracy: Math.round(accuracy) }
      }
    })

    return bestDay
  }

  /**
   * Calcular racha de días
   */
  private calculateStreak(assignments: any[]): number {
    let streak = 0
    const today = startOfDay(new Date())

    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(today, i)
      const hasCompleted = assignments.some(
        (a) =>
          a.status === 'completed' &&
          a.completedAt &&
          isSameDay(new Date(a.completedAt), checkDate),
      )

      if (hasCompleted) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    return streak
  }

  /**
   * Obtener récord personal
   */
  private getPersonalRecord(assignments: any[]): number {
    const dailyCounts: Record<string, number> = {}

    assignments
      .filter((a) => a.status === 'completed' && a.completedAt)
      .forEach((a) => {
        const dateKey = format(new Date(a.completedAt!), 'yyyy-MM-dd')
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1
      })

    return Math.max(...Object.values(dailyCounts), 0)
  }

  /**
   * Calcular promedio semanal
   */
  private calculateWeeklyAverage(assignments: any[]): number {
    const thisWeek = assignments.filter(
      (a) =>
        a.status === 'completed' &&
        a.completedAt &&
        new Date(a.completedAt) >= startOfWeek(new Date(), { locale: es }),
    ).length

    return thisWeek
  }

  /**
   * Limpiar insights vistos antiguos
   */
  private cleanOldSeenInsights() {
    // En producción, esto se haría con timestamps
    // Por ahora, simplemente limpiar si hay muchos
    if (this.seenInsights.size > 100) {
      this.seenInsights.clear()
    }
  }

  /**
   * Marcar insight como visto
   */
  markAsSeen(insightId: string) {
    this.seenInsights.add(insightId)
  }

  /**
   * Limpiar todos los insights vistos
   */
  clearSeenInsights() {
    this.seenInsights.clear()
  }
}

// Instancia singleton
export const insightsEngine = new InsightsEngine()

