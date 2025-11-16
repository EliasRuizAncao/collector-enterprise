/**
 * GlobalSearch - Búsqueda global en la app mobile
 * Modal full screen con búsqueda en tareas, formularios e historial
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  Clock,
  FileText,
  History,
  Loader2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { Label } from '@/shared/components/ui/label'
import { Checkbox } from '@/shared/components/ui/checkbox'
import api from '@/shared/lib/api'
import type { Assignment } from './AssignmentCard'
import type { Form } from '@/shared/types/formBuilder'

/**
 * Tipo de resultado de búsqueda
 */
type SearchResultType = 'assignment' | 'form' | 'history'

/**
 * Resultado de búsqueda de tarea
 */
interface AssignmentSearchResult {
  type: 'assignment'
  id: string
  formName: string
  status: 'pending' | 'in_progress' | 'completed'
  date: string
  description?: string
}

/**
 * Resultado de búsqueda de formulario
 */
interface FormSearchResult {
  type: 'form'
  id: string
  name: string
  description?: string
}

/**
 * Resultado de búsqueda de historial
 */
interface HistorySearchResult {
  type: 'history'
  id: string
  activity: string
  date: string
  metadata?: {
    formId?: string
    formName?: string
  }
}

/**
 * Resultado de búsqueda unificado
 */
type SearchResult = AssignmentSearchResult | FormSearchResult | HistorySearchResult

/**
 * Resultados agrupados
 */
interface GroupedSearchResults {
  assignments: AssignmentSearchResult[]
  forms: FormSearchResult[]
  history: HistorySearchResult[]
}

/**
 * Filtros avanzados
 */
