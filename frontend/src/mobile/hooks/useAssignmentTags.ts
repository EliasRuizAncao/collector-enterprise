/**
 * useAssignmentTags - Hook para gestionar tags de assignments
 * Persiste tags por assignment en localStorage
 */

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'collector-assignment-tags'

/**
 * Hook para gestionar tags de assignments
 */
export const useAssignmentTags = () => {
  const [assignmentTags, setAssignmentTags] = useState<Record<string, string[]>>({})

  // Cargar tags desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setAssignmentTags(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error al cargar tags de assignments:', error)
    }
  }, [])

  // Guardar tags en localStorage
  const saveTags = useCallback((newTags: Record<string, string[]>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTags))
      setAssignmentTags(newTags)
    } catch (error) {
      console.error('Error al guardar tags de assignments:', error)
    }
  }, [])

  // Obtener tags de un assignment
  const getTags = useCallback(
    (assignmentId: string): string[] => {
      return assignmentTags[assignmentId] || []
    },
    [assignmentTags],
  )

  // Establecer tags de un assignment
  const setTags = useCallback(
    (assignmentId: string, tagIds: string[]) => {
      const newTags = {
        ...assignmentTags,
        [assignmentId]: tagIds,
      }
      saveTags(newTags)
    },
    [assignmentTags, saveTags],
  )

  // Agregar tag a un assignment
  const addTag = useCallback(
    (assignmentId: string, tagId: string) => {
      const currentTags = getTags(assignmentId)
      if (!currentTags.includes(tagId)) {
        setTags(assignmentId, [...currentTags, tagId])
      }
    },
    [getTags, setTags],
  )

  // Eliminar tag de un assignment
  const removeTag = useCallback(
    (assignmentId: string, tagId: string) => {
      const currentTags = getTags(assignmentId)
      setTags(
        assignmentId,
        currentTags.filter((id) => id !== tagId),
      )
    },
    [getTags, setTags],
  )

  // Eliminar todos los tags de un assignment
  const clearTags = useCallback(
    (assignmentId: string) => {
      setTags(assignmentId, [])
    },
    [setTags],
  )

  return {
    getTags,
    setTags,
    addTag,
    removeTag,
    clearTags,
  }
}

