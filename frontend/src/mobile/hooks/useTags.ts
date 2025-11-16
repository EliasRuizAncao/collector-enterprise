/**
 * useTags - Hook para gestionar tags
 * Maneja CRUD de tags, persistencia y sugerencias
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Tag, TagColor } from '../types/tags'
import { SYSTEM_TAGS } from '../types/tags'

const STORAGE_KEY = 'collector-tags'

/**
 * Hook para gestionar tags
 */
export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar tags desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convertir fechas de string a Date
        const tagsWithDates = parsed.map((tag: any) => ({
          ...tag,
          createdAt: new Date(tag.createdAt),
          updatedAt: new Date(tag.updatedAt),
        }))
        setTags(tagsWithDates)
      } else {
        // Inicializar con tags del sistema
        setTags(SYSTEM_TAGS)
      }
    } catch (error) {
      console.error('Error al cargar tags:', error)
      setTags(SYSTEM_TAGS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Guardar tags en localStorage
  const saveTags = useCallback((newTags: Tag[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTags))
      setTags(newTags)
    } catch (error) {
      console.error('Error al guardar tags:', error)
    }
  }, [])

  // Obtener todos los tags (sistema + custom)
  const allTags = useMemo(() => {
    return [...tags]
  }, [tags])

  // Obtener solo tags del sistema
  const systemTags = useMemo(() => {
    return tags.filter((tag) => tag.isSystem)
  }, [tags])

  // Obtener solo tags custom
  const customTags = useMemo(() => {
    return tags.filter((tag) => !tag.isSystem)
  }, [tags])

  // Crear nuevo tag
  const createTag = useCallback(
    (name: string, color: TagColor, icon?: string): Tag => {
      const newTag: Tag = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        color,
        icon,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      }

      const updatedTags = [...tags, newTag]
      saveTags(updatedTags)
      return newTag
    },
    [tags, saveTags],
  )

  // Actualizar tag
  const updateTag = useCallback(
    (id: string, updates: Partial<Pick<Tag, 'name' | 'color' | 'icon'>>) => {
      const updatedTags = tags.map((tag) => {
        if (tag.id === id) {
          return {
            ...tag,
            ...updates,
            updatedAt: new Date(),
          }
        }
        return tag
      })
      saveTags(updatedTags)
    },
    [tags, saveTags],
  )

  // Eliminar tag (solo custom)
  const deleteTag = useCallback(
    (id: string) => {
      const tag = tags.find((t) => t.id === id)
      if (tag?.isSystem) {
        throw new Error('No se pueden eliminar tags del sistema')
      }

      const updatedTags = tags.filter((tag) => tag.id !== id)
      saveTags(updatedTags)
    },
    [tags, saveTags],
  )

  // Obtener tag por ID
  const getTagById = useCallback(
    (id: string): Tag | undefined => {
      return tags.find((tag) => tag.id === id)
    },
    [tags],
  )

  // Incrementar contador de uso
  const incrementUsage = useCallback(
    (id: string) => {
      const updatedTags = tags.map((tag) => {
        if (tag.id === id) {
          return {
            ...tag,
            usageCount: (tag.usageCount || 0) + 1,
          }
        }
        return tag
      })
      saveTags(updatedTags)
    },
    [tags, saveTags],
  )

  // Sugerir tags basados en contexto
  const suggestTags = useCallback(
    (context: {
      formName?: string
      content?: string
      similarTaskTags?: string[]
    }): Tag[] => {
      const suggestions: Tag[] = []

      // Sugerir basado en nombre del formulario
      if (context.formName) {
        const formNameLower = context.formName.toLowerCase()
        
        // Buscar tags que coincidan con palabras clave
        tags.forEach((tag) => {
          const tagNameLower = tag.name.toLowerCase()
          if (formNameLower.includes(tagNameLower) || tagNameLower.includes(formNameLower)) {
            if (!suggestions.find((s) => s.id === tag.id)) {
              suggestions.push(tag)
            }
          }
        })
      }

      // Sugerir basado en tags de tareas similares
      if (context.similarTaskTags && context.similarTaskTags.length > 0) {
        context.similarTaskTags.forEach((tagId) => {
          const tag = getTagById(tagId)
          if (tag && !suggestions.find((s) => s.id === tag.id)) {
            suggestions.push(tag)
          }
        })
      }

      // Si no hay sugerencias, sugerir los más usados
      if (suggestions.length === 0) {
        const sortedByUsage = [...tags]
          .filter((tag) => (tag.usageCount || 0) > 0)
          .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
          .slice(0, 3)
        suggestions.push(...sortedByUsage)
      }

      return suggestions
    },
    [tags, getTagById],
  )

  return {
    tags: allTags,
    systemTags,
    customTags,
    isLoading,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    incrementUsage,
    suggestTags,
  }
}

