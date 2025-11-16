import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Filter, AlertCircle, Sparkles } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import RefreshContainer from '../components/RefreshContainer'
import AssignmentCard, { type Assignment } from '../components/AssignmentCard'
import FilterSystem, { type FilterConfig } from '../components/FilterSystem'
import FilterChips from '../components/FilterChips'
import SortOptions, { type SortOption, type SortDirection } from '../components/SortOptions'
import { sortAssignments } from '../hooks/useSort'
import AssignmentSearch from '../components/AssignmentSearch'
import OfflineIndicator from '../components/OfflineIndicator'
import { useOfflineAssignments, type SyncStatus } from '../hooks/useOfflineAssignments'
import { useToast } from '@/shared/components/ui/use-toast'
import { AnimatedList, SkeletonList } from '../components/animated'
import { NoAssignments, ErrorState as ErrorStateComponent, NoSearchResults } from '../components/empty'


/**
 * Tipo para tab activo
 */
type ActiveTab = 'pending' | 'completed' | 'overdue' | 'all'


/**
 * Componente Empty State mejorado usando NoAssignments
 */
const EmptyState = ({ type }: { type: ActiveTab }) => {
  const titles: Record<ActiveTab, string> = {
    pending: 'No tienes tareas pendientes 🎉',
    completed: 'Aún no has completado tareas',
    overdue: 'No tienes tareas vencidas',
    all: 'No tienes tareas asignadas',
  }

  const descriptions: Record<ActiveTab, string> = {
    pending: '¡Buen trabajo! Mantén este ritmo.',
    completed: 'Comienza a completar tareas para ver tu progreso aquí.',
    overdue: 'Excelente, todas tus tareas están al día.',
    all: 'Cuando te asignen tareas aparecerán aquí.',
  }

  return (
    <NoAssignments
      variant="full"
      title={titles[type]}
      description={descriptions[type]}
      showAction={false}
    />
  )
}


/**
 * Página de Tareas Asignadas - Mobile
 * Lista de formularios asignados para operadores de campo
 */
