/**
 * TagManager - Componente para gestionar tags en Settings
 * Permite editar, eliminar y ver estadísticas de tags
 */

import { useState, useMemo } from 'react'
import { Edit2, Trash2, Tag as TagIcon, TrendingUp } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Separator } from '@/shared/components/ui/separator'
import { useTags } from '../hooks/useTags'
import type { Tag, TagColor } from '../types/tags'
import { TAG_COLORS } from '../types/tags'
import * as LucideIcons from 'lucide-react'

/**
 * Obtener icono por nombre
 */
const getIcon = (iconName?: string) => {
  if (!iconName) return null
  const IconComponent = (LucideIcons as any)[iconName]
  return IconComponent ? <IconComponent className="h-4 w-4" /> : null
}

/**
 * Componente TagManager
 */
const TagManager = () => {
  const { tags, systemTags, customTags, updateTag, deleteTag } = useTags()
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState<TagColor>('blue')
  const [editIcon, setEditIcon] = useState('')

  // Colores disponibles
  const availableColors: TagColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray']

  // Abrir diálogo de edición
  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setEditName(tag.name)
    setEditColor(tag.color)
    setEditIcon(tag.icon || '')
  }

  // Guardar edición
  const handleSaveEdit = () => {
    if (!editingTag) return

    updateTag(editingTag.id, {
      name: editName.trim(),
      color: editColor,
      icon: editIcon || undefined,
    })

    setEditingTag(null)
    setEditName('')
    setEditColor('blue')
    setEditIcon('')
  }

  // Confirmar eliminación
  const handleConfirmDelete = () => {
    if (!deletingTag) return

    try {
      deleteTag(deletingTag.id)
      setDeletingTag(null)
    } catch (error: any) {
      alert(error.message)
    }
  }

  // Tags ordenados por uso
  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => {
      // Tags del sistema primero
      if (a.isSystem && !b.isSystem) return -1
      if (!a.isSystem && b.isSystem) return 1
      // Luego por uso
      return (b.usageCount || 0) - (a.usageCount || 0)
    })
  }, [tags])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Gestión de Tags</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Administra tus tags personalizados y visualiza estadísticas de uso
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemTags.length} sistema, {customTags.length} personalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tags más usados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags.filter((t) => (t.usageCount || 0) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Con uso registrado</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Todos los tags</h3>

        <div className="space-y-3">
          {sortedTags.map((tag) => {
            const colorConfig = TAG_COLORS[tag.color]
            const icon = getIcon(tag.icon)

            return (
              <Card key={tag.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Tag visual */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg border flex-shrink-0',
                          colorConfig.bg,
                          colorConfig.border,
                        )}
                      >
                        {icon ? (
                          <span className={colorConfig.text}>{icon}</span>
                        ) : (
                          <TagIcon className={cn('h-5 w-5', colorConfig.text)} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{tag.name}</p>
                          {tag.isSystem && (
                            <Badge variant="secondary" className="text-xs">
                              Sistema
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground capitalize">
                            {tag.color}
                          </span>
                          {tag.usageCount !== undefined && tag.usageCount > 0 && (
                            <>
                              <Separator orientation="vertical" className="h-3" />
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                {tag.usageCount} uso{tag.usageCount !== 1 ? 's' : ''}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(tag)}
                        className="h-9 w-9"
                        aria-label={`Editar tag ${tag.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {!tag.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingTag(tag)}
                          className="h-9 w-9 text-destructive"
                          aria-label={`Eliminar tag ${tag.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Dialog de edición */}
      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar tag</DialogTitle>
            <DialogDescription>
              Modifica el nombre, color o icono del tag
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name">Nombre</Label>
              <Input
                id="edit-tag-name"
                placeholder="Nombre del tag"
                value={editName}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 20) {
                    setEditName(value)
                  }
                }}
                maxLength={20}
                disabled={editingTag?.isSystem}
              />
              <p className="text-xs text-muted-foreground">
                {editName.length}/20 caracteres
                {editingTag?.isSystem && ' (Los tags del sistema no se pueden renombrar)'}
              </p>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <RadioGroup
                value={editColor}
                onValueChange={(value) => setEditColor(value as TagColor)}
              >
                <div className="grid grid-cols-4 gap-2">
                  {availableColors.map((color) => {
                    const colorConfig = TAG_COLORS[color]
                    return (
                      <label
                        key={color}
                        className={cn(
                          'flex items-center justify-center h-12 rounded-lg border-2 cursor-pointer transition-all',
                          editColor === color
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-border',
                          colorConfig.bg,
                        )}
                      >
                        <RadioGroupItem value={color} id={`edit-color-${color}`} className="sr-only" />
                        <div className={cn('h-6 w-6 rounded-full border-2', colorConfig.border)} />
                      </label>
                    )
                  })}
                </div>
              </RadioGroup>
            </div>

            {/* Icono */}
            <div className="space-y-2">
              <Label htmlFor="edit-tag-icon">Icono (opcional)</Label>
              <Input
                id="edit-tag-icon"
                placeholder="Ej: Star, Heart, Flag"
                value={editIcon}
                onChange={(e) => setEditIcon(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nombre del icono de lucide-react (opcional)
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditingTag(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!deletingTag} onOpenChange={(open) => !open && setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tag?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar el tag "{deletingTag?.name}"? Esta acción no se
              puede deshacer y el tag se eliminará de todas las tareas que lo usen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default TagManager