interface AdvancedFilters {
  types: SearchResultType[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  status: 'pending' | 'in_progress' | 'completed' | null
}

/**
 * Claves para localStorage
 */
const SEARCH_HISTORY_KEY = 'collector-global-search-history'
const POPULAR_SEARCHES_KEY = 'collector-global-popular-searches'
const MAX_HISTORY_ITEMS = 5
const MAX_POPULAR_ITEMS = 5

/**
 * Props del componente GlobalSearch
 */
interface GlobalSearchProps {
  /**
   * Si true, el modal está abierto
   */
  open: boolean
  /**
   * Callback para cerrar el modal
   */
  onClose: () => void
}

/**
 * Componente GlobalSearch - Búsqueda global full screen
 */
const GlobalSearch = ({ open, onClose }: GlobalSearchProps) => {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Estados
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<GroupedSearchResults>({
    assignments: [],
    forms: [],
    history: [],
  })
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    types: [],
    dateRange: {
      start: null,
      end: null,
    },
    status: null,
  })
  const [resultCache, setResultCache] = useState<Map<string, GroupedSearchResults>>(new Map())

  // Cargar historial y búsquedas populares al montar
  useEffect(() => {
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (history) {
        setSearchHistory(JSON.parse(history))
      }

      const popular = localStorage.getItem(POPULAR_SEARCHES_KEY)
      if (popular) {
        setPopularSearches(JSON.parse(popular))
      }
    } catch (error) {
      console.error('Error loading search data:', error)
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
      setIsSearching(false)
      setResults({
        assignments: [],
        forms: [],
        history: [],
      })
    }
  }, [open])

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

    // Actualizar búsquedas populares
    setPopularSearches((prev) => {
      const newPopular = [query, ...prev.filter((item) => item !== query)].slice(0, MAX_POPULAR_ITEMS)
      try {
        localStorage.setItem(POPULAR_SEARCHES_KEY, JSON.stringify(newPopular))
      } catch (error) {
        console.error('Error saving popular searches:', error)
      }
      return newPopular
    })
  }, [])

  // Realizar búsqueda
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setResults({
          assignments: [],
          forms: [],
          history: [],
        })
        setIsSearching(false)
        return
      }

      // Verificar cache
      const cacheKey = `${query}-${JSON.stringify(advancedFilters)}`
      const cached = resultCache.get(cacheKey)
      if (cached) {
        setResults(cached)
        setIsSearching(false)
        return
      }

      // Cancelar request anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController()
      setIsSearching(true)

      try {
        // Construir query params
        const params = new URLSearchParams()
        params.append('q', query.trim())

        if (advancedFilters.types.length > 0) {
          params.append('types', advancedFilters.types.join(','))
        }

        if (advancedFilters.status) {
          params.append('status', advancedFilters.status)
        }

        if (advancedFilters.dateRange.start) {
          params.append('startDate', advancedFilters.dateRange.start.toISOString())
        }

        if (advancedFilters.dateRange.end) {
          params.append('endDate', advancedFilters.dateRange.end.toISOString())
        }

        const response = await api.get(`/search?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        })

        const data = response.data as {
          assignments: AssignmentSearchResult[]
          forms: FormSearchResult[]
          history: HistorySearchResult[]
        }

        // Limitar resultados según requerimientos
        const limitedResults: GroupedSearchResults = {
          assignments: (data.assignments || []).slice(0, 5),
          forms: (data.forms || []).slice(0, 3),
          history: (data.history || []).slice(0, 5),
        }

        setResults(limitedResults)

        // Guardar en cache
        setResultCache((prev) => {
          const newCache = new Map(prev)
          newCache.set(cacheKey, limitedResults)
          // Limitar cache a 50 entradas
          if (newCache.size > 50) {
            const firstKey = newCache.keys().next().value
            newCache.delete(firstKey)
          }
          return newCache
        })
      } catch (error: any) {
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          // Request cancelado, ignorar
          return
        }
        console.error('Error searching:', error)
        setResults({
          assignments: [],
          forms: [],
          history: [],
        })
      } finally {
        setIsSearching(false)
      }
    },
    [advancedFilters, resultCache],
  )

  // Debounce para búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim() && searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        void performSearch(searchQuery)
      }, 300)
    } else {
      setResults({
        assignments: [],
        forms: [],
        history: [],
      })
      setIsSearching(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, performSearch])

  // Limpiar búsqueda
  const handleClear = useCallback(() => {
    setSearchQuery('')
    setSelectedIndex(-1)
    setResults({
      assignments: [],
      forms: [],
      history: [],
    })
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Seleccionar del historial
  const handleHistorySelect = useCallback(
    (query: string) => {
      setSearchQuery(query)
      saveToHistory(query)
      void performSearch(query)
    },
    [saveToHistory, performSearch],
  )

  // Navegar a resultado
  const handleResultTap = useCallback(
    (result: SearchResult) => {
      saveToHistory(searchQuery)

      if (result.type === 'assignment') {
        navigate(`/mobile/form/${result.id}`)
      } else if (result.type === 'form') {
        navigate(`/mobile/assignments?formId=${result.id}`)
      } else if (result.type === 'history' && result.metadata?.formId) {
        navigate(`/mobile/form/${result.metadata.formId}`)
      } else {
        navigate('/mobile/history')
      }

      onClose()
    },
    [searchQuery, saveToHistory, navigate, onClose],
  )

  // Obtener todos los resultados planos para navegación por teclado
  const flatResults = useMemo(() => {
    const all: SearchResult[] = []
    all.push(...results.assignments)
    all.push(...results.forms)
    all.push(...results.history)
    return all
  }, [results])

  // Navegación con teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Enter' && selectedIndex >= 0 && flatResults[selectedIndex]) {
        e.preventDefault()
        handleResultTap(flatResults[selectedIndex])
      } else if (e.key === 'ArrowDown' && flatResults.length > 0) {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1))
      } else if (e.key === 'ArrowUp' && flatResults.length > 0) {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, -1))
      }
    },
    [selectedIndex, flatResults, handleResultTap, onClose],
  )

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-result-index="${selectedIndex}"]`,
      ) as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Resaltar término de búsqueda
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }, [])

  // Obtener icono según tipo
  const getResultIcon = useCallback((type: SearchResultType) => {
    switch (type) {
      case 'assignment':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'form':
        return <Sparkles className="h-5 w-5 text-purple-500" />
      case 'history':
        return <History className="h-5 w-5 text-green-500" />
    }
  }, [])

  // Obtener badge de estado
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completado
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge variant="default" className="bg-blue-500 text-white">
            <Clock className="mr-1 h-3 w-3" />
            En progreso
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="default" className="bg-yellow-500 text-white">
            <AlertCircle className="mr-1 h-3 w-3" />
            Pendiente
          </Badge>
        )
      default:
        return null
    }
  }, [])

  // Estados de visualización
  const showHistory = !searchQuery.trim() && searchHistory.length > 0
  const showPopular = !searchQuery.trim() && searchHistory.length === 0 && popularSearches.length > 0
  const showResults = searchQuery.trim() && searchQuery.length >= 2 && flatResults.length > 0
  const showEmpty = searchQuery.trim() && searchQuery.length >= 2 && !isSearching && flatResults.length === 0

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent
          className="h-dvh max-h-dvh w-full max-w-full p-0 gap-0 rounded-none border-0"
          onKeyDown={handleKeyDown}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <DialogHeader className="border-b border-border/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-mobile-h3 font-semibold">Búsqueda Global</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg touch-manipulation"
                  onClick={onClose}
                  aria-label="Cerrar búsqueda"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>

            {/* Search Input */}
            <div className="border-b border-border/60 px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar tareas, formularios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="mobile-input pl-10 pr-20 h-12 text-base"
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {isSearching && (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full touch-manipulation"
                      onClick={handleClear}
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Advanced Filters Button */}
              {(searchQuery.trim() || advancedFilters.types.length > 0 || advancedFilters.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full touch-manipulation"
                  onClick={() => setShowAdvancedFilters(true)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros avanzados
                  {(advancedFilters.types.length > 0 || advancedFilters.status) && (
                    <Badge variant="secondary" className="ml-2">
                      {advancedFilters.types.length + (advancedFilters.status ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              )}
            </div>

            {/* Content - Scrollable */}
            <div ref={resultsRef} className="flex-1 overflow-y-auto overscroll-contain">
              {/* Historial de Búsquedas */}
              {showHistory && (
                <div className="px-4 py-4">
                  <Label className="text-mobile-caption font-semibold text-muted-foreground mb-3 block">
                    Búsquedas recientes
                  </Label>
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

              {/* Búsquedas Populares */}
              {showPopular && (
                <div className="px-4 py-4">
                  <Label className="text-mobile-caption font-semibold text-muted-foreground mb-3 block">
                    Búsquedas populares
                  </Label>
                  <div className="space-y-2">
                    {popularSearches.map((query, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleHistorySelect(query)}
                        className="tap-target w-full rounded-lg border border-border bg-card p-3 text-left transition-colors duration-200 touch-manipulation hover:bg-accent active:bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm font-medium">{query}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resultados Agrupados */}
              {showResults && (
                <div className="px-4 py-4 space-y-6">
                  {/* Tareas */}
                  {results.assignments.length > 0 && (
                    <div>
                      <Label className="text-mobile-caption font-semibold text-muted-foreground mb-3 block">
                        Tareas ({results.assignments.length})
                      </Label>
                      <div className="space-y-2">
                        {results.assignments.map((assignment, index) => {
                          const flatIndex = index
                          return (
                            <button
                              key={assignment.id}
                              type="button"
                              data-result-index={flatIndex}
                              onClick={() => handleResultTap(assignment)}
                              className={cn(
                                'tap-target w-full rounded-lg border border-border bg-card p-3 text-left transition-colors duration-200 touch-manipulation hover:bg-accent active:bg-accent/50',
                                selectedIndex === flatIndex && 'ring-2 ring-primary',
                              )}
                            >
                              <div className="flex items-start gap-3">
                                {getResultIcon('assignment')}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm mb-1">
                                    {highlightText(assignment.formName, searchQuery)}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {getStatusBadge(assignment.status)}
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(assignment.date), 'dd MMM yyyy', { locale: es })}
                                    </span>
                                  </div>
                                  {assignment.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                      {highlightText(assignment.description, searchQuery)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Formularios */}
                  {results.forms.length > 0 && (
                    <div>
                      <Label className="text-mobile-caption font-semibold text-muted-foreground mb-3 block">
                        Formularios ({results.forms.length})
                      </Label>
                      <div className="space-y-2">
                        {results.forms.map((form, index) => {
                          const flatIndex = results.assignments.length + index
                          return (
                            <button
                              key={form.id}
                              type="button"
                              data-result-index={flatIndex}
                              onClick={() => handleResultTap(form)}
                              className={cn(
                                'tap-target w-full rounded-lg border border-border bg-card p-3 text-left transition-colors duration-200 touch-manipulation hover:bg-accent active:bg-accent/50',
                                selectedIndex === flatIndex && 'ring-2 ring-primary',
                              )}
                            >
                              <div className="flex items-start gap-3">
                                {getResultIcon('form')}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm mb-1">
                                    {highlightText(form.name, searchQuery)}
                                  </div>
                                  {form.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {highlightText(form.description, searchQuery)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Historial */}
                  {results.history.length > 0 && (
                    <div>
                      <Label className="text-mobile-caption font-semibold text-muted-foreground mb-3 block">
                        Historial ({results.history.length})
                      </Label>
                      <div className="space-y-2">
                        {results.history.map((history, index) => {
                          const flatIndex = results.assignments.length + results.forms.length + index
                          return (
                            <button
                              key={history.id}
                              type="button"
                              data-result-index={flatIndex}
                              onClick={() => handleResultTap(history)}
                              className={cn(
                                'tap-target w-full rounded-lg border border-border bg-card p-3 text-left transition-colors duration-200 touch-manipulation hover:bg-accent active:bg-accent/50',
                                selectedIndex === flatIndex && 'ring-2 ring-primary',
                              )}
                            >
                              <div className="flex items-start gap-3">
                                {getResultIcon('history')}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm mb-1">
                                    {highlightText(history.activity, searchQuery)}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(history.date), 'dd MMM yyyy, HH:mm', { locale: es })}
                                  </span>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Loading State */}
              {isSearching && (
                <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-8">
                  <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                  <p className="text-mobile-caption text-muted-foreground">Buscando...</p>
                </div>
              )}

              {/* Empty State */}
              {showEmpty && (
                <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-8 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-mobile-h3 mb-2 font-semibold">No se encontraron resultados</h3>
                  <p className="text-mobile-caption text-muted-foreground max-w-[250px]">
                    Intenta con otros términos de búsqueda o ajusta los filtros
                  </p>
                </div>
              )}

              {/* Placeholder cuando está vacío */}
              {!showHistory && !showPopular && !showResults && !isSearching && !showEmpty && (
                <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-8 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-mobile-h3 mb-2 font-semibold">Búsqueda Global</h3>
                  <p className="text-mobile-caption text-muted-foreground max-w-[250px]">
                    Escribe al menos 2 caracteres para buscar en tareas, formularios e historial
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Filters Sheet */}
      <Sheet open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <SheetContent side="bottom" className="h-[70vh] max-h-[600px]">
          <SheetHeader>
            <SheetTitle>Filtros Avanzados</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Tipo */}
            <div>
              <Label className="mb-3 block font-semibold">Tipo</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-assignment"
                    checked={advancedFilters.types.includes('assignment')}
                    onCheckedChange={(checked) => {
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        types: checked
                          ? [...prev.types, 'assignment']
                          : prev.types.filter((t) => t !== 'assignment'),
                      }))
                    }}
                  />
                  <Label htmlFor="filter-assignment" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    Tareas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-form"
                    checked={advancedFilters.types.includes('form')}
                    onCheckedChange={(checked) => {
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        types: checked
                          ? [...prev.types, 'form']
                          : prev.types.filter((t) => t !== 'form'),
                      }))
                    }}
                  />
                  <Label htmlFor="filter-form" className="flex items-center gap-2 cursor-pointer">
                    <Sparkles className="h-4 w-4" />
                    Formularios
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-history"
                    checked={advancedFilters.types.includes('history')}
                    onCheckedChange={(checked) => {
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        types: checked
                          ? [...prev.types, 'history']
                          : prev.types.filter((t) => t !== 'history'),
                      }))
                    }}
                  />
                  <Label htmlFor="filter-history" className="flex items-center gap-2 cursor-pointer">
                    <History className="h-4 w-4" />
                    Historial
                  </Label>
                </div>
              </div>
            </div>

            {/* Estado (solo para tareas) */}
            {advancedFilters.types.includes('assignment') && (
              <div>
                <Label className="mb-3 block font-semibold">Estado</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-status-pending"
                      checked={advancedFilters.status === 'pending'}
                      onCheckedChange={(checked) => {
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          status: checked ? 'pending' : null,
                        }))
                      }}
                    />
                    <Label htmlFor="filter-status-pending" className="cursor-pointer">
                      Pendiente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-status-in-progress"
                      checked={advancedFilters.status === 'in_progress'}
                      onCheckedChange={(checked) => {
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          status: checked ? 'in_progress' : null,
                        }))
                      }}
                    />
                    <Label htmlFor="filter-status-in-progress" className="cursor-pointer">
                      En progreso
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-status-completed"
                      checked={advancedFilters.status === 'completed'}
                      onCheckedChange={(checked) => {
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          status: checked ? 'completed' : null,
                        }))
                      }}
                    />
                    <Label htmlFor="filter-status-completed" className="cursor-pointer">
                      Completado
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Fecha */}
            <div>
              <Label className="mb-3 block font-semibold">Rango de Fecha</Label>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="start-date" className="text-sm text-muted-foreground mb-1 block">
                    Desde
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={
                      advancedFilters.dateRange.start
                        ? format(advancedFilters.dateRange.start, 'yyyy-MM-dd')
                        : ''
                    }
                    onChange={(e) => {
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          start: e.target.value ? new Date(e.target.value) : null,
                        },
                      }))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-sm text-muted-foreground mb-1 block">
                    Hasta
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={
                      advancedFilters.dateRange.end
                        ? format(advancedFilters.dateRange.end, 'yyyy-MM-dd')
                        : ''
                    }
                    onChange={(e) => {
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          end: e.target.value ? new Date(e.target.value) : null,
                        },
                      }))
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 touch-manipulation"
                onClick={() => {
                  setAdvancedFilters({
                    types: [],
                    dateRange: {
                      start: null,
                      end: null,
                    },
                    status: null,
                  })
                }}
              >
                Limpiar
              </Button>
              <Button
                className="flex-1 touch-manipulation"
                onClick={() => {
                  setShowAdvancedFilters(false)
                  if (searchQuery.trim() && searchQuery.length >= 2) {
                    void performSearch(searchQuery)
                  }
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default GlobalSearch

