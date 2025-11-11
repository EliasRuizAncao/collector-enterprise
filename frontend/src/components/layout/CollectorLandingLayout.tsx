import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'
import collectorMark from '@/assets/collector-mark.svg'

const CollectorLandingLayout = () => {
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
    { to: '/collector', label: 'Inicio' },
    { to: '/collector/nosotros', label: 'Nosotros' },
    { to: '/collector/contacto', label: 'Contacto' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-all duration-200',
          isScrolled
            ? 'border-border bg-white/75 shadow-sm backdrop-blur'
            : 'border-transparent bg-transparent',
        )}
      >
        <div className="container flex items-center justify-between py-4">
          <Link to="/collector" className="flex items-center gap-3">
            <img src={collectorMark} alt="Collector Enterprise" className="h-10 w-10" />
            <span className="text-lg font-semibold text-primary">Collector Enterprise</span>
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
        </div>

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
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-muted/30">
        <div className="container flex flex-col gap-2 py-6 text-center text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Collector Enterprise. Plataforma para constructoras.</p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:hola@collectorenterprise.com"
              className="hover:text-primary"
            >
              hola@collectorenterprise.com
            </a>
            <span className="hidden md:inline-block text-muted-foreground">·</span>
            <Link to="/collector/contacto" className="hover:text-primary">
              Agenda una demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CollectorLandingLayout


