import { useState, useRef, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import logo from '@/assets/collector-mark.svg'
import { useAuth } from '@/shared/hooks/useAuth'
import { useAuthStore } from '@/shared/store/authStore'
import { Permission } from '@/shared/types/permissions'

// Esquema de validación para el formulario de inicio de sesión
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  remember: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

/**
 * Determina la ruta de redirección según los permisos del usuario
 * - ACCESS_ADMIN_PANEL -> /admin/dashboard
 * - ACCESS_MOBILE_APP -> /mobile/dashboard
 */
const getRedirectPath = (perms: Permission[] | null): string => {
  if (!perms || perms.length === 0) {
    // Si no hay permisos, redirigir al login
    return '/login'
  }

  // Normalizar permisos a strings para comparación
  const normalizedPermissions = perms.map((p) => String(p))
  const adminPermissionStr = String(Permission.ACCESS_ADMIN_PANEL)
  const mobilePermissionStr = String(Permission.ACCESS_MOBILE_APP)

  // Priorizar acceso al panel admin
  if (normalizedPermissions.includes(adminPermissionStr)) {
    return '/admin/dashboard'
  }

  // Si tiene acceso a mobile
  if (normalizedPermissions.includes(mobilePermissionStr)) {
    return '/mobile/dashboard'
  }

  // Si no tiene acceso a ninguno, redirigir al login
  return '/login'
}

const Login = () => {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAccessSelector, setShowAccessSelector] = useState(false)
  const [pendingPermissions, setPendingPermissions] = useState<Permission[] | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const { permissions } = useAuthStore()
  const hasRedirectedRef = useRef(false) // Para evitar múltiples redirecciones

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  const onSubmit = async ({ email, password }: LoginFormValues) => {
    setError(null)
    setIsSubmitting(true)
    try {
      // El login ya guarda los permisos en el store a través de setAuth
      // Intentar obtener los permisos directamente de la respuesta del login
      let userPermissions: Permission[] | null = null
      
      try {
        // El hook login no retorna datos directamente, así que obtenemos del store
        await login(email, password)
        
        // Esperar un momento para que el store se actualice
        await new Promise((resolve) => setTimeout(resolve, 300))
        
        const currentState = useAuthStore.getState()
        userPermissions = currentState.permissions
        
        console.log('[Login] Permissions from store after login:', userPermissions)
      } catch (loginError) {
        // El error ya fue manejado en el hook, solo necesitamos salir
        throw loginError
      }
      
      if (!userPermissions || userPermissions.length === 0) {
        console.error('[Login] No permissions found after login')
        setError('No se pudieron cargar los permisos. Por favor, intenta nuevamente.')
        setIsSubmitting(false)
        return
      }
      
      // Normalizar permisos a strings para comparación
      const normalizedPermissions = userPermissions.map((p) => String(p))
      const adminPermissionStr = String(Permission.ACCESS_ADMIN_PANEL)
      const mobilePermissionStr = String(Permission.ACCESS_MOBILE_APP)
      
      // Verificar si tiene ambos permisos
      const hasAdminAccess = normalizedPermissions.includes(adminPermissionStr)
      const hasMobileAccess = normalizedPermissions.includes(mobilePermissionStr)
      
      console.log('[Login] Permission check:', {
        userPermissions,
        normalizedPermissions,
        adminPermissionStr,
        mobilePermissionStr,
        hasAdminAccess,
        hasMobileAccess,
      })
      
      // Si tiene ambos permisos, mostrar selector
      if (hasAdminAccess && hasMobileAccess) {
        setPendingPermissions(userPermissions)
        setShowAccessSelector(true)
        setIsSubmitting(false)
        return
      }
      
      // Determinar ruta de redirección
      const from = (location.state as { from?: string })?.from
      let redirectTo = getRedirectPath(userPermissions)
      
      // Si hay una ruta previa válida, verificar acceso
      if (from) {
        if (from.startsWith('/admin') && hasAdminAccess) {
          redirectTo = from
        } else if (from.startsWith('/mobile') && hasMobileAccess) {
          redirectTo = from
        }
      }
      
      console.log('[Login] Redirecting after login:', { redirectTo, permissions: userPermissions })
      
      // Redirigir usando navigate para evitar recargar la página
      if (redirectTo !== '/login') {
        console.log('[Login] Redirigiendo después del login a:', redirectTo)
        setIsSubmitting(false)
        // Usar navigate en lugar de window.location para evitar recargar y perder estado
        navigate(redirectTo, { replace: true })
        return // Importante: salir inmediatamente después de la redirección
      } else {
        setIsSubmitting(false)
        setError('No tienes permisos para acceder al sistema. Contacta al administrador.')
      }
    } catch (err) {
      setIsSubmitting(false)
      if (err instanceof Error) {
        const message = err.message.toLowerCase()
        if (message.includes('auth/user-not-found')) {
          setError('El usuario no existe. Contacta al administrador.')
        } else if (message.includes('auth/wrong-password') || message.includes('invalid')) {
          setError('Credenciales inválidas. Verifica tu email y contraseña.')
        } else if (message.includes('network') || message.includes('timeout')) {
          setError('Problema de conexión. Intenta nuevamente en unos minutos.')
        } else {
          setError('Ocurrió un error inesperado. Intenta nuevamente.')
        }
      } else {
        setError('Ocurrió un error inesperado. Intenta nuevamente.')
      }
    }
  }

  // Si el usuario ya está autenticado, verificar permisos y mostrar selector si aplica
  useEffect(() => {
    if (isAuthenticated && permissions && permissions.length > 0 && !isSubmitting && !hasRedirectedRef.current && !showAccessSelector) {
      // Normalizar permisos a strings para comparación
      const normalizedPermissions = permissions.map((p) => String(p))
      const adminPermissionStr = String(Permission.ACCESS_ADMIN_PANEL)
      const mobilePermissionStr = String(Permission.ACCESS_MOBILE_APP)
      
      const hasAdminAccess = normalizedPermissions.includes(adminPermissionStr)
      const hasMobileAccess = normalizedPermissions.includes(mobilePermissionStr)
      
      console.log('[Login] useEffect - Permission check:', {
        permissions,
        normalizedPermissions,
        hasAdminAccess,
        hasMobileAccess,
      })
      
      // Si tiene ambos permisos, mostrar selector
      if (hasAdminAccess && hasMobileAccess) {
        console.log('[Login] Usuario tiene ambos permisos, mostrando selector')
        setPendingPermissions(permissions)
        setShowAccessSelector(true)
        hasRedirectedRef.current = true
        return
      }
      
      // Si no tiene ambos, redirigir normalmente
      const redirectTo = getRedirectPath(permissions)
      if (redirectTo !== '/login') {
        console.log('[Login] Redirigiendo inmediatamente a:', redirectTo)
        hasRedirectedRef.current = true
        navigate(redirectTo, { replace: true })
      }
    }
  }, [isAuthenticated, permissions, isSubmitting, navigate, showAccessSelector])

  // Función para manejar la selección de acceso
  const handleAccessSelection = (accessType: 'admin' | 'mobile') => {
    if (!pendingPermissions) return
    
    const redirectTo = accessType === 'admin' ? '/admin/dashboard' : '/mobile/dashboard'
    setShowAccessSelector(false)
    navigate(redirectTo, { replace: true })
  }

  // Si el usuario ya está autenticado, mostrar loader mientras redirige
  if (isAuthenticated && permissions && permissions.length > 0 && !isSubmitting && !showAccessSelector) {
    // Normalizar permisos a strings para comparación
    const normalizedPermissions = permissions.map((p) => String(p))
    const adminPermissionStr = String(Permission.ACCESS_ADMIN_PANEL)
    const mobilePermissionStr = String(Permission.ACCESS_MOBILE_APP)
    
    const hasAdminAccess = normalizedPermissions.includes(adminPermissionStr)
    const hasMobileAccess = normalizedPermissions.includes(mobilePermissionStr)
    
    console.log('[Login] Already authenticated - Permission check:', {
      permissions,
      normalizedPermissions,
      adminPermissionStr,
      mobilePermissionStr,
      hasAdminAccess,
      hasMobileAccess,
    })
    
    // Si tiene ambos permisos, mostrar selector
    if (hasAdminAccess && hasMobileAccess) {
      setPendingPermissions(permissions)
      setShowAccessSelector(true)
    } else {
      const redirectTo = getRedirectPath(permissions)
      if (redirectTo !== '/login') {
        return (
          <div className="relative flex min-h-screen items-center justify-center bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35)_0,_transparent_55%)]" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-slate-400">Redirigiendo...</p>
            </div>
          </div>
        )
      }
    }
  }
  
  // Mostrar selector de acceso si tiene ambos permisos
  if (showAccessSelector && pendingPermissions) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-slate-950 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35)_0,_transparent_55%)]" />
        <div className="relative z-10 w-full max-w-2xl px-4">
          <Card className="border border-slate-800 bg-slate-900/85 shadow-2xl shadow-slate-900/50 backdrop-blur">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800">
                <img src={logo} alt="Collector Enterprise" className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold text-white">Selecciona tu acceso</CardTitle>
                <CardDescription className="text-slate-400">
                  Tienes acceso a ambas aplicaciones. Elige dónde deseas continuar.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => handleAccessSelection('admin')}
                  className="group relative flex flex-col items-center gap-4 rounded-lg border-2 border-slate-700 bg-slate-800/50 p-6 text-left transition-all hover:border-primary hover:bg-slate-800"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-white">Panel Administrativo</h3>
                    <p className="text-sm text-slate-400">
                      Gestiona formularios, usuarios, reportes y configuración del sistema.
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-sm text-primary">
                    <span>Acceder</span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
                
                <button
                  onClick={() => handleAccessSelection('mobile')}
                  className="group relative flex flex-col items-center gap-4 rounded-lg border-2 border-slate-700 bg-slate-800/50 p-6 text-left transition-all hover:border-primary hover:bg-slate-800"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-white">Aplicación Móvil</h3>
                    <p className="text-sm text-slate-400">
                      Completa formularios, solicita materiales y gestiona tus asignaciones.
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-sm text-primary">
                    <span>Acceder</span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35)_0,_transparent_55%)]" />
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="border border-slate-800 bg-slate-900/85 shadow-2xl shadow-slate-900/50 backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800">
              <img src={logo} alt="Collector Enterprise" className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-white">Iniciar Sesión</CardTitle>
              <CardDescription className="text-slate-400">
                Accede al panel administrativo de Collector Enterprise.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error de autenticación</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu.email@empresa.cl"
                          autoComplete="email"
                          className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-primary focus-visible:ring-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-primary focus-visible:ring-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-slate-600 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                      <div className="grid gap-1 leading-tight">
                        <FormLabel className="text-sm font-medium text-slate-200">
                          Recordarme
                        </FormLabel>
                        <p className="text-xs text-slate-500">
                          Mantén tu sesión activa en este dispositivo.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Autenticando...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button variant="link" className="px-0 text-sm text-slate-400 hover:text-primary" asChild>
              <Link to="#">¿Olvidaste tu contraseña?</Link>
            </Button>
            <p className="text-xs text-slate-500">
              Para acceder necesitas un usuario registrado por el administrador de Collector Enterprise.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Login

