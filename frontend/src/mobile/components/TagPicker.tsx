/**
 * TagPicker - Componente para seleccionar y crear tags
 * Sheet desde bottom con búsqueda, grid y creación de tags
 */

import { useState, useMemo, useCallback } from 'react'
import { Search, Plus, X, Check, Palette } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import type { Tag, TagColor, TagWithSelection } from '../types/tags'
import { TAG_COLORS, SYSTEM_TAGS } from '../types/tags'
import { useTags } from '../hooks/useTags'
import * as LucideIcons from 'lucide-react'

/**
 * Props del componente TagPicker
 */
export interface TagPickerProps {
  /** Tags seleccionados actualmente */
  selectedTagIds: string[]
  /** Callback cuando cambian los tags seleccionados */
  onChange: (tagIds: string[]) => void
  /** Si el sheet está abierto */
  open: boolean
  /** Callback para cerrar el sheet */
  onClose: () => void
  /** Título del sheet */
  title?: string
  /** Descripción del sheet */
  description?: string
  /** Contexto para sugerencias (opcional) */
  suggestionContext?: {
    formName?: string
    content?: string
    similarTaskTags?: string[]
  }
}

/**
 * Obtener icono por nombre
 */
const getIcon = (iconName?: string) => {
  if (!iconName) return null
  const IconComponent = (LucideIcons as any)[iconName]
  return IconComponent ? <IconComponent className="h-4 w-4" /> : null
}

/**
 * Componente TagPicker
 */
const TagPicker = ({
  selectedTagIds,
  onChange,
  open,
  onClose,
  title = 'Seleccionar tags',
  description = 'Elige tags para categorizar',
  suggestionContext,
}: TagPickerProps) => {
  const { tags, createTag, suggestTags } = useTags()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState<TagColor>('blue')
  const [newTagIcon, setNewTagIcon] = useState<string>('')

  // Tags con estado de selección
  const tagsWithSelection: TagWithSelection[] = useMemo(() => {
    return tags.map((tag) => ({
      ...tag,
      selected: selectedTagIds.includes(tag.id),
    }))
  }, [tags, selectedTagIds])

  // Tags filtrados por búsqueda
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return tagsWithSelection
    }

    const query = searchQuery.toLowerCase()
    return tagsWithSelection.filter(
      (tag) =>
        tag.name.toLowerCase().includes(query) ||
        tag.color.toLowerCase().includes(query),
    )
  }, [tagsWithSelection, searchQuery])

  // Tags seleccionados
  const selectedTags = useMemo(() => {
    return tagsWithSelection.filter((tag) => tag.selected)
  }, [tagsWithSelection])

  // Tags sugeridos
  const suggestedTags = useMemo(() => {
    if (!suggestionContext) return []
    return suggestTags(suggestionContext)
  }, [suggestionContext, suggestTags])

  // Toggle selección de tag
  const handleTagToggle = useCallback(
    (tagId: string) => {
      const isSelected = selectedTagIds.includes(tagId)
      if (isSelected) {
        onChange(selectedTagIds.filter((id) => id !== tagId))
      } else {
        onChange([...selectedTagIds, tagId])
      }
    },
    [selectedTagIds, onChange],
  )

  // Crear nuevo tag
  const handleCreateTag = useCallback(() => {
    if (!newTagName.trim()) return

    const newTag = createTag(newTagName, newTagColor, newTagIcon || undefined)
    onChange([...selectedTagIds, newTag.id])
    setNewTagName('')
    setNewTagColor('blue')
    setNewTagIcon('')
    setShowCreateDialog(false)
  }, [newTagName, newTagColor, newTagIcon, createTag, selectedTagIds, onChange])

  // Colores disponibles para picker
  const availableColors: TagColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray']

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent side="bottom" className="h-[80vh] max-h-[600px] p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <SheetHeader className="border-b border-border/60 px-4 py-3">
              <SheetTitle className="text-mobile-h3 font-semibold">{title}</SheetTitle>
              {description && (
                <SheetDescription className="text-sm">{description}</SheetDescription>
              )}
            </SheetHeader>

            {/* Búsqueda */}
            <div className="border-b border-border/60 px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Tags seleccionados */}
            {selectedTags.length > 0 && (
              <div className="border-b border-border/60 px-4 py-3">
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Seleccionados ({selectedTags.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => {
                    const colorConfig = TAG_COLORS[tag.color]
                    const icon = getIcon(tag.icon)

                    return (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className={cn(
                          'inline-flex items-center gap-1 border font-medium cursor-pointer',
                          'h-7 px-2.5 text-sm',
                          colorConfig.bg,
                          colorConfig.text,
                          colorConfig.border,
                        )}
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        {icon && <span>{icon}</span>}
                        <span>{tag.name}</span>
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tags sugeridos (si hay contexto) */}
            {suggestedTags.length > 0 && !searchQuery && (
              <div className="border-b border-border/60 px-4 py-3">
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Sugerencias
                </Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.slice(0, 5).map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    const colorConfig = TAG_COLORS[tag.color]
                    const icon = getIcon(tag.icon)

                    return (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className={cn(
                          'inline-flex items-center gap-1 border font-medium cursor-pointer transition-all',
                          'h-7 px-2.5 text-sm',
                          isSelected
                            ? cn(colorConfig.bg, colorConfig.text, colorConfig.border)
                            : 'bg-muted text-muted-foreground border-border',
                        )}
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        {icon && <span>{icon}</span>}
                        <span>{tag.name}</span>
                        {isSelected && <Check className="h-3 w-3 ml-1" />}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Grid de tags */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <Label className="text-xs font-semibold text-muted-foreground mb-3 block">
                {searchQuery ? `Resultados (${filteredTags.length})` : 'Todos los tags'}
              </Label>

              {filteredTags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No se encontraron tags</p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear "{searchQuery}"
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredTags.map((tag) => {
                    const colorConfig = TAG_COLORS[tag.color]
                    const icon = getIcon(tag.icon)

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border p-3 text-left transition-all touch-manipulation',
                          'hover:bg-accent active:scale-[0.98]',
                          tag.selected && 'ring-2 ring-primary ring-offset-2',
                          colorConfig.border,
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full border',
                            colorConfig.bg,
                            colorConfig.border,
                          )}
                        >
                          {icon ? (
                            <span className={colorConfig.text}>{icon}</span>
                          ) : (
                            <div
                              className={cn('h-4 w-4 rounded-full', colorConfig.bg, colorConfig.border)}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tag.name}</p>
                          {tag.isSystem && (
                            <p className="text-xs text-muted-foreground">Sistema</p>
                          )}
                        </div>
                        {tag.selected && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 px-4 py-3 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear tag
              </Button>
              <Button onClick={onClose} size="sm" className="flex-1">
                Aplicar ({selectedTags.length})
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog para crear nuevo tag */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear nuevo tag</DialogTitle>
            <DialogDescription>
              Crea un tag personalizado para categorizar tus tareas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nombre</Label>
              <Input
                id="tag-name"
                placeholder="Ej: Revisión pendiente"
                value={newTagName}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 20) {
                    setNewTagName(value)
                  }
                }}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                {newTagName.length}/20 caracteres
              </p>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <RadioGroup value={newTagColor} onValueChange={(value) => setNewTagColor(value as TagColor)}>
                <div className="grid grid-cols-4 gap-2">
                  {availableColors.map((color) => {
                    const colorConfig = TAG_COLORS[color]
                    return (
                      <label
                        key={color}
                        className={cn(
                          'flex items-center justify-center h-12 rounded-lg border-2 cursor-pointer transition-all',
                          newTagColor === color
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-border',
                          colorConfig.bg,
                        )}
                      >
                        <RadioGroupItem value={color} id={`color-${color}`} className="sr-only" />
                        <div
                          className={cn('h-6 w-6 rounded-full border-2', colorConfig.border)}
                        />
                      </label>
                    )
                  })}
                </div>
              </RadioGroup>
            </div>

            {/* Icono (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="tag-icon">Icono (opcional)</Label>
              <Input
                id="tag-icon"
                placeholder="Ej: Star, Heart, Flag"
                value={newTagIcon}
                onChange={(e) => setNewTagIcon(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nombre del icono de lucide-react (opcional)
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
              Crear tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TagPicker

