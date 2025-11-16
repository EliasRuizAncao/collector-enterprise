import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Filter, AlertCircle, Sparkles } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import RefreshContainer from '../components/RefreshContainer'
import AssignmentCard, { type Assignment } from '../components/AssignmentCard'
import AssignmentFilters, { type AssignmentFilters as FiltersType } from '../components/AssignmentFilters'
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
  const [filters, setFilters] = useState<FiltersType>({})
  const [searchResults, setSearchResults] = useState<Assignment[]>([])
  const [isSearching, setIsSearching] = useState(false)
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

  // Filtrar por tab
  useEffect(() => {
    if (!searchQuery.trim()) {
      const now = new Date()
      let filtered = assignments

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

      setFilteredAssignments(filtered)
    }
  }, [assignments, activeTab, searchQuery])

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

  const handleApplyFilters = useCallback((newFilters: FiltersType) => {
    setFilters(newFilters)
    setIsFiltersOpen(false)
    // Los filtros se aplican en el useEffect de filteredAssignments
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
              className="h-9 w-9 rounded-lg touch-manipulation"
              onClick={() => setIsFiltersOpen(true)}
              aria-label="Filtros"
            >
              <Filter className="h-5 w-5" />
              {Object.keys(filters).length > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px]"
                >
                  1
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs Horizontales Scrollables */}
        <div className="sticky top-14 z-30 flex items-center gap-2 overflow-x-auto border-b border-border/60 bg-background px-4 py-2 scrollbar-hide">
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
        <AssignmentFilters
          open={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
          filters={filters}
          onApply={handleApplyFilters}
          resultCount={filteredAssignments.length}
        />
      </div>
    </RefreshContainer>
  )
}

export default MobileAssignments
