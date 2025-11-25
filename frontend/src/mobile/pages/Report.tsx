/**
 * Página de Reportar Problema - Mobile
 * Formulario especializado para reportar bugs, errores y problemas técnicos
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  ArrowLeft,
  AlertCircle,
  Bug,
  Camera,
  X,
  Send,
  Loader2,
  CheckCircle2,
  Info,
  FileText,
  Smartphone,
  Globe,
  Settings,
  Trash2,
  Image as ImageIcon,
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
import { Checkbox } from '@/shared/components/ui/checkbox'
import { useToast } from '@/shared/components/ui/use-toast'
import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import { useAuthStore } from '@/shared/store/authStore'

/**
 * Schema de validación del formulario
 */
const reportFormSchema = z.object({
  title: z
    .string()
    .min(10, 'El título debe tener al menos 10 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres'),
  type: z.enum(['bug', 'crash', 'performance', 'ui', 'feature', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z
    .string()
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  steps: z
    .string()
    .min(20, 'Los pasos deben tener al menos 20 caracteres')
    .max(1000, 'Los pasos no pueden exceder 1000 caracteres'),
  expected: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  actual: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  includeDeviceInfo: z.boolean().default(true),
  includeLogs: z.boolean().default(false),
})

type ReportFormData = z.infer<typeof reportFormSchema>

/**
 * Tipos de problemas
 */
const problemTypes = {
  bug: {
    label: 'Bug / Error',
    description: 'Algo no funciona como debería',
    icon: Bug,
  },
  crash: {
    label: 'Cierre Inesperado',
    description: 'La app se cierra o se congela',
    icon: AlertCircle,
  },
  performance: {
    label: 'Problema de Rendimiento',
    description: 'La app es lenta o consume mucha batería',
    icon: Settings,
  },
  ui: {
    label: 'Problema de Interfaz',
    description: 'Elementos mal posicionados o no visibles',
    icon: Smartphone,
  },
  feature: {
    label: 'Solicitud de Función',
    description: 'Sugerir una nueva funcionalidad',
    icon: FileText,
  },
  other: {
    label: 'Otro',
    description: 'Otro tipo de problema',
    icon: Info,
  },
}

/**
 * Niveles de severidad
 */
const severities = {
  low: {
    label: 'Baja',
    description: 'Molesto pero no bloquea el uso',
    color: 'text-blue-500',
  },
  medium: {
    label: 'Media',
    description: 'Afecta algunas funciones',
    color: 'text-amber-500',
  },
  high: {
    label: 'Alta',
    description: 'Bloquea funciones importantes',
    color: 'text-orange-500',
  },
  critical: {
    label: 'Crítica',
    description: 'La app es inutilizable',
    color: 'text-red-500',
  },
}

/**
 * Obtener información del dispositivo
 */
const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    connection: (navigator as any).connection
      ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
        }
      : null,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  }
}

/**
 * Página principal de Reportar Problema
 */
