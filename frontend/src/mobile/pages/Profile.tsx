/**
 * Perfil de Usuario - Mobile
 * Página completa de perfil con todas las secciones requeridas
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Edit2,
  LogOut,
  CheckCircle2,
  Flame,
  TrendingUp,
  Clock,
  ChevronRight,
  Phone,
  Building2,
  Bell,
  WifiOff,
  RefreshCw,
  MapPin,
  Lock,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Monitor,
  Type,
  HelpCircle,
  MessageCircle,
  AlertCircle,
  FileText,
  Shield,
  Info,
  Camera,
  Image as ImageIcon,
  User,
  X,
  Save,
  Loader2,
  Check,
  Calendar,
  Activity,
  Settings,
  Trash2,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import { useAuthStore } from '@/shared/store/authStore'
import { useToast } from '@/shared/components/ui/use-toast'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { Label } from '@/shared/components/ui/label'
import { Slider } from '@/shared/components/ui/slider'
import { Input } from '@/shared/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { DataUsageIndicator } from '../components/offline'
import { useDataManager } from '../hooks/useDataManager'
import { formatFileSize } from '../utils/imageCompression'
// CameraCapture se usará para cambiar avatar si es necesario
import { useOfflineAssignments } from '../hooks/useOfflineAssignments'
import { getNotificationPermission } from '../utils/pushNotifications'

/**
 * Tipo para estadísticas del usuario
 */
interface UserStats {
  completedTasks: number
  currentStreak: number
  completionRate: number
  hoursWorked: number
}

/**
 * Tipo para actividad reciente
 */
interface RecentActivity {
  id: string
  type: 'task_completed' | 'task_started' | 'form_submitted' | 'profile_updated'
  title: string
  description: string
  timestamp: Date
  icon: React.ReactNode
}

/**
 * Tipo para información personal extendida
 */
interface ExtendedUserInfo {
  name: string
  email: string
  phone?: string
  company?: string
  area?: string
  avatarUrl?: string
}

/**
 * Componente Skeleton para el perfil
 */
const ProfileSkeleton = () => (
  <div className="flex min-h-screen flex-col">
    <div className="h-48 animate-pulse rounded-b-3xl bg-muted" />
    <div className="px-4 -mt-16">
      <div className="h-32 w-32 mx-auto rounded-full bg-muted animate-pulse" />
      <div className="mt-4 space-y-2">
        <div className="h-6 w-48 mx-auto bg-muted rounded animate-pulse" />
        <div className="h-4 w-32 mx-auto bg-muted rounded animate-pulse" />
      </div>
    </div>
    <div className="px-4 mt-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  </div>
)

/**
 * Perfil de Usuario - Mobile
 */
