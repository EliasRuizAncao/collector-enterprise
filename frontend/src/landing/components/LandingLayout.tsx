import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import amarantoLogo from '@/assets/logo.jpg'

// Layout base para las páginas públicas (landing)
const LandingLayout = () => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/nosotros', label: 'Nosotros' },
    { to: '/contacto', label: 'Contacto' },
  ]

  return (
    <div className="theme-amaranto flex min-h-screen flex-col bg-background text-foreground">
      {/* Header sticky con efecto al hacer scroll */}
      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-all duration-200',
          isScrolled
            ? 'border-border bg-white/80 shadow-sm backdrop-blur'
            : 'border-transparent bg-transparent',
        )}
      >
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-4">
            <img
              src={amarantoLogo}
              alt="Amaranto Constructora"
              className="h-14 w-14 rounded-xl object-cover shadow-md ring-2 ring-teal-500/30"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold uppercase tracking-[0.5em] text-primary">
                Amaranto
              </span>
              <span className="text-xs font-medium text-primary/70">Constructora</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'transition-colors hover:text-primary',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button asChild>
              <Link to="/login">Portal Collector</Link>
            </Button>
          </div>
        </div>

        {/* Navegación móvil */}
        <div className="container pb-4 md:hidden">
          <nav className="flex flex-col gap-2 text-sm font-medium">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-4 py-2 transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Button asChild variant="secondary" className="w-full">
              <Link to="/login">Portal Collector</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer simple */}
      <footer className="border-t bg-muted/30">
        <div className="container flex flex-col gap-2 py-6 text-center text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Amaranto Constructora. Todos los derechos reservados.</p>

          <div className="flex justify-center gap-4">
            <span className="text-muted-foreground">
              contacto@amaranto.cl · +56 2 2345 6789
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingLayout

