/**
 * useSort - Hook para ordenar datos
 * Proporciona funciones de ordenamiento reutilizables
 */

import { useMemo } from 'react'
import type { SortDirection } from '../components/SortOptions'
import type { Assignment } from '../components/AssignmentCard'

/**
 * Ordenar asignaciones
 */
export const sortAssignments = (
  assignments: Assignment[],
  sort: string,
  direction: SortDirection,
): Assignment[] => {
  const sorted = [...assignments]

  switch (sort) {
    case 'dueDate':
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        const dateA = new Date(a.dueDate).getTime()
        const dateB = new Date(b.dueDate).getTime()
        return direction === 'asc' ? dateA - dateB : dateB - dateA
      })
      break

    case 'priority':
      const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 }
      sorted.sort((a, b) => {
        const priorityA = priorityOrder[a.priority || 'low'] || 0
        const priorityB = priorityOrder[b.priority || 'low'] || 0
        return direction === 'asc' ? priorityA - priorityB : priorityB - priorityA
      })
      break

    case 'progress':
      sorted.sort((a, b) => {
        const progressA = a.completedFields && a.totalFields ? (a.completedFields / a.totalFields) * 100 : 0
        const progressB = b.completedFields && b.totalFields ? (b.completedFields / b.totalFields) * 100 : 0
        return direction === 'asc' ? progressA - progressB : progressB - progressA
      })
      break

    case 'status':
      const statusOrder: Record<string, number> = { pending: 1, in_progress: 2, completed: 3 }
      sorted.sort((a, b) => {
        const statusA = statusOrder[a.status] || 0
        const statusB = statusOrder[b.status] || 0
        return direction === 'asc' ? statusA - statusB : statusB - statusA
      })
      break

    case 'date_recent':
      sorted.sort((a, b) => {
        const dateA = new Date(a.assignedAt).getTime()
        const dateB = new Date(b.assignedAt).getTime()
        return dateB - dateA // Más reciente primero
      })
      break

    case 'date_oldest':
      sorted.sort((a, b) => {
        const dateA = new Date(a.assignedAt).getTime()
        const dateB = new Date(b.assignedAt).getTime()
        return dateA - dateB // Más antigua primero
      })
      break

    case 'name_asc':
      sorted.sort((a, b) => {
        return a.formName.localeCompare(b.formName, 'es', { sensitivity: 'base' })
      })
      break

    case 'name_desc':
      sorted.sort((a, b) => {
        return b.formName.localeCompare(a.formName, 'es', { sensitivity: 'base' })
      })
      break

    default:
      // Sin ordenamiento
      break
  }

  return sorted
}

/**
 * Ordenar actividades de historial
 */
export const sortActivities = <T extends { timestamp: Date; type?: string; title?: string }>(
  activities: T[],
  sort: string,
  direction: SortDirection,
): T[] => {
  const sorted = [...activities]

  switch (sort) {
    case 'date_recent':
      sorted.sort((a, b) => {
        return b.timestamp.getTime() - a.timestamp.getTime()
      })
      break

    case 'date_oldest':
      sorted.sort((a, b) => {
        return a.timestamp.getTime() - b.timestamp.getTime()
      })
      break

    case 'type':
      sorted.sort((a, b) => {
        const typeA = a.type || ''
        const typeB = b.type || ''
        return direction === 'asc'
          ? typeA.localeCompare(typeB, 'es', { sensitivity: 'base' })
          : typeB.localeCompare(typeA, 'es', { sensitivity: 'base' })
      })
      break

    case 'name_asc':
      sorted.sort((a, b) => {
        const nameA = a.title || ''
        const nameB = b.title || ''
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' })
      })
      break

    case 'name_desc':
      sorted.sort((a, b) => {
        const nameA = a.title || ''
        const nameB = b.title || ''
        return nameB.localeCompare(nameA, 'es', { sensitivity: 'base' })
      })
      break

    default:
      // Sin ordenamiento
      break
  }

  return sorted
}

/**
 * Ordenar notificaciones
 */
export const sortNotifications = <T extends { timestamp: Date; title?: string; type?: string }>(
  notifications: T[],
  sort: string,
  direction: SortDirection,
): T[] => {
  const sorted = [...notifications]

  switch (sort) {
    case 'date_recent':
      sorted.sort((a, b) => {
        return b.timestamp.getTime() - a.timestamp.getTime()
      })
      break

    case 'date_oldest':
      sorted.sort((a, b) => {
        return a.timestamp.getTime() - b.timestamp.getTime()
      })
      break

    case 'name_asc':
      sorted.sort((a, b) => {
        const nameA = a.title || ''
        const nameB = b.title || ''
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' })
      })
      break

    case 'name_desc':
      sorted.sort((a, b) => {
        const nameA = a.title || ''
        const nameB = b.title || ''
        return nameB.localeCompare(nameA, 'es', { sensitivity: 'base' })
      })
      break

    default:
      // Sin ordenamiento
      break
  }

  return sorted
}

