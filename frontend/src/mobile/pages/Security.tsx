/**
 * Página de Seguridad - Mobile
 * Cambio de contraseña y verificación en dos pasos
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Lock,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Smartphone,
  Download,
  Copy,
  RefreshCw,
  AlertTriangle,
  Activity,
  LogIn,
  LogOut,
  ChevronRight,
  Bell,
  FileText,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { z } from 'zod'

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
import { Progress } from '@/shared/components/ui/progress'
import { Switch } from '@/shared/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs'
import { useToast } from '@/shared/components/ui/use-toast'
import { useAuthStore } from '@/shared/store/authStore'
import api from '@/shared/lib/api'
import { cn } from '@/shared/lib/utils'
import {
  isBiometricAvailable,
  detectBiometricType,
  getBiometricTypeName,
  testBiometric,
} from '../utils/biometricAuth'

/**
 * Schema de validación para cambio de contraseña
 */
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

/**
 * Calcular fortaleza de contraseña
 */
const calculatePasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong'
  percentage: number
  checks: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
} => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  const passedChecks = Object.values(checks).filter(Boolean).length
  const percentage = (passedChecks / 5) * 100

  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (percentage >= 80) {
    strength = 'strong'
  } else if (percentage >= 60) {
    strength = 'medium'
  }

  return { strength, percentage, checks }
}

/**
 * Página de Seguridad
 */
