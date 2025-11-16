/**
 * UpdatePrompt - Componente para mostrar prompt de actualización
 */

import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { useServiceWorker } from '../hooks/useServiceWorker'

export interface UpdatePromptProps {
  /** Si mostrar automáticamente cuando hay actualización */
  autoShow?: boolean
  /** Callback cuando se actualiza */
  onUpdate?: () => void
  /** Callback cuando se cancela */
  onCancel?: () => void
}

const UpdatePrompt = ({
  autoShow = true,
  onUpdate,
  onCancel,
}: UpdatePromptProps) => {
  const { needsUpdate, updateApp, isInstalling } = useServiceWorker()
  const [isOpen, setIsOpen] = useState(false)

  // Mostrar automáticamente si hay actualización
  useEffect(() => {
    if (autoShow && needsUpdate) {
      setIsOpen(true)
    }
  }, [autoShow, needsUpdate])

  const handleUpdate = async () => {
    await updateApp()
    setIsOpen(false)
    onUpdate?.()
  }

  const handleCancel = () => {
    setIsOpen(false)
    onCancel?.()
  }

  if (!needsUpdate) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva versión disponible</DialogTitle>
          <DialogDescription>
            Hay una nueva versión de la aplicación disponible. ¿Deseas actualizar ahora?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            La aplicación se recargará automáticamente después de la actualización.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isInstalling}>
            <X className="mr-2 h-4 w-4" />
            Después
          </Button>
          <Button onClick={handleUpdate} disabled={isInstalling}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isInstalling && 'animate-spin')} />
            Actualizar ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { cn } from '@/shared/lib/utils'

export default UpdatePrompt

