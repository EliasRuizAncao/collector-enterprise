import { useMemo, useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  ClipboardList,
  Camera,
  Hammer,
  BarChart3,
  Shield,
  Package,
  PackageCheck,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import { Separator } from '@/shared/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/shared/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { useAuth } from '@/shared/hooks/useAuth'
import { usePermission } from '@/shared/hooks/usePermission'
import { Permission } from '@/shared/types/permissions'
import { useAuthStore } from '@/shared/store/authStore'
import { authService } from '@/shared/services/authService'
import NotificationBell from '@/components/layout/NotificationBell'
import ThemeToggle from '@/shared/components/theme/ThemeToggle'
import logoImage from '@/assets/logo.jpg'

type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  allowedRoles?: ('ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR')[] // Deprecated: usar permissions
  permissions?: Permission[] // Permisos requeridos (cualquiera de ellos)
}

const allNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: LayoutDashboard,
    permissions: [Permission.ACCESS_ADMIN_PANEL],
  },
  {
    label: 'Formularios',
    to: '/admin/formularios',
    icon: FileText,
    permissions: [Permission.FORMS_VIEW],
  },
  {
    label: 'Asignaciones',
    to: '/admin/asignaciones',
    icon: ClipboardList,
    permissions: [Permission.ASSIGNMENTS_VIEW],
  },
  {
    label: 'Cámara EPP',
    to: '/admin/epp-monitor',
    icon: Camera,
    permissions: [Permission.EPP_MONITOR_VIEW],
  },
  {
    label: 'Avance de obra',
    to: '/admin/reconocimiento1',
    icon: Hammer,
    permissions: [Permission.STRUCTURE_MONITOR_VIEW],
  },
  {
    label: 'Usuarios',
    to: '/admin/usuarios',
    icon: Users,
    permissions: [Permission.USERS_VIEW],
  },
  {
    label: 'Reportes',
    to: '/admin/reportes',
    icon: BarChart3,
    permissions: [Permission.REPORTS_VIEW],
  },
  {
    label: 'Roles y Permisos',
    to: '/admin/roles-permisos',
    icon: Shield,
    permissions: [Permission.ROLES_VIEW],
  },
  {
    label: 'Stock de Bodega',
    to: '/admin/warehouse/stock',
    icon: Package,
    permissions: [Permission.WAREHOUSE_MANAGE_STOCK, Permission.WAREHOUSE_VIEW_STOCK],
  },
  {
    label: 'Solicitudes',
    to: '/admin/warehouse/requests',
    icon: PackageCheck,
    permissions: [Permission.WAREHOUSE_AUTHORIZE_REQUESTS],
  },
  {
    label: 'Configuración',
    to: '/admin/settings',
    icon: Settings,
    permissions: [Permission.ACCESS_SETTINGS],
  },
]

const AdminLayout = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { hasAnyPermission } = usePermission()
  const { permissions, setPermissions } = useAuthStore()
  const navigate = useNavigate()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const userInitials = useMemo(() => {
    const source = user?.name ?? user?.email ?? 'Invitado'
    return source
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }, [user?.email, user?.name])

  // Recargar permisos si no están cargados
  useEffect(() => {
    if (user && !permissions) {
      console.log('[AdminLayout] Permisos no cargados, recargando...')
      authService.refreshPermissions()
        .then((newPermissions) => {
          console.log('[AdminLayout] Permisos recargados:', newPermissions?.length)
          if (newPermissions) {
            setPermissions(newPermissions)
          }
        })
        .catch((error) => {
          console.error('[AdminLayout] Error al recargar permisos:', error)
        })
    }
  }, [user, permissions, setPermissions])

  // Filtrar items de navegación según los permisos del usuario
  const navItems = useMemo(() => {
    if (!user) return []
    return allNavItems.filter((item) => {
      // Si tiene permisos definidos, verificar que el usuario tenga al menos uno
      if (item.permissions && item.permissions.length > 0) {
        return hasAnyPermission(item.permissions)
      }
      // Si solo tiene allowedRoles (deprecated), mantener compatibilidad
      if (item.allowedRoles && item.allowedRoles.length > 0) {
        return item.allowedRoles.includes(user.role as 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR')
      }
      // Si no tiene restricciones, está disponible para todos
      return true
    })
  }, [user, hasAnyPermission])

  // Construye los breadcrumbs dinámicamente a partir de la ruta actual
  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
      return []
    }

    const items = segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`
      const matchedNav = navItems.find((item) => item.to === path)
      const label =
        matchedNav?.label ??
        segment
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())

      return {
        label,
        path,
        isLast: index === segments.length - 1,
      }
    })

    return items
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al cerrar sesión', error)
    }
  }

  const renderNavigationLinks = (onNavigate?: () => void) =>
    navItems.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-medium transition-all hover:border-accent hover:bg-accent/50 hover:text-foreground',
            isActive && 'border-primary/20 bg-primary/10 text-primary',
          )
        }
        onClick={onNavigate}
      >
        <Icon className="h-4 w-4" />
        {label}
      </NavLink>
    ))

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background/90 to-background text-foreground">
      {/* Sidebar en desktop */}
      <aside className="hidden w-64 flex-col border-r border-border/60 bg-card/60 px-4 py-6 backdrop-blur lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-white">
            <img src={logoImage} alt="Amaranto Logo" className="h-full w-full object-contain p-1" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">Collector Enterprise</p>
            <p className="text-xs text-muted-foreground">Panel administrativo</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">{renderNavigationLinks()}</nav>

        <Separator className="my-4" />

        <div className="rounded-xl border border-border/80 bg-background/80 p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">
                {user?.name ?? 'Invitado'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role?.toLowerCase() ?? 'sin rol'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir navegación</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs border-r border-border/60 bg-background/95 px-4 py-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-white">
                    <img src={logoImage} alt="Amaranto Logo" className="h-full w-full object-contain p-1" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">Collector Enterprise</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                </div>

                <nav className="flex flex-col gap-1">
                  {renderNavigationLinks(() => setIsSheetOpen(false))}
                </nav>

                <Separator className="my-4" />

                <div className="rounded-xl border border-border/80 bg-background/80 p-3 shadow-sm">
                  <div className="mb-2 flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">
                        {user?.name ?? 'Invitado'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user?.role?.toLowerCase() ?? 'sin rol'}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIsSheetOpen(false)
                      void handleLogout()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Breadcrumb className="hidden flex-col gap-1 text-sm lg:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/admin/dashboard">Inicio</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb) => (
                  <BreadcrumbItem key={crumb.path}>
                    <BreadcrumbSeparator />
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.path}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
              <span className="text-xs text-muted-foreground">
                Bienvenido al panel de control
              </span>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-border/60"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Abrir menú de usuario</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {user?.name ?? 'Invitado'}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {user?.role?.toLowerCase() ?? 'sin rol'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event: Event) => {
                    event.preventDefault()
                    navigate('/admin/profile')
                  }}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event: Event) => {
                    event.preventDefault()
                    navigate('/admin/settings')
                  }}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event: Event) => {
                    event.preventDefault()
                    void handleLogout()
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 bg-background/80 px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