const Security = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { logout } = useAuthStore()

  // Estados para cambio de contraseña
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(
    calculatePasswordStrength(''),
  )

  // Estados para 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isEnabling2FA, setIsEnabling2FA] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'app' | 'email'>('app')
  const [twoFactorPhone, setTwoFactorPhone] = useState('')
  const [twoFactorQRCode, setTwoFactorQRCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  // Estados para autenticación biométrica
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricType, setBiometricType] = useState<'face-id' | 'touch-id' | 'fingerprint' | 'none'>('none')
  const [biometricConfig, setBiometricConfig] = useState({
    requireForApp: false,
    requireForSensitive: true,
    requireForConfidential: true,
  })
  const [isTestingBiometric, setIsTestingBiometric] = useState(false)

  // Estados para actividad de seguridad
  const [securityActivity, setSecurityActivity] = useState<Array<{
    id: string
    type: 'login_success' | 'login_failed' | 'password_changed' | '2fa_enabled' | '2fa_disabled' | 'session_closed'
    description: string
    timestamp: Date
    location?: string
    device?: string
  }>>([])
  const [activityFilter, setActivityFilter] = useState<string>('all')

  // Estados para alertas de seguridad
  const [securityAlerts, setSecurityAlerts] = useState<Array<{
    id: string
    type: 'new_device' | 'new_location' | 'failed_attempts' | 'critical_change'
    title: string
    description: string
    timestamp: Date
    read: boolean
  }>>([])

  // Cargar datos al montar
  useEffect(() => {
    const loadSecurityData = async () => {
      // Verificar disponibilidad biométrica
      const available = await isBiometricAvailable()
      setBiometricAvailable(available)
      if (available) {
        const type = detectBiometricType()
        setBiometricType(type)
      }

      // Cargar actividad de seguridad (endpoint a implementar)
      try {
        const response = await api.get('/auth/security-activity')
        setSecurityActivity(response.data)
      } catch (error) {
        // Datos de ejemplo para desarrollo
        setSecurityActivity([
          {
            id: '1',
            type: 'login_success',
            description: 'Inicio de sesión exitoso',
            timestamp: new Date(),
            location: 'Santiago, Chile',
            device: 'iPhone 13 Pro',
          },
          {
            id: '2',
            type: 'password_changed',
            description: 'Contraseña actualizada',
            timestamp: new Date(Date.now() - 86400000),
          },
        ])
      }

      // Cargar alertas de seguridad (endpoint a implementar)
      try {
        const response = await api.get('/auth/security-alerts')
        setSecurityAlerts(response.data)
      } catch (error) {
        // Datos de ejemplo
        setSecurityAlerts([])
      }
    }

    void loadSecurityData()
  }, [])

  // Actualizar fortaleza de contraseña
  const handlePasswordChange = (field: keyof ChangePasswordForm, value: string) => {
    const updated = { ...passwordForm, [field]: value }
    setPasswordForm(updated)

    if (field === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
  }

  // Cambiar contraseña
  const handleChangePassword = async () => {
    try {
      // Validar formulario
      changePasswordSchema.parse(passwordForm)

      setIsChangingPassword(true)

      // Llamar a API (endpoint a implementar en backend)
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña se ha cambiado correctamente. Serás redirigido al login.',
      })

      // Limpiar formulario
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordStrength(calculatePasswordStrength(''))

      // Auto-logout después de 2 segundos
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Error de validación',
          description: error.issues[0]?.message || 'Error de validación',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description:
            error.response?.data?.error || 'No se pudo cambiar la contraseña',
          variant: 'destructive',
        })
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Habilitar/deshabilitar 2FA
  const handleToggle2FA = async () => {
    if (!twoFactorEnabled) {
      // Abrir wizard de setup
      setShow2FASetup(true)
    } else {
      // Deshabilitar 2FA
      try {
        setIsEnabling2FA(true)
        await api.post('/auth/disable-2fa')
        setTwoFactorEnabled(false)
        toast({
          title: 'Verificación en dos pasos deshabilitada',
          description: 'Ya no necesitarás un código adicional para iniciar sesión',
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description:
            error.response?.data?.error ||
            'No se pudo deshabilitar la verificación en dos pasos',
          variant: 'destructive',
        })
      } finally {
        setIsEnabling2FA(false)
      }
    }
  }

  // Setup 2FA - SMS
  const handle2FASetupSMS = async () => {
    try {
      await api.post('/auth/2fa/setup/sms', {
        phone: twoFactorPhone,
      })
      // Mostrar código de verificación
      toast({
        title: 'Código enviado',
        description: 'Ingresa el código que recibiste por SMS',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo enviar el código SMS',
        variant: 'destructive',
      })
    }
  }

  // Setup 2FA - App autenticadora
  const handle2FASetupApp = async () => {
    try {
      const response = await api.post('/auth/2fa/setup/app')
      setTwoFactorQRCode(response.data.qrCode)
      setBackupCodes(response.data.backupCodes)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo generar el QR code',
        variant: 'destructive',
      })
    }
  }

  // Setup 2FA - Email
  const handle2FASetupEmail = async () => {
    try {
      await api.post('/auth/2fa/setup/email')
      toast({
        title: 'Código enviado',
        description: 'Ingresa el código que recibiste por email',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo enviar el código por email',
        variant: 'destructive',
      })
    }
  }

  // Confirmar 2FA setup
  const handleConfirm2FA = async (verificationCode: string) => {
    try {
      await api.post('/auth/2fa/verify', {
        method: twoFactorMethod,
        code: verificationCode,
      })
      setTwoFactorEnabled(true)
      setShow2FASetup(false)
      toast({
        title: '2FA habilitado',
        description: 'La verificación en dos pasos está ahora activa',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Código inválido',
        variant: 'destructive',
      })
    }
  }

  // Generar nuevos códigos de respaldo
  const handleRegenerateBackupCodes = async () => {
    try {
      const response = await api.post('/auth/2fa/regenerate-backup-codes')
      setBackupCodes(response.data.backupCodes)
      toast({
        title: 'Códigos regenerados',
        description: 'Los códigos anteriores han sido invalidados',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudieron regenerar los códigos',
        variant: 'destructive',
      })
    }
  }

  // Copiar códigos de respaldo
  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    navigator.clipboard.writeText(codesText)
    toast({
      title: 'Códigos copiados',
      description: 'Los códigos de respaldo se han copiado al portapapeles',
    })
  }

  // Descargar códigos de respaldo
  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Códigos descargados',
      description: 'Guarda este archivo en un lugar seguro',
    })
  }

  // Habilitar/deshabilitar biométrica
  const handleToggleBiometric = async () => {
    if (!biometricEnabled) {
      // Probar biométrica primero
      setIsTestingBiometric(true)
      try {
        const testResult = await testBiometric()
        if (testResult) {
          // Registrar credencial biométrica
          const challenge = 'challenge-' + Date.now()
          await api.post('/auth/biometric/register', { challenge })
          setBiometricEnabled(true)
          toast({
            title: 'Autenticación biométrica habilitada',
            description: `${getBiometricTypeName(biometricType)} está ahora activo`,
          })
        } else {
          toast({
            title: 'Error',
            description: 'No se pudo verificar la autenticación biométrica',
            variant: 'destructive',
          })
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo habilitar la autenticación biométrica',
          variant: 'destructive',
        })
      } finally {
        setIsTestingBiometric(false)
      }
    } else {
      // Deshabilitar biométrica
      try {
        await api.post('/auth/biometric/disable')
        setBiometricEnabled(false)
        toast({
          title: 'Autenticación biométrica deshabilitada',
          description: 'Ya no se usará autenticación biométrica',
        })
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'No se pudo deshabilitar la biométrica',
          variant: 'destructive',
        })
      }
    }
  }

  // Exportar actividad de seguridad
  const handleExportActivity = () => {
    const csv = [
      ['Tipo', 'Descripción', 'Fecha', 'Ubicación', 'Dispositivo'],
      ...securityActivity.map((activity) => [
        activity.type,
        activity.description,
        format(activity.timestamp, 'dd/MM/yyyy HH:mm'),
        activity.location || '',
        activity.device || '',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Actividad exportada',
      description: 'El archivo CSV se ha descargado',
    })
  }

  // Obtener ícono para tipo de actividad
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login_success':
        return <LogIn className="h-4 w-4 text-green-600" />
      case 'login_failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'password_changed':
        return <Lock className="h-4 w-4 text-blue-600" />
      case '2fa_enabled':
      case '2fa_disabled':
        return <Shield className="h-4 w-4 text-purple-600" />
      case 'session_closed':
        return <LogOut className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Obtener ícono para tipo de alerta
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'new_device':
        return <Smartphone className="h-5 w-5 text-blue-600" />
      case 'new_location':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'failed_attempts':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'critical_change':
        return <Shield className="h-5 w-5 text-purple-600" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
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
        <h1 className="flex-1 text-xl font-bold">Seguridad</h1>
      </div>

      {/* Contenido */}
      <div className="flex-1 space-y-6 p-4">
        {/* Cambio de contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Cambiar contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña para mantener tu cuenta segura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña actual</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    handlePasswordChange('currentPassword', e.target.value)
                  }
                  placeholder="Ingresa tu contraseña actual"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                  }
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                  }
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Indicador de fortaleza */}
              {passwordForm.newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Fortaleza</span>
                    <span
                      className={cn(
                        'font-medium',
                        passwordStrength.strength === 'strong' && 'text-green-600',
                        passwordStrength.strength === 'medium' && 'text-yellow-600',
                        passwordStrength.strength === 'weak' && 'text-red-600',
                      )}
                    >
                      {passwordStrength.strength === 'strong'
                        ? 'Fuerte'
                        : passwordStrength.strength === 'medium'
                          ? 'Media'
                          : 'Débil'}
                    </span>
                  </div>
                  <Progress
                    value={passwordStrength.percentage}
                    className={cn(
                      'h-2',
                      passwordStrength.strength === 'strong' && '[&>div]:bg-green-600',
                      passwordStrength.strength === 'medium' && '[&>div]:bg-yellow-600',
                      passwordStrength.strength === 'weak' && '[&>div]:bg-red-600',
                    )}
                  />

                  {/* Checklist de requisitos */}
                  <div className="space-y-1 text-xs">
                    <div
                      className={cn(
                        'flex items-center gap-2',
                        passwordStrength.checks.length
                          ? 'text-green-600'
                          : 'text-muted-foreground',
                      )}
                    >
                      {passwordStrength.checks.length ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>Mínimo 8 caracteres</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-2',
                        passwordStrength.checks.uppercase
                          ? 'text-green-600'
                          : 'text-muted-foreground',
                      )}
                    >
                      {passwordStrength.checks.uppercase ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>Al menos 1 mayúscula</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-2',
                        passwordStrength.checks.lowercase
                          ? 'text-green-600'
                          : 'text-muted-foreground',
                      )}
                    >
                      {passwordStrength.checks.lowercase ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>Al menos 1 minúscula</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-2',
                        passwordStrength.checks.number
                          ? 'text-green-600'
                          : 'text-muted-foreground',
                      )}
                    >
                      {passwordStrength.checks.number ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>Al menos 1 número</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-2',
                        passwordStrength.checks.special
                          ? 'text-green-600'
                          : 'text-muted-foreground',
                      )}
                    >
                      {passwordStrength.checks.special ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>Al menos 1 carácter especial</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    handlePasswordChange('confirmPassword', e.target.value)
                  }
                  placeholder="Confirma tu nueva contraseña"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                  }
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordForm.confirmPassword &&
                passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-destructive">
                    Las contraseñas no coinciden
                  </p>
                )}
            </div>

            <Button
              className="w-full"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
            </Button>
          </CardContent>
        </Card>

        {/* Verificación en dos pasos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verificación en dos pasos
            </CardTitle>
            <CardDescription>
              Añade una capa adicional de seguridad a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autenticación de dos factores</Label>
                <p className="text-xs text-muted-foreground">
                  Requiere un código adicional además de tu contraseña
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleToggle2FA}
                disabled={isEnabling2FA}
              />
            </div>

            {twoFactorEnabled && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    La verificación en dos pasos está activa. Necesitarás un código de
                    tu aplicación de autenticación cada vez que inicies sesión.
                  </p>
                </div>
                {backupCodes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Códigos de respaldo</Label>
                    <div className="rounded-lg border p-4 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Guarda estos códigos en un lugar seguro. Puedes usarlos si pierdes acceso a tu método de autenticación.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="font-mono text-sm p-2 bg-background rounded border">
                            {code}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopyBackupCodes}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadBackupCodes}>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRegenerateBackupCodes}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!twoFactorEnabled && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShow2FASetup(true)}
              >
                Configurar 2FA
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Autenticación Biométrica */}
        {biometricAvailable && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Autenticación Biométrica
              </CardTitle>
              <CardDescription>
                Usa {getBiometricTypeName(biometricType)} para acceder rápidamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getBiometricTypeName(biometricType)}</Label>
                  <p className="text-xs text-muted-foreground">
                    Autenticación rápida y segura
                  </p>
                </div>
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={handleToggleBiometric}
                  disabled={isTestingBiometric}
                />
              </div>
              {biometricEnabled && (
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-semibold">Requerir para:</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Abrir app</Label>
                      <Switch
                        checked={biometricConfig.requireForApp}
                        onCheckedChange={(checked: boolean) =>
                          setBiometricConfig((prev) => ({ ...prev, requireForApp: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Acciones sensibles</Label>
                      <Switch
                        checked={biometricConfig.requireForSensitive}
                        onCheckedChange={(checked: boolean) =>
                          setBiometricConfig((prev) => ({ ...prev, requireForSensitive: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Ver datos confidenciales</Label>
                      <Switch
                        checked={biometricConfig.requireForConfidential}
                        onCheckedChange={(checked: boolean) =>
                          setBiometricConfig((prev) => ({ ...prev, requireForConfidential: checked }))
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Si la autenticación biométrica falla, podrás usar tu contraseña como respaldo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sesiones Activas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Sesiones Activas
            </CardTitle>
            <CardDescription>
              Gestiona los dispositivos donde has iniciado sesión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/mobile/settings/sessions')}
            >
              <span>Ver todas las sesiones</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Actividad de Seguridad */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actividad de Seguridad
                </CardTitle>
                <CardDescription>
                  Historial de eventos de seguridad
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleExportActivity}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Filtrar por tipo</Label>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="login_success">Inicios de sesión</SelectItem>
                  <SelectItem value="login_failed">Intentos fallidos</SelectItem>
                  <SelectItem value="password_changed">Cambios de contraseña</SelectItem>
                  <SelectItem value="2fa_enabled">2FA habilitado</SelectItem>
                  <SelectItem value="session_closed">Sesiones cerradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {securityActivity
                .filter((activity) => activityFilter === 'all' || activity.type === activityFilter)
                .slice(0, 5)
                .map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      {activity.location && (
                        <p className="text-xs text-muted-foreground">{activity.location}</p>
                      )}
                      {activity.device && (
                        <p className="text-xs text-muted-foreground">{activity.device}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              {securityActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay actividad registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertas de Seguridad */}
        {securityAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas de Seguridad
              </CardTitle>
              <CardDescription>
                Eventos que requieren tu atención
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {securityAlerts
                .filter((alert) => !alert.read)
                .slice(0, 3)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'rounded-lg border p-4',
                      !alert.read && 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getAlertIcon(alert.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(alert.timestamp, {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Setup 2FA */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Verificación en Dos Pasos</DialogTitle>
            <DialogDescription>
              Elige un método para recibir códigos de verificación
            </DialogDescription>
          </DialogHeader>
          <Tabs value={twoFactorMethod} onValueChange={(value: string) => setTwoFactorMethod(value as 'sms' | 'app' | 'email')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="app">App</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="app" className="space-y-4">
              <div className="space-y-2">
                <Label>App Autenticadora</Label>
                <p className="text-xs text-muted-foreground">
                  Usa una app como Google Authenticator o Authy
                </p>
              </div>
              {twoFactorQRCode ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img src={twoFactorQRCode} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ingresa el código de verificación</Label>
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      onChange={(e) => {
                        if (e.target.value.length === 6) {
                          handleConfirm2FA(e.target.value)
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <Button className="w-full" onClick={handle2FASetupApp}>
                  Generar QR Code
                </Button>
              )}
            </TabsContent>
            <TabsContent value="sms" className="space-y-4">
              <div className="space-y-2">
                <Label>Número de teléfono</Label>
                <Input
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  value={twoFactorPhone}
                  onChange={(e) => setTwoFactorPhone(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handle2FASetupSMS}>
                Enviar código
              </Button>
            </TabsContent>
            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-xs text-muted-foreground">
                  Se enviará un código a tu email registrado
                </p>
              </div>
              <Button className="w-full" onClick={handle2FASetupEmail}>
                Enviar código
              </Button>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FASetup(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Security

