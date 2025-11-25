import { Moon, Sun } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useTheme } from './ThemeProvider'

/**
 * ThemeToggle - Componente para cambiar entre temas
 * 
 * Permite seleccionar entre:
 * - Light (claro)
 * - Dark (oscuro)
 * - System (preferencia del sistema)
 * 
 * Incluye iconos animados y dropdown menu
 */
const ThemeToggle = () => {
  const { theme, setTheme, actualTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border border-border/60 transition-all hover:border-primary/50 hover:bg-accent"
        >
          {/* Icono con transición suave */}
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span className={theme === 'light' ? 'font-semibold' : ''}>
            Claro
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className={theme === 'dark' ? 'font-semibold' : ''}>
            Oscuro
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer"
        >
          <div className="mr-2 h-4 w-4 rounded-full border-2 border-current" />
          <span className={theme === 'system' ? 'font-semibold' : ''}>
            Sistema
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ThemeToggle

