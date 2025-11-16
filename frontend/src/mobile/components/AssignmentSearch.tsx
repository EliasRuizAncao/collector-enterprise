import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Clock } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Label } from '@/shared/components/ui/label'
import AssignmentCard, { type Assignment } from './AssignmentCard'

/**
 * Props del componente AssignmentSearch
 */
interface AssignmentSearchProps {
  /**
   * Si true, el sheet está abierto
   */
  open: boolean
  /**
   * Callback para cerrar el sheet
   */
  onClose: () => void
  /**
   * Callback cuando se ejecuta una búsqueda
   */
  onSearch?: (query: string) => void
  /**
   * Resultados de la búsqueda actual
   */
  results?: Assignment[]
  /**
   * Si true, está buscando
   */
  isSearching?: boolean
}

/**
 * Clave para guardar historial de búsquedas en localStorage
 */
const SEARCH_HISTORY_KEY = 'collector-assignment-search-history'
const MAX_HISTORY_ITEMS = 5

/**
 * Componente AssignmentSearch - Modal de búsqueda desde bottom
 * Sheet optimizado para touch con búsqueda en tiempo real y historial
 */
const AssignmentSearch = ({
  open,
  onClose,
  onSearch,
  results = [],
  isSearching = false,
}: AssignmentSearchProps) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Cargar historial al montar
  useEffect(() => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (history) {
        setSearchHistory(JSON.parse(history))
      }
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }, [])

  // Focus en input al abrir
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 100)
    } else {
      setSearchQuery('')
      setSelectedIndex(-1)
    }
  }, [open])

  // Debounce para búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        onSearch?.(searchQuery.trim())
      }, 300)
    } else {
      onSearch?.('')
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, onSearch])

  // Guardar en historial
  const saveToHistory = useCallback((query: string) => {
    if (!query.trim()) return

    setSearchHistory((prev) => {
      const newHistory = [query, ...prev.filter((item) => item !== query)].slice(0, MAX_HISTORY_ITEMS)
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
      } catch (error) {
        console.error('Error saving search history:', error)
      }
      return newHistory
    })
  }, [])

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch (error) {
      console.error('Error clearing search history:', error)
    }
  }, [])

  // Manejar búsqueda
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      saveToHistory(searchQuery.trim())
      onSearch?.(searchQuery.trim())
    }
  }, [searchQuery, onSearch, saveToHistory])

  // Seleccionar del historial
  const handleHistorySelect = useCallback((query: string) => {
    setSearchQuery(query)
    saveToHistory(query)
    onSearch?.(query)
  }, [onSearch, saveToHistory])

  // Navegación con teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSearch()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown' && results.length > 0) {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp' && results.length > 0) {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, -1))
      }
    },
    [handleSearch, onClose, results.length],
  )

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Limpiar búsqueda
  const handleClear = useCallback(() => {
    setSearchQuery('')
    setSelectedIndex(-1)
    onSearch?.('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [onSearch])

  // Navegar a tarea desde resultado
  const handleResultTap = useCallback(
    (assignmentId: string) => {
      navigate(`/mobile/form/${assignmentId}`)
      onClose()
    },
    [navigate, onClose],
  )


  const showHistory = !searchQuery.trim() && searchHistory.length > 0
  const showResults = searchQuery.trim() && results.length > 0
  const showEmpty = searchQuery.trim() && !isSearching && results.length === 0

  return (
    <Sheet open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[700px] p-0"
        onKeyDown={handleKeyDown}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="border-b border-border/60 px-4 py-3">
            <SheetTitle className="text-mobile-h3 font-semibold">Buscar Tareas</SheetTitle>
          </SheetHeader>

          {/* Search Input */}
          <div className="border-b border-border/60 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="mobile-input pl-10 pr-10"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full touch-manipulation"
                  onClick={handleClear}
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Historial de Búsquedas */}
            {showHistory && (
              <div className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-mobile-caption font-semibold text-muted-foreground">
                    Búsquedas recientes
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-mobile-caption text-muted-foreground hover:text-foreground"
                  >
                    Limpiar
                  </Button>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((query, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleHistorySelect(query)}
                      className="tap-target w-full rounded-lg border border-border bg-card p-3 text-left transition-colors duration-200 touch-manipulation hover:bg-accent active:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium">{query}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Resultados de Búsqueda */}
            {showResults && (
              <div ref={resultsRef} className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-mobile-caption font-semibold text-muted-foreground">
                    Resultados ({results.length})
                  </Label>
                </div>
                <div className="space-y-3">
                  {results.map((assignment, index) => (
                    <div
                      key={assignment.id}
                      className={cn(
                        'rounded-lg transition-colors duration-200',
                        selectedIndex === index && 'ring-2 ring-primary',
                      )}
                      onClick={() => handleResultTap(assignment.id)}
                    >
                      <AssignmentCard
                        assignment={assignment}
                        onTap={() => handleResultTap(assignment.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isSearching && (
              <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-8">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-mobile-caption text-muted-foreground">Buscando...</p>
              </div>
            )}

            {/* Empty State */}
            {showEmpty && (
              <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-8 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-mobile-h3 mb-2 font-semibold">No se encontraron tareas</h3>
                <p className="text-mobile-caption text-muted-foreground max-w-[250px]">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            )}

            {/* Placeholder cuando está vacío */}
            {!showHistory && !showResults && !isSearching && !showEmpty && (
              <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-8 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-mobile-h3 mb-2 font-semibold">Buscar tareas</h3>
                <p className="text-mobile-caption text-muted-foreground max-w-[250px]">
                  Escribe para buscar por nombre de formulario
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default AssignmentSearch