const MobileProfile = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, logout } = useAuthStore()
  const { assignments } = useOfflineAssignments()
  const {
    storageInfo,
    getSettings,
    updateSettings,
    cleanupOldData,
    getCleanupSuggestions,
    clearAllCache,
    deleteAllDrafts,
    getStorageInfo,
  } = useDataManager()

  // Estados principales
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showAvatarOptions, setShowAvatarOptions] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)

  // Datos del usuario
  const [userInfo, setUserInfo] = useState<ExtendedUserInfo>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: '',
    area: '',
    avatarUrl: '',
  })

  // Estadísticas
  const [stats, setStats] = useState<UserStats>({
    completedTasks: 0,
    currentStreak: 0,
    completionRate: 0,
    hoursWorked: 0,
  })

  // Actividad reciente
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  // Configuración rápida
  const [quickSettings, setQuickSettings] = useState({
    pushNotifications: false,
    offlineMode: false,
    autoSync: true,
    locationAlways: false,
  })

  // Preferencias
  const [preferences, setPreferences] = useState({
    language: 'es',
    theme: 'auto' as 'light' | 'dark' | 'auto',
    fontSize: 1,
  })

  // Seguridad
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  // Settings de datos
  const [dataSettings, setDataSettings] = useState(getSettings())
  const [cleanupSuggestions, setCleanupSuggestions] = useState<{
    canFree: number
    suggestions: Array<{
      type: string
      description: string
      canFree: number
      action: () => Promise<void>
    }>
  } | null>(null)

  // Cargar datos del perfil
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true)
      try {
        // Cargar información del usuario desde API
        try {
          const response = await api.get('/auth/me')
          const userData = response.data
          setUserInfo({
            name: userData.name || user?.name || '',
            email: userData.email || user?.email || '',
            phone: userData.phone || '',
            company: userData.company || '',
            area: userData.area || '',
            avatarUrl: userData.avatarUrl || '',
          })
        } catch (error) {
          console.error('Error al cargar datos del usuario:', error)
          // Usar datos del store como fallback
          setUserInfo({
            name: user?.name || '',
            email: user?.email || '',
          })
        }

        // Calcular estadísticas desde assignments locales
        const completed = assignments.filter((a) => a.status === 'completed').length
        const total = assignments.length
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

        // Calcular racha (simplificado - días consecutivos con tareas completadas)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const completedToday = assignments.filter(
          (a) => a.status === 'completed' && a.completedAt && new Date(a.completedAt) >= today,
        ).length
        const streak = completedToday > 0 ? 1 : 0 // Simplificado

        setStats({
          completedTasks: completed,
          currentStreak: streak,
          completionRate,
          hoursWorked: Math.round(completed * 0.5), // Estimado: 30 min por tarea
        })

        // Generar actividad reciente (simplificado)
        const activities: RecentActivity[] = assignments
          .slice(0, 5)
          .map((assignment, index) => ({
            id: assignment.id,
            type: assignment.status === 'completed' ? 'task_completed' : 'task_started',
            title:
              assignment.status === 'completed'
                ? 'Tarea completada'
                : assignment.status === 'in_progress'
                  ? 'Tarea iniciada'
                  : 'Tarea asignada',
            description: assignment.formName || 'Formulario',
            timestamp: new Date(assignment.assignedAt),
            icon:
              assignment.status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Activity className="h-4 w-4 text-blue-600" />
              ),
          }))
        setRecentActivity(activities)

        // Cargar configuración de notificaciones
        const notificationPermission = getNotificationPermission()
        setQuickSettings((prev) => ({
          ...prev,
          pushNotifications: notificationPermission === 'granted',
        }))

        // Cargar sugerencias de limpieza
        const suggestions = await getCleanupSuggestions()
        setCleanupSuggestions(suggestions)
      } catch (error) {
        console.error('Error al cargar perfil:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos del perfil',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadProfileData()
  }, [user, assignments, toast])

  // Guardar cambios del perfil
  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await api.put('/auth/me', userInfo)
      toast({
        title: 'Perfil actualizado',
        description: 'Los cambios se han guardado correctamente',
      })
      setShowEditSheet(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo actualizar el perfil',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Cambiar avatar
  const handleAvatarChange = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await api.post('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUserInfo((prev) => ({ ...prev, avatarUrl: response.data.avatarUrl }))
      setShowAvatarOptions(false)
      toast({
        title: 'Avatar actualizado',
        description: 'Tu foto de perfil se ha actualizado',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'No se pudo actualizar el avatar',
        variant: 'destructive',
      })
    }
  }

  // Manejar logout
  const handleLogout = () => {
    logout()
    navigate('/login')
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión correctamente',
    })
  }

  // Actualizar configuración rápida
  const handleQuickSettingChange = (key: keyof typeof quickSettings, value: boolean) => {
    setQuickSettings((prev) => ({ ...prev, [key]: value }))
    // Aquí se podría guardar en el backend o localStorage
  }

  // Actualizar preferencias
  const handlePreferenceChange = (key: keyof typeof preferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
    // Aplicar tema si cambia
    if (key === 'theme') {
      // Aquí se aplicaría el tema
      console.log('Cambiar tema a:', value)
    }
  }

  // Actualizar settings de datos
  const handleDataSettingChange = (key: keyof typeof dataSettings, value: any) => {
    const newSettings = { ...dataSettings, [key]: value }
    setDataSettings(newSettings)
    updateSettings(newSettings)
    toast({
      title: 'Configuración actualizada',
      description: 'Los cambios se han guardado correctamente',
    })
  }

  // Limpieza de datos
  const handleCleanup = async () => {
    try {
      const result = await cleanupOldData()
      toast({
        title: 'Limpieza completada',
        description: `Se liberaron ${formatFileSize(result.freedSpace)} de espacio`,
      })
      await getStorageInfo()
      const suggestions = await getCleanupSuggestions()
      setCleanupSuggestions(suggestions)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo completar la limpieza',
        variant: 'destructive',
      })
    }
  }

  const handleClearCache = async () => {
    try {
      await clearAllCache()
      toast({
        title: 'Cache limpiado',
        description: 'Se ha limpiado todo el cache',
      })
      await getStorageInfo()
      const suggestions = await getCleanupSuggestions()
      setCleanupSuggestions(suggestions)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo limpiar el cache',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteDrafts = async () => {
    try {
      await deleteAllDrafts()
      toast({
        title: 'Borradores eliminados',
        description: 'Se han eliminado todos los borradores',
      })
      await getStorageInfo()
      const suggestions = await getCleanupSuggestions()
      setCleanupSuggestions(suggestions)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar los borradores',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    SUPERVISOR: 'Supervisor',
    OPERATOR: 'Operador',
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {/* Header del perfil con cover y avatar */}
      <div className="relative">
        {/* Cover image con gradient */}
        <div className="h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />

        {/* Avatar grande centrado (overlap con cover) */}
        <div className="absolute left-1/2 top-32 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <Avatar
              className="h-32 w-32 border-4 border-background shadow-lg cursor-pointer"
              onClick={() => setShowAvatarOptions(true)}
            >
              <AvatarImage src={userInfo.avatarUrl} alt={userInfo.name} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {userInfo.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 rounded-full bg-primary p-2 border-4 border-background">
              <Camera className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Edit button (top-right) */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm"
            onClick={() => setShowEditSheet(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Información del usuario */}
      <div className="mt-20 px-4 text-center space-y-2">
        <h1 className="text-2xl font-bold">{userInfo.name}</h1>
        <Badge variant="secondary" className="text-sm">
          {roleLabels[user?.role || 'OPERATOR'] || user?.role}
        </Badge>
        <p className="text-sm text-muted-foreground">{userInfo.email}</p>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 px-4 mt-6 space-y-6 pb-6">
        {/* 1. Información Personal (expandible) */}
        <Card>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="personal-info" className="border-none">
              <AccordionTrigger className="px-6 py-4">
                <CardTitle className="text-lg">Información Personal</CardTitle>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Nombre completo</Label>
                  <p className="font-medium">{userInfo.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{userInfo.email}</p>
                </div>
                {userInfo.phone && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </Label>
                    <p className="font-medium">{userInfo.phone}</p>
                  </div>
                )}
                {userInfo.company && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Empresa/Área
                    </Label>
                    <p className="font-medium">
                      {userInfo.company}
                      {userInfo.area && ` - ${userInfo.area}`}
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowEditSheet(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar información
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* 2. Estadísticas */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
                <p className="text-xs text-muted-foreground">Tareas completadas</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Flame className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Días de racha</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-xs text-muted-foreground">Tasa de cumplimiento</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{stats.hoursWorked}</p>
                <p className="text-xs text-muted-foreground">Horas este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Actividad Reciente */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Actividad Reciente</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/mobile/history')}
            >
              Ver todas <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1">{activity.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay actividad reciente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. Configuración rápida */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Rápida</CardTitle>
            <CardDescription>Accesos rápidos a configuraciones comunes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Notificaciones push</Label>
                  <p className="text-xs text-muted-foreground">Recibir notificaciones</p>
                </div>
              </div>
              <Switch
                checked={quickSettings.pushNotifications}
                onCheckedChange={(checked) => handleQuickSettingChange('pushNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Modo offline</Label>
                  <p className="text-xs text-muted-foreground">Trabajar sin conexión</p>
                </div>
              </div>
              <Switch
                checked={quickSettings.offlineMode}
                onCheckedChange={(checked) => handleQuickSettingChange('offlineMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Auto-sync</Label>
                  <p className="text-xs text-muted-foreground">Sincronizar automáticamente</p>
                </div>
              </div>
              <Switch
                checked={quickSettings.autoSync}
                onCheckedChange={(checked) => handleQuickSettingChange('autoSync', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Ubicación siempre</Label>
                  <p className="text-xs text-muted-foreground">Compartir ubicación siempre</p>
                </div>
              </div>
              <Switch
                checked={quickSettings.locationAlways}
                onCheckedChange={(checked) => handleQuickSettingChange('locationAlways', checked)}
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/mobile/settings')}
            >
              Ver configuración detallada <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 5. Sección Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => navigate('/mobile/settings/security')}
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <span>Cambiar contraseña</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => navigate('/mobile/settings/sessions')}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <span>Sesiones activas</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Autenticación biométrica</Label>
                  <p className="text-xs text-muted-foreground">Usar huella o Face ID</p>
                </div>
              </div>
              <Switch
                checked={biometricEnabled}
                onCheckedChange={setBiometricEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* 6. Preferencias */}
        <Card>
          <CardHeader>
            <CardTitle>Preferencias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Idioma
              </Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => handlePreferenceChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {preferences.theme === 'light' ? (
                  <Sun className="h-4 w-4" />
                ) : preferences.theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                Tema
              </Label>
              <Select
                value={preferences.theme}
                onValueChange={(value: 'light' | 'dark' | 'auto') =>
                  handlePreferenceChange('theme', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Tamaño de fuente
                </Label>
                <span className="text-sm text-muted-foreground">
                  {preferences.fontSize === 0.875
                    ? 'Pequeño'
                    : preferences.fontSize === 1
                      ? 'Normal'
                      : preferences.fontSize === 1.125
                        ? 'Grande'
                        : 'Muy grande'}
                </span>
              </div>
              <Slider
                min={0.875}
                max={1.25}
                step={0.125}
                value={[preferences.fontSize]}
                onValueChange={([value]) => handlePreferenceChange('fontSize', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 7. Ayuda y Soporte */}
        <Card>
          <CardHeader>
            <CardTitle>Ayuda y Soporte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/mobile/tutorials')}
            >
              <HelpCircle className="h-5 w-5 mr-3 text-muted-foreground" />
              Tutorial interactivo
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/mobile/faq')}
            >
              <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
              Preguntas frecuentes
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/mobile/support')}
            >
              <MessageCircle className="h-5 w-5 mr-3 text-muted-foreground" />
              Contactar soporte
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/mobile/report')}
            >
              <AlertCircle className="h-5 w-5 mr-3 text-muted-foreground" />
              Reportar problema
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        {/* 8. Acerca de */}
        <Card>
          <CardHeader>
            <CardTitle>Acerca de</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-muted-foreground" />
                <span>Versión de la app</span>
              </div>
              <Badge variant="outline">1.0.0</Badge>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => window.open('/terms', '_blank')}
            >
              <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
              Términos y condiciones
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => window.open('/privacy', '_blank')}
            >
              <Shield className="h-5 w-5 mr-3 text-muted-foreground" />
              Política de privacidad
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/mobile/licenses')}
            >
              <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
              Licencias
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        {/* Almacenamiento (mantener sección existente) */}
        <Card>
          <CardHeader>
            <CardTitle>Almacenamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <DataUsageIndicator showAlert={true} alertThreshold={80} />
          </CardContent>
        </Card>

        {/* Configuración de datos (mantener sección existente) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de datos
            </CardTitle>
            <CardDescription>Gestiona cómo se almacenan y sincronizan tus datos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compression">Compresión automática</Label>
                <p className="text-sm text-muted-foreground">
                  Comprimir datos grandes para ahorrar espacio
                </p>
              </div>
              <Switch
                id="compression"
                checked={dataSettings.compressionEnabled}
                onCheckedChange={(checked) =>
                  handleDataSettingChange('compressionEnabled', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="wifi-only">Solo WiFi para fotos</Label>
                <p className="text-sm text-muted-foreground">Subir fotos solo cuando hay WiFi</p>
              </div>
              <Switch
                id="wifi-only"
                checked={dataSettings.wifiOnlyUploads}
                onCheckedChange={(checked) => handleDataSettingChange('wifiOnlyUploads', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-cleanup">Limpieza automática</Label>
                <p className="text-sm text-muted-foreground">
                  Eliminar datos antiguos automáticamente
                </p>
              </div>
              <Switch
                id="auto-cleanup"
                checked={dataSettings.autoCleanupEnabled}
                onCheckedChange={(checked) => handleDataSettingChange('autoCleanupEnabled', checked)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="photo-quality">Calidad de fotos</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(dataSettings.photoQuality * 100)}%
                </span>
              </div>
              <Slider
                id="photo-quality"
                min={0.3}
                max={1}
                step={0.1}
                value={[dataSettings.photoQuality]}
                onValueChange={([value]) => handleDataSettingChange('photoQuality', value)}
              />
              <p className="text-xs text-muted-foreground">
                Menor calidad = menos espacio, mayor calidad = mejor imagen
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Limpieza manual (mantener sección existente) */}
        {cleanupSuggestions && cleanupSuggestions.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Limpieza manual
              </CardTitle>
              <CardDescription>Libera espacio eliminando datos antiguos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-medium">
                    Puedes liberar {formatFileSize(cleanupSuggestions.canFree)}
                  </p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {cleanupSuggestions.suggestions.map((suggestion, index) => (
                    <li key={index}>• {suggestion.description}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleCleanup}>
                  Limpiar datos antiguos
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Limpiar todo el cache
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Limpiar todo el cache?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esto eliminará todos los datos en cache. Algunos datos pueden tardar más en
                        cargar la próxima vez.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearCache}>Limpiar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Eliminar todos los borradores
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar todos los borradores?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esto eliminará todos los formularios guardados como borrador. Esta acción no
                        se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteDrafts}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer: Botón Logout */}
        <div className="py-6">
          <Button
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Modal de opciones de avatar */}
      <Dialog open={showAvatarOptions} onOpenChange={setShowAvatarOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar foto de perfil</DialogTitle>
            <DialogDescription>Elige una opción para actualizar tu avatar</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // Abrir cámara
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.capture = 'user'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    handleAvatarChange(file)
                  }
                }
                input.click()
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              Tomar foto
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    handleAvatarChange(file)
                  }
                }
                input.click()
              }}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Elegir de galería
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                // Usar avatar predeterminado (eliminar avatar)
                try {
                  await api.delete('/auth/me/avatar')
                  setUserInfo((prev) => ({ ...prev, avatarUrl: '' }))
                  setShowAvatarOptions(false)
                  toast({
                    title: 'Avatar actualizado',
                    description: 'Se ha restablecido el avatar predeterminado',
                  })
                } catch (error: any) {
                  toast({
                    title: 'Error',
                    description: error.response?.data?.error || 'No se pudo actualizar el avatar',
                    variant: 'destructive',
                  })
                }
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Usar avatar predeterminado
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sheet de edición de perfil */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="bottom" className="overflow-y-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Editar perfil</SheetTitle>
            <SheetDescription>Actualiza tu información personal</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={userInfo.name}
                onChange={(e) => setUserInfo((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userInfo.email}
                onChange={(e) => setUserInfo((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={userInfo.phone || ''}
                onChange={(e) => setUserInfo((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={userInfo.company || ''}
                onChange={(e) => setUserInfo((prev) => ({ ...prev, company: e.target.value }))}
                placeholder="Amaranto Constructora"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Área</Label>
              <Input
                id="area"
                value={userInfo.area || ''}
                onChange={(e) => setUserInfo((prev) => ({ ...prev, area: e.target.value }))}
                placeholder="Operaciones"
              />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowEditSheet(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialog de confirmación de logout */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cerrar sesión? Tendrás que iniciar sesión nuevamente para
              acceder a la aplicación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default MobileProfile