const MobileAssignments = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()

  // Hook offline assignments
  const {
    assignments: offlineAssignments,
    isOnline,
    syncStatus,
    pendingChanges,
    startAssignment: offlineStartAssignment,
    completeAssignment: offlineCompleteAssignment,
  } = useOfflineAssignments()

  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    (searchParams.get('filter') as ActiveTab) || 'pending',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [searchResults, setSearchResults] = useState<Assignment[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [sort, setSort] = useState<string>('date_recent')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  // TODO: Restaurar infinite scroll cuando se implemente paginación
  // const [hasMore, setHasMore] = useState(true)
  // const [page, setPage] = useState(1)
  // const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Usar asignaciones offline como fuente principal
  const assignments = offlineAssignments

  // Sincronizar filteredAssignments cuando cambian las asignaciones offline
  useEffect(() => {
    setFilteredAssignments(assignments)
  }, [assignments])

  // Mostrar toast cuando se sincroniza exitosamente
  useEffect(() => {
    if (syncStatus === 'synced' && pendingChanges === 0 && isOnline) {
      toast({
        title: 'Sincronización completada',
        description: 'Todos los cambios se han sincronizado correctamente',
        duration: 3000,
      })
    } else if (syncStatus === 'error') {
      toast({
        title: 'Error de sincronización',
        description: 'Algunos cambios no se pudieron sincronizar',
        variant: 'destructive',
        duration: 5000,
      })
    }
  }, [syncStatus, pendingChanges, isOnline, toast])

  // Contadores por tab
  const counts = useMemo(() => {
    const now = new Date()
    return {
      pending: assignments.filter((a) => a.status === 'pending').length,
      completed: assignments.filter((a) => a.status === 'completed').length,
      overdue: assignments.filter(
        (a) => a.dueDate && new Date(a.dueDate) < now && a.status !== 'completed',
      ).length,
      all: assignments.length,
    }
  }, [assignments])

  // Los assignments ahora vienen del hook offline
  // No necesitamos loadAssignments ya que el hook offline maneja la carga automáticamente
  // Solo marcamos como cargado cuando las asignaciones están disponibles
  useEffect(() => {
    if (assignments.length > 0 || offlineAssignments.length > 0) {
      setIsLoading(false)
    }
  }, [assignments.length, offlineAssignments.length])

  // Filtrar por búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAssignments(assignments)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = assignments.filter((assignment) =>
      assignment.formName.toLowerCase().includes(query),
    )

    setFilteredAssignments(filtered)
  }, [assignments, searchQuery])

  // Obtener opciones de formularios y prioridades únicas
  const formOptions = useMemo(() => {
    const uniqueForms = new Map<string, { value: string; label: string; count: number }>()
    assignments.forEach((assignment) => {
      const existing = uniqueForms.get(assignment.formId)
      if (existing) {
        existing.count++
      } else {
        uniqueForms.set(assignment.formId, {
          value: assignment.formId,
          label: assignment.formName,
          count: 1,
        })
      }
    })
    return Array.from(uniqueForms.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [assignments])

  const priorityOptions = useMemo(() => {
    const priorities = ['low', 'medium', 'high', 'urgent'] as const
    return priorities.map((priority) => {
      const count = assignments.filter((a) => a.priority === priority).length
      return {
        value: priority,
        label: priority === 'low' ? 'Baja' : priority === 'medium' ? 'Media' : priority === 'high' ? 'Alta' : 'Urgente',
        count,
      }
    })
  }, [assignments])

  // Configuración de filtros
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        id: 'status',
        type: 'select',
        label: 'Estado',
        category: 'General',
        options: [
          { value: 'pending', label: 'Pendiente' },
          { value: 'in_progress', label: 'En progreso' },
          { value: 'completed', label: 'Completado' },
        ],
      },
      {
        id: 'priority',
        type: 'multiselect',
        label: 'Prioridad',
        category: 'General',
        options: priorityOptions,
        hideEmptyOptions: true,
      },
      {
        id: 'formIds',
        type: formOptions.length > 20 ? 'search-select' : 'multiselect',
        label: 'Formularios',
        category: 'General',
        options: formOptions,
        hideEmptyOptions: true,
      },
      {
        id: 'dateRange',
        type: 'daterange',
        label: 'Rango de fechas',
        category: 'Fechas',
        description: 'Filtrar por fecha de asignación',
      },
    ],
    [formOptions, priorityOptions],
  )

  // Configuración de ordenamiento para tareas
  const sortOptions: SortOption[] = useMemo(
    () => [
      {
        value: 'date_recent',
        label: 'Fecha (más reciente primero)',
        description: 'Ordenar por fecha de asignación, más recientes primero',
      },
      {
        value: 'date_oldest',
        label: 'Fecha (más antigua primero)',
        description: 'Ordenar por fecha de asignación, más antiguas primero',
      },
      {
        value: 'dueDate',
        label: 'Fecha límite',
        description: 'Ordenar por fecha de vencimiento',
      },
      {
        value: 'priority',
        label: 'Prioridad (alta a baja)',
        description: 'Urgente, Alta, Media, Baja',
      },
      {
        value: 'progress',
        label: 'Progreso (menos completo primero)',
        description: 'Ordenar por porcentaje de completado',
      },
      {
        value: 'status',
        label: 'Estado (pendiente primero)',
        description: 'Pendiente, En progreso, Completado',
      },
      {
        value: 'name_asc',
        label: 'Nombre (A-Z)',
        description: 'Ordenar alfabéticamente',
      },
      {
        value: 'name_desc',
        label: 'Nombre (Z-A)',
        description: 'Ordenar alfabéticamente inverso',
      },
    ],
    [],
  )

  // Filtrar por tab y filtros
  useEffect(() => {
    if (!searchQuery.trim()) {
      const now = new Date()
      let filtered = assignments

      // Filtrar por tab
      switch (activeTab) {
        case 'pending':
          filtered = assignments.filter((a) => a.status === 'pending')
          break
        case 'completed':
          filtered = assignments.filter((a) => a.status === 'completed')
          break
        case 'overdue':
          filtered = assignments.filter(
            (a) => a.dueDate && new Date(a.dueDate) < now && a.status !== 'completed',
          )
          break
        case 'all':
        default:
          filtered = assignments
          break
      }

      // Aplicar filtros adicionales
      if (filterValues.status) {
        filtered = filtered.filter((a) => a.status === filterValues.status)
      }

      if (filterValues.priority && Array.isArray(filterValues.priority) && filterValues.priority.length > 0) {
        filtered = filtered.filter((a) => a.priority && filterValues.priority.includes(a.priority))
      }

      if (filterValues.formIds && Array.isArray(filterValues.formIds) && filterValues.formIds.length > 0) {
        filtered = filtered.filter((a) => filterValues.formIds.includes(a.formId))
      }

      if (filterValues.dateRange) {
        const { start, end } = filterValues.dateRange
        if (start) {
          filtered = filtered.filter((a) => {
            const assignedDate = new Date(a.assignedAt)
            return assignedDate >= new Date(start)
          })
        }
        if (end) {
          filtered = filtered.filter((a) => {
            const assignedDate = new Date(a.assignedAt)
            return assignedDate <= new Date(end)
          })
        }
      }

      // Aplicar ordenamiento
      const sorted = sortAssignments(filtered, sort, sortDirection)
      setFilteredAssignments(sorted)
    }
  }, [assignments, activeTab, searchQuery, filterValues, sort, sortDirection])

  // Handler para cambio de ordenamiento
  const handleSortChange = useCallback((newSort: string, newDirection: SortDirection) => {
    setSort(newSort)
    setSortDirection(newDirection)
  }, [])

  // Infinite scroll - TODO: Implementar cuando se necesite paginación
  // const handleScroll = useCallback(() => {
  //   // Por ahora, las asignaciones vienen del hook offline completo
  //   // TODO: Implementar paginación cuando haya muchas asignaciones
  //   if (!scrollContainerRef.current || isLoadingMore || !hasMore || isLoading) return

  //   const container = scrollContainerRef.current
  //   const scrollTop = container.scrollTop
  //   const scrollHeight = container.scrollHeight
  //   const clientHeight = container.clientHeight
  //   const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

  //   if (scrollPercentage >= 0.8) {
  //     // TODO: Cargar más asignaciones del servidor cuando se implemente paginación
  //     // loadAssignments(page + 1, true)
  //   }
  // }, [isLoadingMore, hasMore, isLoading, page])

  // Infinite scroll deshabilitado temporalmente
  // useEffect(() => {
  //   const container = scrollContainerRef.current
  //   if (!container) return

  //   container.addEventListener('scroll', handleScroll)
  //   return () => container.removeEventListener('scroll', handleScroll)
  // }, [handleScroll])


  // Handlers
  const handleRefresh = useCallback(async () => {
    // El hook offline maneja el refresh automáticamente
    setIsLoading(false)
  }, [])

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setSearchParams({ filter: tab })
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  const handleAssignmentTap = (assignmentId: string) => {
    navigate(`/mobile/form/${assignmentId}`)
  }

  const handleStart = useCallback(async (assignmentId: string) => {
    try {
      await offlineStartAssignment(assignmentId)
      // Toast se maneja en el hook offline
    } catch (error) {
      console.error('Error al iniciar tarea:', error)
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la tarea',
        variant: 'destructive',
        duration: 5000,
      })
    }
  }, [offlineStartAssignment, toast])

  const handleComplete = useCallback(async (assignmentId: string) => {
    try {
      await offlineCompleteAssignment(assignmentId)
      // Toast se maneja en el hook offline
    } catch (error) {
      console.error('Error al completar tarea:', error)
      toast({
        title: 'Error',
        description: 'No se pudo completar la tarea',
        variant: 'destructive',
        duration: 5000,
      })
    }
  }, [offlineCompleteAssignment, toast])

  const handleView = useCallback((assignmentId: string) => {
    // TODO: Abrir modal de detalles o navegar
    console.log('Ver detalles', assignmentId)
  }, [])

  const handleApplyFilters = useCallback(() => {
    setIsFiltersOpen(false)
    // Los filtros se aplican en el useEffect de filteredAssignments
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilterValues({})
  }, [])

  // Handler para búsqueda
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        // TODO: Reemplazar con endpoint real cuando esté disponible
        const response = await api.get('/assignments/search', {
          params: { q: query },
        })
        const data = response.data

        // Mock data para desarrollo
        const mockResults: Assignment[] = assignments.filter((assignment) =>
          assignment.formName.toLowerCase().includes(query.toLowerCase()),
        )

        setSearchResults(data.results || mockResults)
      } catch (error) {
        // En desarrollo, usar filtrado local
        const filtered = assignments.filter((assignment) =>
          assignment.formName.toLowerCase().includes(query.toLowerCase()),
        )
        setSearchResults(filtered)
      } finally {
        setIsSearching(false)
      }
    },
    [assignments],
  )

  return (
    <RefreshContainer onRefresh={handleRefresh} disabled={isLoading}>
      <div className="flex min-h-full flex-col">
        {/* Header Sticky */}
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <h1 className="text-mobile-h3 font-semibold">Mis Tareas</h1>
            <OfflineIndicator isOnline={isOnline} syncStatus={syncStatus} pendingChanges={pendingChanges} />
          </div>
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg touch-manipulation"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Filters Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-lg touch-manipulation"
              onClick={() => setIsFiltersOpen(true)}
              aria-label="Filtros"
            >
              <Filter className="h-5 w-5" />
              {Object.keys(filterValues).filter(
                (key) =>
                  filterValues[key] !== undefined &&
                  filterValues[key] !== null &&
                  filterValues[key] !== '' &&
                  (Array.isArray(filterValues[key]) ? filterValues[key].length > 0 : true),
              ).length > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px]"
                >
                  {Object.keys(filterValues).filter(
                    (key) =>
                      filterValues[key] !== undefined &&
                      filterValues[key] !== null &&
                      filterValues[key] !== '' &&
                      (Array.isArray(filterValues[key]) ? filterValues[key].length > 0 : true),
                  ).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        {Object.keys(filterValues).filter(
          (key) =>
            filterValues[key] !== undefined &&
            filterValues[key] !== null &&
            filterValues[key] !== '' &&
            (Array.isArray(filterValues[key]) ? filterValues[key].length > 0 : true),
        ).length > 0 && (
          <div className="sticky top-14 z-30 border-b border-border/60 bg-background px-4 py-2">
            <FilterChips
              filters={filterConfigs}
              values={filterValues}
              onRemove={(filterId) => {
                setFilterValues((prev) => {
                  const newValues = { ...prev }
                  delete newValues[filterId]
                  return newValues
                })
              }}
              onClearAll={() => {
                setFilterValues({})
              }}
            />
          </div>
        )}

        {/* Sort Options */}
        <div
          className={cn(
            'sticky z-30 border-b border-border/60 bg-background px-4 py-2',
            Object.keys(filterValues).filter(
              (key) =>
                filterValues[key] !== undefined &&
                filterValues[key] !== null &&
                filterValues[key] !== '' &&
                (Array.isArray(filterValues[key]) ? filterValues[key].length > 0 : true),
            ).length > 0
              ? 'top-[calc(3.5rem+4rem)]'
              : 'top-14',
          )}
        >
          <SortOptions
            options={sortOptions}
            currentSort={sort}
            currentDirection={sortDirection}
            onChange={handleSortChange}
            open={isSortOpen}
            onOpen={() => setIsSortOpen(true)}
            onClose={() => setIsSortOpen(false)}
            storageKey="assignments-sort"
          />
        </div>

        {/* Tabs Horizontales Scrollables */}
        <div
          className={cn(
            'sticky z-30 flex items-center gap-2 overflow-x-auto border-b border-border/60 bg-background px-4 py-2 scrollbar-hide',
            Object.keys(filterValues).filter(
              (key) =>
                filterValues[key] !== undefined &&
                filterValues[key] !== null &&
                filterValues[key] !== '' &&
                (Array.isArray(filterValues[key]) ? filterValues[key].length > 0 : true),
            ).length > 0
              ? 'top-[calc(3.5rem+8rem)]'
              : 'top-[calc(3.5rem+4rem)]',
          )}
        >
          {(['pending', 'completed', 'overdue', 'all'] as ActiveTab[]).map((tab) => {
            const count = counts[tab]
            const isActive = activeTab === tab

            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={cn(
                  'tap-target-sm flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 touch-manipulation',
                  'active:bg-accent/50',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground active:text-foreground',
                )}
                aria-label={tab}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="capitalize">
                  {tab === 'pending' && 'Pendientes'}
                  {tab === 'completed' && 'Completadas'}
                  {tab === 'overdue' && 'Vencidas'}
                  {tab === 'all' && 'Todas'}
                </span>
                {count > 0 && (
                  <Badge
                    variant={tab === 'overdue' ? 'destructive' : 'secondary'}
                    className={cn(
                      'h-5 min-w-5 px-1.5 text-xs font-semibold',
                      isActive && 'bg-primary-foreground/20 text-primary-foreground',
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        {/* Lista de Tareas */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        >
          {/* Loading Initial */}
          {isLoading && (
            <SkeletonList count={5} className="space-y-3" />
          )}

          {/* Error State */}
          {error && !isLoading && (
            <ErrorStateComponent
              error={error}
              onRetry={() => {
                setError(null)
                setIsLoading(false)
              }}
              variant="full"
            />
          )}

          {/* Empty State - Búsqueda sin resultados */}
          {!isLoading && !error && filteredAssignments.length === 0 && searchResults.length === 0 && searchQuery && (
            <NoSearchResults
              searchTerm={searchQuery}
              onClearSearch={() => {
                setSearchQuery('')
                setSearchResults([])
                setIsSearchOpen(false)
              }}
              variant="full"
            />
          )}

          {/* Empty State - Sin tareas */}
          {!isLoading && !error && filteredAssignments.length === 0 && !searchQuery && (
            <EmptyState type={activeTab} />
          )}

          {/* Tasks List */}
          {!isLoading && !error && filteredAssignments.length > 0 && (
            <AnimatedList
              enableStagger
              className="space-y-3"
              keyExtractor={(item, index) => {
                const assignment = filteredAssignments[index]
                return assignment?.id || index
              }}
            >
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onTap={() => handleAssignmentTap(assignment.id)}
                  onStart={() => handleStart(assignment.id)}
                  onView={() => handleView(assignment.id)}
                  onComplete={() => handleComplete(assignment.id)}
                  syncStatus={
                    ((assignment as any)._syncStatus as SyncStatus | undefined) ||
                    ((offlineAssignments.find((a: Assignment) => a.id === assignment.id) as any)?._syncStatus as SyncStatus | undefined) ||
                    'synced'
                  }
                />
              ))}
            </AnimatedList>

              {/* Infinite scroll deshabilitado temporalmente */}
              {/* TODO: Restaurar cuando se implemente paginación */}
              {/* {isLoadingMore && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <AssignmentCardSkeleton key={`loading-${i}`} />
                  ))}
                </div>
              )}

              {!hasMore && filteredAssignments.length > 0 && (
                <div className="py-8 text-center">
                  <p className="text-mobile-caption text-muted-foreground">
                    No hay más tareas
                  </p>
                </div>
              )} */}
            </div>
          )}
        </div>

        {/* Search Modal (Sheet Bottom) */}
        <AssignmentSearch
          open={isSearchOpen}
          onClose={() => {
            setIsSearchOpen(false)
            setSearchQuery('')
          }}
          onSearch={handleSearch}
          results={searchResults}
          isSearching={isSearching}
        />

        {/* Filters Modal (Sheet Bottom) */}
        <FilterSystem
          filters={filterConfigs}
          values={filterValues}
          onChange={setFilterValues}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          open={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          storageKey="assignments-filters"
          persistInUrl={true}
          resultCount={filteredAssignments.length}
        />

        {/* Sort Options Modal */}
        <SortOptions
          options={sortOptions}
          currentSort={sort}
          currentDirection={sortDirection}
          onChange={handleSortChange}
          open={isSortOpen}
          onOpen={() => setIsSortOpen(true)}
          onClose={() => setIsSortOpen(false)}
          storageKey="assignments-sort"
          showButton={false}
        />
      </div>
    </RefreshContainer>
  )
}

export default MobileAssignments