const Report = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: '',
      type: 'bug',
      severity: 'medium',
      description: '',
      steps: '',
      expected: '',
      actual: '',
      includeDeviceInfo: true,
      includeLogs: false,
    },
  })

  const selectedType = watch('type')
  const selectedSeverity = watch('severity')
  const includeDeviceInfo = watch('includeDeviceInfo')

  // Manejar envío del formulario
  const onSubmit = async (data: ReportFormData) => {
    try {
      setIsSubmitting(true)

      // Preparar datos del reporte
      const reportData: any = {
        title: data.title,
        type: data.type,
        severity: data.severity,
        description: data.description,
        steps: data.steps,
        expected: data.expected || undefined,
        actual: data.actual || undefined,
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Usuario anónimo',
        userEmail: user?.email || undefined,
        screenshots: screenshots,
        deviceInfo: data.includeDeviceInfo ? getDeviceInfo() : undefined,
        includeLogs: data.includeLogs,
        timestamp: new Date().toISOString(),
      }

      // TODO: Reemplazar con endpoint real cuando esté disponible
      await api.post('/support/report', reportData)

      // En desarrollo, simular éxito
      if (import.meta.env.DEV) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      toast({
        title: 'Reporte enviado exitosamente',
        description:
          'Gracias por tu reporte. Lo revisaremos y te contactaremos si necesitamos más información.',
        duration: 5000,
      })

      // Resetear formulario
      reset()
      setScreenshots([])

      // Opcional: navegar a confirmación
      // navigate('/mobile/report/success')
    } catch (error: any) {
      toast({
        title: 'Error al enviar reporte',
        description:
          error.response?.data?.message ||
          'No se pudo enviar tu reporte. Intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Capturar screenshot
  const captureScreenshot = async () => {
    try {
      // Usar html2canvas si está disponible, o simplemente permitir seleccionar archivo
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    } catch (error) {
      toast({
        title: 'Error al capturar pantalla',
        description: 'Por favor, selecciona una imagen manualmente',
        variant: 'destructive',
      })
    }
  }

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          if (result && screenshots.length < 5) {
            setScreenshots((prev) => [...prev, result])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  // Remover screenshot
  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index))
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
        <h1 className="flex-1 text-xl font-bold">Reportar Problema</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/mobile/support')}
          className="h-9 w-9"
        >
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Información */}
      <div className="border-b bg-muted/30 p-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p>
                  Ayúdanos a mejorar Collector reportando problemas que
                  encuentres. Cuanta más información proporciones, más rápido
                  podremos solucionarlo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 space-y-6">
        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Título del problema <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Ej: La app se cierra al intentar tomar una foto"
            {...register('title')}
            className={cn(errors.title && 'border-destructive')}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label>
            Tipo de problema <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedType}
            onValueChange={(value) =>
              setValue('type', value as ReportFormData['type'])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(problemTypes).map(([key, info]) => {
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

        {/* Severidad */}
        <div className="space-y-2">
          <Label>
            Severidad <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedSeverity}
            onValueChange={(value) =>
              setValue('severity', value as ReportFormData['severity'])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(severities).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  <div>
                    <div className={cn('font-medium', info.color)}>
                      {info.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {info.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Descripción detallada <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe el problema en detalle. ¿Qué estabas haciendo cuando ocurrió? ¿Qué error viste?"
            rows={6}
            {...register('description')}
            className={cn(errors.description && 'border-destructive')}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {watch('description')?.length || 0} / 2000 caracteres
          </p>
        </div>

        {/* Pasos para reproducir */}
        <div className="space-y-2">
          <Label htmlFor="steps">
            Pasos para reproducir <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="steps"
            placeholder="1. Abrí la app&#10;2. Fui a la sección de tareas&#10;3. Toqué en una tarea&#10;4. La app se cerró"
            rows={5}
            {...register('steps')}
            className={cn(errors.steps && 'border-destructive')}
          />
          {errors.steps && (
            <p className="text-sm text-destructive">{errors.steps.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Enumera los pasos exactos que seguiste para que ocurriera el
            problema
          </p>
        </div>

        {/* Comportamiento esperado vs actual */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expected">Comportamiento esperado (opcional)</Label>
            <Textarea
              id="expected"
              placeholder="Lo que debería haber pasado"
              rows={3}
              {...register('expected')}
            />
            <p className="text-xs text-muted-foreground">
              {watch('expected')?.length || 0} / 500 caracteres
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="actual">Comportamiento actual (opcional)</Label>
            <Textarea
              id="actual"
              placeholder="Lo que realmente pasó"
              rows={3}
              {...register('actual')}
            />
            <p className="text-xs text-muted-foreground">
              {watch('actual')?.length || 0} / 500 caracteres
            </p>
          </div>
        </div>

        {/* Screenshots */}
        <div className="space-y-2">
          <Label>Capturas de pantalla (opcional)</Label>
          <div className="space-y-2">
            {screenshots.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {screenshots.map((screenshot, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={screenshot}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeScreenshot(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {screenshots.length < 5 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={captureScreenshot}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Agregar captura de pantalla ({screenshots.length}/5)
                </Button>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              Las capturas de pantalla ayudan mucho a entender el problema
            </p>
          </div>
        </div>

        {/* Opciones adicionales */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3 rounded-lg border p-3">
            <Checkbox
              id="includeDeviceInfo"
              checked={includeDeviceInfo}
              onCheckedChange={(checked) =>
                setValue('includeDeviceInfo', checked as boolean)
              }
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="includeDeviceInfo"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incluir información del dispositivo
              </Label>
              <p className="text-xs text-muted-foreground">
                Incluye información técnica (navegador, sistema operativo,
                tamaño de pantalla) que ayuda a diagnosticar el problema
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-lg border p-3">
            <Checkbox
              id="includeLogs"
              checked={watch('includeLogs')}
              onCheckedChange={(checked) =>
                setValue('includeLogs', checked as boolean)
              }
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="includeLogs"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incluir logs de consola (solo para desarrolladores)
              </Label>
              <p className="text-xs text-muted-foreground">
                Incluye logs técnicos de la consola del navegador. Solo marca
                esto si sabes qué son los logs.
              </p>
            </div>
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
                Enviando reporte...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Reporte
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Tu reporte será revisado por nuestro equipo técnico
          </p>
        </div>
      </form>

      {/* Enlaces útiles */}
      <div className="border-t bg-muted/30 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿Necesitas ayuda?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/mobile/faq')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver Preguntas Frecuentes
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/mobile/support')}
            >
              <Info className="h-4 w-4 mr-2" />
              Contactar Soporte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Report

