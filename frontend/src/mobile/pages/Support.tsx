/**
 * Página de Contactar Soporte - Mobile
 * Formulario y opciones para contactar al equipo de soporte
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Send,
  Camera,
  Paperclip,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Loader2,
  X,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useToast } from '@/shared/components/ui/use-toast'
import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import { useAuthStore } from '@/shared/store/authStore'

/**
 * Schema de validación del formulario
 */
const supportFormSchema = z.object({
  subject: z
    .string()
    .min(5, 'El asunto debe tener al menos 5 caracteres')
    .max(100, 'El asunto no puede exceder 100 caracteres'),
  category: z.enum([
    'technical',
    'account',
    'feature',
    'bug',
    'billing',
    'other',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  message: z
    .string()
    .min(20, 'El mensaje debe tener al menos 20 caracteres')
    .max(2000, 'El mensaje no puede exceder 2000 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
})

type SupportFormData = z.infer<typeof supportFormSchema>

/**
 * Categorías de soporte
 */
const categories = {
  technical: {
    label: 'Problema Técnico',
    description: 'La app no funciona correctamente',
    icon: AlertCircle,
  },
  account: {
    label: 'Cuenta y Acceso',
    description: 'Problemas con login, contraseña, etc.',
    icon: HelpCircle,
  },
  feature: {
    label: 'Solicitud de Función',
    description: 'Sugerir una nueva funcionalidad',
    icon: FileText,
  },
  bug: {
    label: 'Reportar Error',
    description: 'Encontré un bug o error',
    icon: AlertCircle,
  },
  billing: {
    label: 'Facturación',
    description: 'Preguntas sobre facturación',
    icon: FileText,
  },
  other: {
    label: 'Otro',
    description: 'Otra consulta',
    icon: MessageCircle,
  },
}

/**
 * Prioridades
 */
const priorities = {
  low: { label: 'Baja', description: 'No urgente' },
  medium: { label: 'Media', description: 'Normal' },
  high: { label: 'Alta', description: 'Importante' },
  urgent: { label: 'Urgente', description: 'Requiere atención inmediata' },
}

/**
 * Página principal de Soporte
 */
const Support = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SupportFormData>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      subject: '',
      category: 'other',
      priority: 'medium',
      message: '',
      email: user?.email || '',
      phone: '',
    },
  })

  const selectedCategory = watch('category')
  const selectedPriority = watch('priority')

  // Manejar envío del formulario
  const onSubmit = async (data: SupportFormData) => {
    try {
      setIsSubmitting(true)

      // Preparar datos del formulario
      const formData = new FormData()
      formData.append('subject', data.subject)
      formData.append('category', data.category)
      formData.append('priority', data.priority)
      formData.append('message', data.message)
      if (data.email) formData.append('email', data.email)
      if (data.phone) formData.append('phone', data.phone)
      formData.append('userId', user?.id || '')
      formData.append('userName', user?.name || '')

      // Agregar archivos adjuntos
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file)
      })

      // TODO: Reemplazar con endpoint real cuando esté disponible
      await api.post('/support/ticket', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // En desarrollo, simular éxito
      if (import.meta.env.DEV) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      toast({
        title: 'Ticket enviado exitosamente',
        description:
          'Hemos recibido tu consulta. Te responderemos pronto por email.',
        duration: 5000,
      })

      // Resetear formulario
      reset()
      setAttachments([])

      // Opcional: navegar a historial de tickets
      // navigate('/mobile/support/tickets')
    } catch (error: any) {
      toast({
        title: 'Error al enviar ticket',
        description:
          error.response?.data?.message ||
          'No se pudo enviar tu consulta. Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar adjuntos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      // Validar tamaño (max 5MB por archivo)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Archivo muy grande',
          description: `${file.name} excede el límite de 5MB`,
          variant: 'destructive',
        })
        return false
      }
      return true
    })

    setAttachments((prev) => [...prev, ...validFiles].slice(0, 5)) // Max 5 archivos
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
        <h1 className="flex-1 text-xl font-bold">Contactar Soporte</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/mobile/faq')}
          className="h-9 w-9"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Información de contacto rápida */}
      <div className="border-b bg-muted/30 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">soporte@collector.amaranto.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium">+56 9 XXXX XXXX</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Horario: Lunes a Viernes, 8:00 - 18:00</span>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 space-y-6">
        {/* Asunto */}
        <div className="space-y-2">
          <Label htmlFor="subject">
            Asunto <span className="text-destructive">*</span>
          </Label>
          <Input
            id="subject"
            placeholder="Describe brevemente tu consulta"
            {...register('subject')}
            className={cn(errors.subject && 'border-destructive')}
          />
          {errors.subject && (
            <p className="text-sm text-destructive">{errors.subject.message}</p>
          )}
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <Label>
            Categoría <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) =>
              setValue('category', value as SupportFormData['category'])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categories).map(([key, info]) => {
                const Icon = info.icon
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{info.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {info.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Prioridad */}
        <div className="space-y-2">
          <Label>
            Prioridad <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedPriority}
            onValueChange={(value) =>
              setValue('priority', value as SupportFormData['priority'])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(priorities).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  <div>
                    <div className="font-medium">{info.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {info.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <Label htmlFor="message">
            Mensaje <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="message"
            placeholder="Describe tu consulta o problema en detalle. Incluye pasos para reproducir si es un error."
            rows={8}
            {...register('message')}
            className={cn(errors.message && 'border-destructive')}
          />
          {errors.message && (
            <p className="text-sm text-destructive">{errors.message.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {watch('message')?.length || 0} / 2000 caracteres
          </p>
        </div>

        {/* Email (opcional si no está logueado) */}
        {!user && (
          <div className="space-y-2">
            <Label htmlFor="email">Email (opcional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              className={cn(errors.email && 'border-destructive')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Para recibir respuesta a tu consulta
            </p>
          </div>
        )}

        {/* Teléfono (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (opcional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+56 9 XXXX XXXX"
            {...register('phone')}
          />
          <p className="text-xs text-muted-foreground">
            Si prefieres que te contactemos por teléfono
          </p>
        </div>

        {/* Adjuntos */}
        <div className="space-y-2">
          <Label>Archivos adjuntos (opcional)</Label>
          <div className="space-y-2">
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {attachments.length < 5 && (
              <label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <span>
                    <Paperclip className="h-4 w-4 mr-2" />
                    Adjuntar archivo (máx. 5, 5MB cada uno)
                  </span>
                </Button>
              </label>
            )}
            <p className="text-xs text-muted-foreground">
              Puedes adjuntar capturas de pantalla, documentos o fotos que
              ayuden a explicar tu consulta
            </p>
          </div>
        </div>

        {/* Botón enviar */}
        <div className="space-y-3 pt-4">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Consulta
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Te responderemos en un plazo máximo de 24 horas hábiles
          </p>
        </div>
      </form>

      {/* Enlaces útiles */}
      <div className="border-t bg-muted/30 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿Buscas ayuda rápida?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/mobile/faq')}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Ver Preguntas Frecuentes
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/mobile/tutorials')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver Tutoriales
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/mobile/report')}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Reportar un Problema
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Support

