/**
 * Página de Configuración - Mobile
 * Configuración completa y organizada por categorías
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  User,
  Lock,
  Shield,
  Bell,
  RefreshCw,
  Wifi,
  HardDrive,
  Eye,
  Palette,
  Accessibility,
  Network,
  Globe,
  Settings as SettingsIcon,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Volume2,
  Vibrate,
  Calendar,
  MapPin,
  Camera,
  Mic,
  Database,
  ExternalLink,
  Moon,
  Sun,
  Monitor,
  Type,
  Zap,
  EyeOff,
  Languages,
  FileText,
  Bug,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import { Label } from '@/shared/components/ui/label'
import { Slider } from '@/shared/components/ui/slider'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'
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
import { Progress } from '@/shared/components/ui/progress'
import { Badge } from '@/shared/components/ui/badge'
import { useToast } from '@/shared/components/ui/use-toast'
import { useSyncManager } from '../hooks/useSyncManager'
import { useDataManager } from '../hooks/useDataManager'
import { useHaptics } from '../hooks/useHaptics'
import { DataUsageIndicator } from '../components/offline'
import { formatFileSize } from '../utils/imageCompression'
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/pushNotifications'
import TagManager from '../components/TagManager'

/**
 * Página principal de configuración
 */
const Settings = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { syncNow, isSyncing, pendingCount, lastSyncDate } = useSyncManager()
  const haptics = useHaptics()
  const {
    storageInfo,
    getStorageInfo,
    clearAllCache,
    deleteAllDrafts,
    getCleanupSuggestions,
  } = useDataManager()

  // Estados de configuración
  const [settings, setSettings] = useState({
    // Notificaciones
    pushNotifications: false,
    notifications: {
      newTasks: true,
      reminders: true,
      comments: true,
      updates: true,
    },
    doNotDisturb: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    sound: 'default',
    vibration: true,
    badgeCount: true,
    haptics: {
      enabled: true,
      intensity: 'medium' as 'light' | 'medium' | 'heavy',
    },

    // Sincronización
    autoSync: true,
    wifiOnlySync: false,
    syncFrequency: '5min' as 'manual' | '5min' | '15min' | '1hour',

    // Privacidad
    location: 'when-using' as 'always' | 'when-using' | 'never',
    camera: true,
    microphone: false,
    storage: true,

    // Apariencia
    theme: 'auto' as 'light' | 'dark' | 'auto',
    fontSize: 1,
    density: 'normal' as 'compact' | 'normal' | 'spacious',
    animations: true,

    // Accesibilidad
    highContrast: false,
    reduceMotion: false,
    captions: false,

    // Conexión
    offlineMode: false,
    imageQuality: 'auto' as 'high' | 'medium' | 'low' | 'auto',
    limitDataUsage: false,

    // Idioma y región
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h' as '12h' | '24h',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Avanzado
    developerMode: false,
    debugLogs: false,
  })

  const [developerTaps, setDeveloperTaps] = useState(0)
  const [storageBreakdown, setStorageBreakdown] = useState({
    forms: 0,
    photos: 0,
    cache: 0,
    drafts: 0,
  })

  // Cargar configuración guardada
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        setSettings({ ...settings, ...JSON.parse(savedSettings) })
      } catch (error) {
        console.error('Error al cargar configuración:', error)
      }
    }

    // Cargar permisos de notificaciones
    const notificationPermission = getNotificationPermission()
    
    // Cargar preferencias de haptics
    const hapticPrefs = haptics.getPreferences()
    
    setSettings((prev) => ({
      ...prev,
      pushNotifications: notificationPermission === 'granted',
      haptics: {
        enabled: hapticPrefs.enabled,
        intensity: hapticPrefs.intensity,
      },
    }))

    // Cargar desglose de almacenamiento
    loadStorageBreakdown()
  }, [])

  // Cargar desglose de almacenamiento
  const loadStorageBreakdown = async () => {
    try {
      await getStorageInfo()
      // Aquí se calcularía el desglose real desde IndexedDB
      // Por ahora, valores estimados
      setStorageBreakdown({
        forms: storageInfo.used * 0.3,
        photos: storageInfo.used * 0.5,
        cache: storageInfo.used * 0.15,
        drafts: storageInfo.used * 0.05,
      })
    } catch (error) {
      console.error('Error al cargar desglose de almacenamiento:', error)
    }
  }

  // Guardar configuración
  const saveSettings = (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('app-settings', JSON.stringify(updated))
    toast({
      title: 'Configuración guardada',
      description: 'Los cambios se han aplicado correctamente',
    })
  }

  // Manejar cambio de configuración
  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    saveSettings({ [key]: value })
  }

  // Activar modo desarrollador (7 taps)
  const handleDeveloperTap = () => {
    const newTaps = developerTaps + 1
    setDeveloperTaps(newTaps)

    if (newTaps >= 7) {
      setSettings((prev) => ({ ...prev, developerMode: true }))
      toast({
        title: 'Modo desarrollador activado',
        description: 'Las opciones avanzadas están ahora disponibles',
      })
      setDeveloperTaps(0)
    } else {
      setTimeout(() => setDeveloperTaps(0), 2000)
    }
  }

  // Sincronizar ahora
  const handleSyncNow = async () => {
    try {
      await syncNow()
      toast({
        title: 'Sincronización iniciada',
        description: 'Los datos se están sincronizando en segundo plano',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la sincronización',
        variant: 'destructive',
      })
    }
  }

  // Solicitar permisos de notificaciones
  const handleRequestNotifications = async () => {
    try {
      const permission = await requestNotificationPermission()
      if (permission === 'granted') {
        saveSettings({ pushNotifications: true })
        toast({
          title: 'Notificaciones habilitadas',
          description: 'Ahora recibirás notificaciones push',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron habilitar las notificaciones',
        variant: 'destructive',
      })
    }
  }

  // Limpiar cache
  const handleClearCache = async () => {
    try {
      await clearAllCache()
      await loadStorageBreakdown()
      toast({
        title: 'Cache limpiado',
        description: 'Se ha limpiado todo el cache',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo limpiar el cache',
        variant: 'destructive',
      })
    }
  }

  // Eliminar borradores antiguos
  const handleDeleteOldDrafts = async () => {
    try {
      await deleteAllDrafts()
      await loadStorageBreakdown()
      toast({
        title: 'Borradores eliminados',
        description: 'Se han eliminado todos los borradores antiguos',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar los borradores',
        variant: 'destructive',
      })
    }
  }

  // Restablecer configuración
  const handleResetSettings = () => {
    localStorage.removeItem('app-settings')
    setSettings({
      pushNotifications: false,
      notifications: {
        newTasks: true,
        reminders: true,
        comments: true,
        updates: true,
      },
      doNotDisturb: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      sound: 'default',
      vibration: true,
      haptics: {
        enabled: true,
        intensity: 'medium' as 'light' | 'medium' | 'heavy',
      },
      badgeCount: true,
      autoSync: true,
      wifiOnlySync: false,
      syncFrequency: '5min',
      location: 'when-using',
      camera: true,
      microphone: false,
      storage: true,
      theme: 'auto',
      fontSize: 1,
      density: 'normal',
      animations: true,
      highContrast: false,
      reduceMotion: false,
      captions: false,
      offlineMode: false,
      imageQuality: 'auto',
      limitDataUsage: false,
      language: 'es',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      developerMode: false,
      debugLogs: false,
    })
    toast({
      title: 'Configuración restablecida',
      description: 'Se han restablecido todos los valores por defecto',
    })
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
        <h1 className="flex-1 text-xl font-bold">Configuración</h1>
      </div>

      {/* Contenido */}
      <div className="flex-1 space-y-6 p-4">
        {/* 1. Cuenta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => navigate('/mobile/profile')}
            >
              <span>Ver perfil</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => navigate('/mobile/profile')}
            >
              <span>Editar información</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => navigate('/mobile/settings/security')}
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Cambiar contraseña</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => navigate('/mobile/settings/security')}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Verificación en dos pasos</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => navigate('/mobile/settings/sessions')}
            >
              <span>Sesiones activas</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between text-destructive"
              onClick={() => navigate('/mobile/settings/delete-account')}
            >
              <span>Eliminar cuenta</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* 2. Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones push</Label>
                <p className="text-xs text-muted-foreground">
                  Recibir notificaciones en el dispositivo
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleRequestNotifications()
                  } else {
                    handleSettingChange('pushNotifications', false)
                  }
                }}
              />
            </div>
            {settings.pushNotifications && (
              <>
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-semibold">Tipos de notificaciones</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Nuevas tareas</Label>
                      <Switch
                        checked={settings.notifications.newTasks}
                        onCheckedChange={(checked) =>
                          saveSettings({
                            notifications: { ...settings.notifications, newTasks: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Recordatorios</Label>
                      <Switch
                        checked={settings.notifications.reminders}
                        onCheckedChange={(checked) =>
                          saveSettings({
                            notifications: { ...settings.notifications, reminders: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Comentarios</Label>
                      <Switch
                        checked={settings.notifications.comments}
                        onCheckedChange={(checked) =>
                          saveSettings({
                            notifications: { ...settings.notifications, comments: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Actualizaciones</Label>
                      <Switch
                        checked={settings.notifications.updates}
                        onCheckedChange={(checked) =>
                          saveSettings({
                            notifications: { ...settings.notifications, updates: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>No molestar</Label>
                    <Switch
                      checked={settings.doNotDisturb.enabled}
                      onCheckedChange={(checked) =>
                        saveSettings({
                          doNotDisturb: { ...settings.doNotDisturb, enabled: checked },
                        })
                      }
                    />
                  </div>
                  {settings.doNotDisturb.enabled && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">De</span>
                      <Input
                        type="time"
                        value={settings.doNotDisturb.start}
                        onChange={(e) =>
                          saveSettings({
                            doNotDisturb: { ...settings.doNotDisturb, start: e.target.value },
                          })
                        }
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={settings.doNotDisturb.end}
                        onChange={(e) =>
                          saveSettings({
                            doNotDisturb: { ...settings.doNotDisturb, end: e.target.value },
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-3 border-t pt-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Sonido
                    </Label>
                    <Select
                      value={settings.sound}
                      onValueChange={(value) => handleSettingChange('sound', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Predeterminado</SelectItem>
                        <SelectItem value="none">Sin sonido</SelectItem>
                        <SelectItem value="gentle">Suave</SelectItem>
                        <SelectItem value="alert">Alerta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Vibrate className="h-4 w-4" />
                      Vibración
                    </Label>
                    <Switch
                      checked={settings.vibration}
                      onCheckedChange={(checked) => handleSettingChange('vibration', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Contador de badge</Label>
                    <Switch
                      checked={settings.badgeCount}
                      onCheckedChange={(checked) => handleSettingChange('badgeCount', checked)}
                    />
                  </div>
                </div>

                {/* Configuración de Feedback Háptico */}
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Feedback Háptico
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Vibración táctil al interactuar con la app
                        </p>
                      </div>
                      <Switch
                        checked={settings.haptics.enabled}
                        onCheckedChange={(checked) => {
                          const newHaptics = { ...settings.haptics, enabled: checked }
                          handleSettingChange('haptics', newHaptics)
                          haptics.setPreferences({ enabled: checked })
                        }}
                      />
                    </div>
                    {settings.haptics.enabled && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Intensidad</Label>
                            <Badge variant="outline">
                              {settings.haptics.intensity === 'light' && 'Suave'}
                              {settings.haptics.intensity === 'medium' && 'Media'}
                              {settings.haptics.intensity === 'heavy' && 'Fuerte'}
                            </Badge>
                          </div>
                          <Slider
                            min={0}
                            max={2}
                            step={1}
                            value={[
                              settings.haptics.intensity === 'light' ? 0 :
                              settings.haptics.intensity === 'medium' ? 1 : 2
                            ]}
                            onValueChange={(value) => {
                              const intensity = value[0] === 0 ? 'light' : value[0] === 1 ? 'medium' : 'heavy'
                              const newHaptics = { ...settings.haptics, intensity }
                              handleSettingChange('haptics', newHaptics)
                              haptics.setPreferences({ intensity })
                            }}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Suave</span>
                            <span>Media</span>
                            <span>Fuerte</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            haptics.test(settings.haptics.intensity)
                            toast({
                              title: 'Prueba de feedback háptico',
                              description: `Vibración ${settings.haptics.intensity === 'light' ? 'suave' : settings.haptics.intensity === 'medium' ? 'media' : 'fuerte'}`,
                              duration: 2000,
                            })
                          }}
                          disabled={!haptics.isSupported}
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          Probar Feedback Háptico
                        </Button>
                        {!haptics.isSupported && (
                          <p className="text-xs text-muted-foreground text-center">
                            El feedback háptico no está soportado en este dispositivo
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. Datos y Sincronización */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Datos y Sincronización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-sync</Label>
                <p className="text-xs text-muted-foreground">
                  Sincronizar automáticamente en segundo plano
                </p>
              </div>
              <Switch
                checked={settings.autoSync}
                onCheckedChange={(checked) => handleSettingChange('autoSync', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Solo en WiFi</Label>
                <p className="text-xs text-muted-foreground">
                  Sincronizar solo cuando hay WiFi disponible
                </p>
              </div>
              <Switch
                checked={settings.wifiOnlySync}
                onCheckedChange={(checked) => handleSettingChange('wifiOnlySync', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>Frecuencia de sync</Label>
              <Select
                value={settings.syncFrequency}
                onValueChange={(value: 'manual' | '5min' | '15min' | '1hour') =>
                  handleSettingChange('syncFrequency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="5min">Cada 5 minutos</SelectItem>
                  <SelectItem value="15min">Cada 15 minutos</SelectItem>
                  <SelectItem value="1hour">Cada hora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 border-t pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSyncNow}
                disabled={isSyncing}
              >
                <RefreshCw
                  className={cn('h-4 w-4 mr-2', isSyncing && 'animate-spin')}
                />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Datos pendientes</span>
                <Badge variant={pendingCount > 0 ? 'destructive' : 'secondary'}>
                  {pendingCount}
                </Badge>
              </div>
              {lastSyncDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Última sincronización</span>
                  <span className="text-muted-foreground">
                    {format(lastSyncDate, 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. Almacenamiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Almacenamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataUsageIndicator showAlert={true} alertThreshold={80} />
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-semibold">Desglose por tipo</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Formularios</span>
                  <span className="text-muted-foreground">
                    {formatFileSize(storageBreakdown.forms)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Fotos</span>
                  <span className="text-muted-foreground">
                    {formatFileSize(storageBreakdown.photos)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Cache</span>
                  <span className="text-muted-foreground">
                    {formatFileSize(storageBreakdown.cache)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Borradores</span>
                  <span className="text-muted-foreground">
                    {formatFileSize(storageBreakdown.drafts)}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 border-t pt-4">
              <Button variant="outline" className="w-full" onClick={handleClearCache}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar cache
              </Button>
              <Button variant="outline" className="w-full" onClick={handleDeleteOldDrafts}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar borradores antiguos (&gt;30 días)
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => {
                  // Por ahora, mostrar información de almacenamiento en un toast
                  // TODO: Crear página dedicada de gestión de almacenamiento si es necesario
                  toast({
                    title: 'Gestión de Descargas',
                    description: 'Esta funcionalidad estará disponible próximamente. Por ahora puedes limpiar el cache desde aquí.',
                  })
                }}
              >
                <span>Gestionar descargas</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 5. Privacidad y Permisos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacidad y Permisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación
              </Label>
              <Select
                value={settings.location}
                onValueChange={(value: 'always' | 'when-using' | 'never') =>
                  handleSettingChange('location', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Siempre</SelectItem>
                  <SelectItem value="when-using">Al usar la app</SelectItem>
                  <SelectItem value="never">Nunca</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <Label>Cámara</Label>
              </div>
              <Switch
                checked={settings.camera}
                onCheckedChange={(checked) => handleSettingChange('camera', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <Label>Micrófono</Label>
              </div>
              <Switch
                checked={settings.microphone}
                onCheckedChange={(checked) => handleSettingChange('microphone', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <Label>Almacenamiento</Label>
              </div>
              <Switch
                checked={settings.storage}
                onCheckedChange={(checked) => handleSettingChange('storage', checked)}
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Abrir configuración del sistema (no disponible en web, solo en PWA instalada)
                toast({
                  title: 'Configuración del sistema',
                  description:
                    'Abre la configuración de tu dispositivo para gestionar permisos',
                })
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir configuración del sistema
            </Button>
          </CardContent>
        </Card>

        {/* 6. Apariencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                {settings.theme === 'light' ? (
                  <Sun className="h-4 w-4" />
                ) : settings.theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                Tema
              </Label>
              <Select
                value={settings.theme}
                onValueChange={(value: 'light' | 'dark' | 'auto') =>
                  handleSettingChange('theme', value)
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
                  Tamaño de texto
                </Label>
                <span className="text-sm text-muted-foreground">
                  {settings.fontSize === 0.875
                    ? 'Pequeño'
                    : settings.fontSize === 1
                      ? 'Normal'
                      : settings.fontSize === 1.125
                        ? 'Grande'
                        : 'Muy grande'}
                </span>
              </div>
              <Slider
                min={0.875}
                max={1.25}
                step={0.125}
                value={[settings.fontSize]}
                onValueChange={([value]) => handleSettingChange('fontSize', value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Densidad de información</Label>
              <Select
                value={settings.density}
                onValueChange={(value: 'compact' | 'normal' | 'spacious') =>
                  handleSettingChange('density', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacto</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="spacious">Espacioso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Animaciones
              </Label>
              <Switch
                checked={settings.animations}
                onCheckedChange={(checked) => handleSettingChange('animations', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 7. Accesibilidad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              Accesibilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Alto contraste</Label>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Reducir movimiento</Label>
              <Switch
                checked={settings.reduceMotion}
                onCheckedChange={(checked) => handleSettingChange('reduceMotion', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Subtítulos</Label>
              <Switch
                checked={settings.captions}
                onCheckedChange={(checked) => handleSettingChange('captions', checked)}
              />
            </div>
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                Esta app es compatible con lectores de pantalla y sigue las pautas de
                accesibilidad WCAG 2.1
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 8. Conexión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Conexión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo offline</Label>
                <p className="text-xs text-muted-foreground">
                  Forzar modo offline para testing
                </p>
              </div>
              <Switch
                checked={settings.offlineMode}
                onCheckedChange={(checked) => handleSettingChange('offlineMode', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>Calidad de imágenes</Label>
              <Select
                value={settings.imageQuality}
                onValueChange={(value: 'high' | 'medium' | 'low' | 'auto') =>
                  handleSettingChange('imageQuality', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta (WiFi)</SelectItem>
                  <SelectItem value="medium">Media (Móvil)</SelectItem>
                  <SelectItem value="low">Baja (Datos)</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Limitar uso de datos</Label>
                <p className="text-xs text-muted-foreground">
                  Reducir consumo de datos móviles
                </p>
              </div>
              <Switch
                checked={settings.limitDataUsage}
                onCheckedChange={(checked) => handleSettingChange('limitDataUsage', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 9. Idioma y Región */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Idioma y Región
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Idioma de la app
              </Label>
              <Select
                value={settings.language}
                onValueChange={(value) => handleSettingChange('language', value)}
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
                <Calendar className="h-4 w-4" />
                Formato de fecha
              </Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value) => handleSettingChange('dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato de hora</Label>
              <Select
                value={settings.timeFormat}
                onValueChange={(value: '12h' | '24h') => handleSettingChange('timeFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                  <SelectItem value="24h">24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Zona horaria</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => handleSettingChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Santiago">Santiago (GMT-3)</SelectItem>
                  <SelectItem value="America/Lima">Lima (GMT-5)</SelectItem>
                  <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                  <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 9. Gestión de Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gestión de Tags
            </CardTitle>
            <CardDescription>
              Administra tus tags personalizados y visualiza estadísticas de uso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagManager />
          </CardContent>
        </Card>

        {/* 10. Avanzado */}
        {settings.developerMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Avanzado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Logs de depuración</Label>
                <Switch
                  checked={settings.debugLogs}
                  onCheckedChange={(checked) => handleSettingChange('debugLogs', checked)}
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Exportar datos
                  toast({
                    title: 'Exportar datos',
                    description: 'Funcionalidad en desarrollo',
                  })
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar datos
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Importar datos
                  toast({
                    title: 'Importar datos',
                    description: 'Funcionalidad en desarrollo',
                  })
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar datos
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive"
                onClick={handleResetSettings}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restablecer configuración
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tap para activar modo desarrollador */}
        {!settings.developerMode && (
          <div
            className="py-8 text-center"
            onClick={handleDeveloperTap}
            style={{ cursor: 'pointer' }}
          >
            <p className="text-xs text-muted-foreground">
              Versión {import.meta.env.VITE_APP_VERSION || '1.0.0'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings

