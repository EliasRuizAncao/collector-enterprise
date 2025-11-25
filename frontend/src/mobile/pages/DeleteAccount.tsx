/**
 * Página de Eliminar Cuenta - Mobile
 * Confirmación y eliminación de cuenta de usuario
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
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
import { Checkbox } from '@/shared/components/ui/checkbox'
import { useToast } from '@/shared/components/ui/use-toast'
import { useAuthStore } from '@/shared/store/authStore'
import api from '@/shared/lib/api'

/**
 * Página de Eliminar Cuenta
 */
const DeleteAccount = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { logout, user } = useAuthStore()

  const [confirmText, setConfirmText] = useState('')
  const [acknowledgments, setAcknowledgments] = useState({
    understand: false,
    dataLoss: false,
    permanent: false,
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFinalConfirm, setShowFinalConfirm] = useState(false)

  const requiredText = 'ELIMINAR'
  const canDelete =
    confirmText === requiredText &&
    acknowledgments.understand &&
    acknowledgments.dataLoss &&
    acknowledgments.permanent

  // Eliminar cuenta
  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true)

      // Endpoint a implementar en backend: DELETE /auth/me
      await api.delete('/auth/me', {
        data: {
          confirmText,
          acknowledgments,
        },
      })

      toast({
        title: 'Cuenta eliminada',
        description: 'Tu cuenta ha sido eliminada exitosamente',
      })

      // Cerrar sesión y redirigir
      logout()
      navigate('/login')
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.response?.data?.error || 'No se pudo eliminar la cuenta',
        variant: 'destructive',
      })
      setIsDeleting(false)
      setShowFinalConfirm(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-xl font-bold text-destructive">Eliminar Cuenta</h1>
      </div>

      {/* Contenido */}
      <div className="flex-1 space-y-6 p-4">
        {/* Advertencia principal */}
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-destructive">
                  Esta acción no se puede deshacer
                </p>
                <p className="text-sm text-muted-foreground">
                  Eliminar tu cuenta es permanente. Todos tus datos, formularios,
                  respuestas y configuraciones serán eliminados de forma permanente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consecuencias */}
        <Card>
          <CardHeader>
            <CardTitle>¿Qué se eliminará?</CardTitle>
            <CardDescription>
              Al eliminar tu cuenta, se perderá permanentemente:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Tu perfil y datos personales</p>
                <p className="text-sm text-muted-foreground">
                  Nombre, email, configuración y preferencias
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Todos tus formularios y respuestas</p>
                <p className="text-sm text-muted-foreground">
                  Formularios completados, borradores y datos asociados
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Fotos y archivos adjuntos</p>
                <p className="text-sm text-muted-foreground">
                  Todas las imágenes y documentos subidos
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Historial y estadísticas</p>
                <p className="text-sm text-muted-foreground">
                  Registro de actividades y métricas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternativas */}
        <Card>
          <CardHeader>
            <CardTitle>Antes de eliminar, considera:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Exportar tus datos</p>
                <p className="text-sm text-muted-foreground">
                  Puedes exportar todos tus datos antes de eliminar la cuenta
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Desactivar temporalmente</p>
                <p className="text-sm text-muted-foreground">
                  Contacta al soporte si solo necesitas una pausa temporal
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Abrir email de soporte
                window.location.href = 'mailto:soporte@collector.amaranto.com?subject=Soporte - Eliminación de Cuenta'
              }}
            >
              Contactar soporte
            </Button>
          </CardContent>
        </Card>

        {/* Confirmación */}
        <Card>
          <CardHeader>
            <CardTitle>Confirmar eliminación</CardTitle>
            <CardDescription>
              Para confirmar, completa los siguientes pasos:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                Escribe <strong>{requiredText}</strong> para confirmar:
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={requiredText}
                className={confirmText !== requiredText && confirmText.length > 0 ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="understand"
                  checked={acknowledgments.understand}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, understand: !!checked }))
                  }
                  className="mt-1"
                />
                <Label htmlFor="understand" className="cursor-pointer">
                  Entiendo que esta acción es permanente e irreversible
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="dataLoss"
                  checked={acknowledgments.dataLoss}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, dataLoss: !!checked }))
                  }
                  className="mt-1"
                />
                <Label htmlFor="dataLoss" className="cursor-pointer">
                  Entiendo que perderé todos mis datos y no podré recuperarlos
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="permanent"
                  checked={acknowledgments.permanent}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, permanent: !!checked }))
                  }
                  className="mt-1"
                />
                <Label htmlFor="permanent" className="cursor-pointer">
                  Quiero eliminar mi cuenta permanentemente
                </Label>
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowFinalConfirm(true)}
              disabled={!canDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar mi cuenta
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmación final */}
      <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ¿Estás completamente seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta es tu última oportunidad. Una vez que confirmes, tu cuenta y todos
                tus datos serán eliminados permanentemente.
              </p>
              <p className="font-medium">
                Esta acción no se puede deshacer bajo ninguna circunstancia.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DeleteAccount

