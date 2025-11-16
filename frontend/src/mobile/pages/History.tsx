/**
 * Página de Historial de Actividad - Mobile
 * Timeline completo de todas las actividades del usuario
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Download,
  X,
  FileText,
  Camera,
  Play,
  LogIn,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle,
  Share2,
  Trash2,
  Flag,
  Eye,
  Calendar,
  ChevronRight,
  Loader2,
  ArrowUpDown,
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday, startOfWeek, startOfMonth, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import FilterSystem, { type FilterConfig } from '../components/FilterSystem'
import FilterChips from '../components/FilterChips'
import SortOptions, { type SortOption, type SortDirection } from '../components/SortOptions'
import { sortActivities } from '../hooks/useSort'
import { useToast } from '@/shared/components/ui/use-toast'
import { cn } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import { useAuthStore } from '@/shared/store/authStore'
import { NoHistory, ErrorState, NoSearchResults } from '../components/empty'

/**
 * Tipos de actividad
 */
type ActivityType =
  | 'form_completed'
  | 'photo_captured'
  | 'task_started'
  | 'session_started'
  | 'config_changed'

/**
 * Status de actividad
 */
type ActivityStatus = 'success' | 'pending' | 'error'

/**
 * Actividad del usuario
 */
interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: Date
  status?: ActivityStatus
  metadata?: {
    formId?: string
    formName?: string
    photoCount?: number
    photoThumbnails?: string[]
    deviceInfo?: string
    location?: string
    configKey?: string
    oldValue?: string
    newValue?: string
    responseId?: string
  }
}

/**
 * Filtros de actividad
 */
interface ActivityFilters {
  types: ActivityType[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  formId: string | null
  status: ActivityStatus | null
}

/**
 * Página de Historial
 */
const History = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuthStore()

  // Estados
  const [activities, setActivities] = useState<Activity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>('date_recent')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Filtros
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    types: [],
    dateRange: { start: null, end: null },
    formId: null,
    status: null,
  })

  // Cargar actividades
  const loadActivities = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (pageNum === 1) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }
        setError(null)

        // Construir query params
        const params = new URLSearchParams()
        params.append('page', pageNum.toString())
        params.append('limit', '20')
        if (filterValues.types && Array.isArray(filterValues.types) && filterValues.types.length > 0) {
          params.append('types', filterValues.types.join(','))
        }
        if (filterValues.dateRange?.start) {
          params.append('startDate', new Date(filterValues.dateRange.start).toISOString())
        }
        if (filterValues.dateRange?.end) {
          params.append('endDate', new Date(filterValues.dateRange.end).toISOString())
        }
        if (filterValues.formId) {
          params.append('formId', filterValues.formId)
        }
        if (filterValues.status) {
          params.append('status', filterValues.status)
        }
        if (searchQuery) {
          params.append('search', searchQuery)
        }

        // Llamar a API (endpoint a implementar en backend)
        const response = await api.get(`/activities?${params.toString()}`)

        const newActivities = response.data.items.map(transformApiActivity)
        setHasMore(response.data.hasMore)

        if (append) {
          setActivities((prev) => [...prev, ...newActivities])
        } else {
          setActivities(newActivities)
        }
      } catch (err: any) {
        console.error('Error al cargar actividades:', err)
        setError(err.response?.data?.error || 'No se pudieron cargar las actividades')
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las actividades',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [filters, searchQuery, toast],
  )

  // Transformar actividad de API a formato local
  const transformApiActivity = (item: any): Activity => {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      timestamp: new Date(item.timestamp),
      status: item.status,
      metadata: item.metadata,
    }
  }

  // Cargar actividades iniciales
  useEffect(() => {
    void loadActivities(1, false)
  }, [loadActivities])

  // Filtrar actividades localmente (para búsqueda y filtros)
  useEffect(() => {
    let filtered = activities

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (activity) =>
          activity.title.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query) ||
          activity.metadata?.formName?.toLowerCase().includes(query),
      )
    }

    // Filtrar por tipos
    if (
      filterValues.types &&
      Array.isArray(filterValues.types) &&
      filterValues.types.length > 0
    ) {
      filtered = filtered.filter((activity) => filterValues.types.includes(activity.type))
    }

    // Filtrar por fecha
    if (filterValues.dateRange?.start || filterValues.dateRange?.end) {
      filtered = filtered.filter((activity) => {
        const activityDate = activity.timestamp
        if (filterValues.dateRange.start && activityDate < new Date(filterValues.dateRange.start)) {
          return false
        }
        if (filterValues.dateRange.end && activityDate > new Date(filterValues.dateRange.end)) {
          return false
        }
        return true
      })
    }

    // Filtrar por formulario
    if (filterValues.formId) {
      filtered = filtered.filter((activity) => activity.metadata?.formId === filterValues.formId)
    }

    // Filtrar por status
    if (filterValues.status) {
      filtered = filtered.filter((activity) => activity.status === filterValues.status)
    }

    // Aplicar ordenamiento
    const sorted = sortActivities(filtered, sort, sortDirection)
    setFilteredActivities(sorted)
  }, [activities, searchQuery, filterValues, sort, sortDirection])

  // Handler para cambio de ordenamiento
  const handleSortChange = useCallback((newSort: string, newDirection: SortDirection) => {
    setSort(newSort)
    setSortDirection(newDirection)
  }, [])

  // Agrupar actividades por fecha
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {
      hoy: [],
      ayer: [],
      'esta-semana': [],
      'este-mes': [],
      'mas-antiguo': [],
    }

    const now = new Date()
    const weekStart = startOfWeek(now, { locale: es })
    const monthStart = startOfMonth(now)

    filteredActivities.forEach((activity) => {
      const date = activity.timestamp

      if (isToday(date)) {
        groups.hoy.push(activity)
      } else if (isYesterday(date)) {
        groups.ayer.push(activity)
      } else if (isWithinInterval(date, { start: weekStart, end: now })) {
        groups['esta-semana'].push(activity)
      } else if (isWithinInterval(date, { start: monthStart, end: now })) {
        groups['este-mes'].push(activity)
      } else {
        groups['mas-antiguo'].push(activity)
      }
    })

    // Eliminar grupos vacíos
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key]
      }
    })

    return groups
  }, [filteredActivities])

  // Cargar más actividades (infinite scroll)
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      void loadActivities(nextPage, true)
    }
  }, [page, hasMore, isLoadingMore, loadActivities])

  // Detectar scroll para infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  // Obtener opciones de formularios únicos
  const formOptions = useMemo(() => {
    const uniqueForms = new Map<string, { value: string; label: string; count: number }>()
    activities.forEach((activity) => {
      if (activity.metadata?.formId && activity.metadata?.formName) {
        const existing = uniqueForms.get(activity.metadata.formId)
        if (existing) {
          existing.count++
        } else {
          uniqueForms.set(activity.metadata.formId, {
            value: activity.metadata.formId,
            label: activity.metadata.formName,
            count: 1,
          })
        }
      }
    })
    return Array.from(uniqueForms.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [activities])

  // Configuración de filtros
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        id: 'types',
        type: 'multiselect',
        label: 'Tipo de actividad',
        category: 'General',
        options: [
          { value: 'form_completed', label: 'Formularios completados' },
          { value: 'photo_captured', label: 'Fotos capturadas' },
          { value: 'task_started', label: 'Tareas iniciadas' },
          { value: 'session_started', label: 'Sesiones iniciadas' },
          { value: 'config_changed', label: 'Configuración cambiada' },
        ],
        hideEmptyOptions: true,
      },
      {
        id: 'formId',
        type: formOptions.length > 20 ? 'search-select' : 'select',
        label: 'Formulario',
        category: 'General',
        options: formOptions,
        hideEmptyOptions: true,
      },
      {
        id: 'status',
        type: 'select',
        label: 'Resultado',
        category: 'General',
        options: [
          { value: 'success', label: 'Exitoso' },
          { value: 'pending', label: 'Pendiente' },
          { value: 'error', label: 'Error' },
        ],
      },
      {
        id: 'dateRange',
        type: 'daterange',
        label: 'Rango de fechas',
        category: 'Fechas',
        description: 'Filtrar por fecha de actividad',
      },
    ],
    [formOptions],
  )

  // Configuración de ordenamiento para historial
  const sortOptions: SortOption[] = useMemo(
    () => [
      {
        value: 'date_recent',
        label: 'Fecha (más reciente primero)',
        description: 'Ordenar por fecha, más recientes primero',
      },
      {
        value: 'date_oldest',
        label: 'Fecha (más antigua primero)',
        description: 'Ordenar por fecha, más antiguas primero',
      },
      {
        value: 'type',
        label: 'Tipo de actividad',
        description: 'Ordenar por tipo de actividad',
      },
      {
        value: 'name_asc',
        label: 'Nombre (A-Z)',
        description: 'Ordenar alfabéticamente por título',
      },
      {
        value: 'name_desc',
        label: 'Nombre (Z-A)',
        description: 'Ordenar alfabéticamente inverso',
      },
    ],
    [],
  )

  // Aplicar filtros
  const handleApplyFilters = () => {
    setPage(1)
    void loadActivities(1, false)
    setShowFilters(false)
  }

  // Resetear filtros
  const handleResetFilters = () => {
    setFilterValues({
      types: [],
      dateRange: { start: null, end: null },
      formId: null,
      status: null,
    })
    setPage(1)
    void loadActivities(1, false)
  }

  // Ver detalles de actividad
  const handleViewDetails = (activity: Activity) => {
    setSelectedActivity(activity)
    setShowDetails(true)
  }

  // Exportar actividades
  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      if (filterValues.dateRange?.start) {
        params.append('startDate', new Date(filterValues.dateRange.start).toISOString())
      }
      if (filterValues.dateRange?.end) {
        params.append('endDate', new Date(filterValues.dateRange.end).toISOString())
      }
      if (filterValues.types && Array.isArray(filterValues.types) && filterValues.types.length > 0) {
        params.append('types', filterValues.types.join(','))
      }

      const response = await api.get(`/activities/export?${params.toString()}`, {
        responseType: 'blob',
      })

      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `historial-${format(new Date(), 'yyyy-MM-dd')}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Exportación exitosa',
        description: `El archivo ${format.toUpperCase()} se ha descargado`,
      })
      setShowExport(false)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'No se pudo exportar el historial',
        variant: 'destructive',
      })
    }
  }

  // Obtener ícono según tipo de actividad
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'form_completed':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'photo_captured':
        return <Camera className="h-5 w-5 text-purple-600" />
      case 'task_started':
        return <Play className="h-5 w-5 text-green-600" />
      case 'session_started':
        return <LogIn className="h-5 w-5 text-orange-600" />
      case 'config_changed':
        return <Settings className="h-5 w-5 text-gray-600" />
    }
  }

  // Obtener badge de status
  const getStatusBadge = (status?: ActivityStatus) => {
    if (!status) return null

    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Enviado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
    }
  }

  // Obtener nombre del grupo de fecha
  const getGroupName = (key: string): string => {
    switch (key) {
      case 'hoy':
        return 'Hoy'
      case 'ayer':
        return 'Ayer'
      case 'esta-semana':
        return 'Esta semana'
      case 'este-mes':
        return 'Este mes'
      case 'mas-antiguo':
        return 'Más antiguo'
      default:
        return key
    }
  }

  // Highlight de términos de búsqueda
  const highlightText = (text: string, query: string) => {
    if (!query) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {/* Filter Chips */}
      {Object.keys(filterValues).filter(
        (key) =>
          filterValues[key] !== undefined &&
          filterValues[key] !== null &&
          filterValues[key] !== '' &&
          (Array.isArray(filterValues[key]) ? filterValues[key].length > 0 : true) &&
          (typeof filterValues[key] === 'object' && !Array.isArray(filterValues[key])
            ? filterValues[key].start || filterValues[key].end
            : true),
      ).length > 0 && (
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background px-4 py-2">
          <FilterChips
            filters={filterConfigs}
            values={filterValues}
            onRemove={(filterId) => {
              setFilterValues((prev) => {
                const newValues = { ...prev }
                if (filterId === 'dateRange') {
                  newValues[filterId] = { start: null, end: null }
                } else {
                  delete newValues[filterId]
                }
                return newValues
              })
            }}
            onClearAll={handleResetFilters}
          />
        </div>
      )}

      {/* Header */}
      <div
        className={cn(
          'sticky z-10 flex items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3',
          Object.keys(filterValues).filter(
            (key) =>
              filterValues[key] !== undefined &&
              filterValues[key] !== null &&
              filterValues[key] !== '' &&
              (Array.isArray(filterValues[key]) ? filterValues[key].length > 0 : true) &&
              (typeof filterValues[key] === 'object' && !Array.isArray(filterValues[key])
                ? filterValues[key].start || filterValues[key].end
                : true),
          ).length > 0
            ? 'top-[4rem]'
            : 'top-0',
        )}
      >
        <h1 className="flex-1 text-xl font-bold">Historial</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowFilters(true)}
          className="h-9 w-9"
        >
          <Filter className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowExport(true)}
          className="h-9 w-9"
        >
          <Download className="h-5 w-5" />
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en historial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 space-y-6 p-4">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorState
            error={error}
            onRetry={() => loadActivities(1, false)}
            variant="full"
          />
        )}

        {/* Empty State - Búsqueda sin resultados */}
        {!isLoading && !error && filteredActivities.length === 0 && searchQuery && (
          <NoSearchResults
            searchTerm={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            variant="full"
          />
        )}

        {/* Empty State - Sin historial */}
        {!isLoading && !error && filteredActivities.length === 0 && !searchQuery && (
          <NoHistory
            type="activity"
            variant="full"
          />
        )}

        {/* Timeline */}
        {!isLoading && !error && filteredActivities.length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([groupKey, groupActivities]) => (
              <div key={groupKey}>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                  {getGroupName(groupKey)}
                </h2>
                <div className="space-y-3">
                  {groupActivities.map((activity) => (
                    <Card
                      key={activity.id}
                      className="cursor-pointer touch-manipulation active:scale-[0.98] transition-transform"
                      onClick={() => handleViewDetails(activity)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Icono */}
                          <div className="mt-1">{getActivityIcon(activity.type)}</div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-medium text-sm">
                                {highlightText(activity.title, searchQuery)}
                              </h3>
                              {getStatusBadge(activity.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {highlightText(activity.description, searchQuery)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(activity.timestamp, {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </span>
                            </div>
                          </div>

                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Loading more */}
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Filtros */}
      <FilterSystem
        filters={filterConfigs}
        values={filterValues}
        onChange={setFilterValues}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        open={showFilters}
        onClose={() => setShowFilters(false)}
        storageKey="history-filters"
        persistInUrl={true}
        resultCount={filteredActivities.length}
      />

      {/* Sort Options Modal */}
      <SortOptions
        options={sortOptions}
        currentSort={sort}
        currentDirection={sortDirection}
        onChange={handleSortChange}
        open={showSort}
        onOpen={() => setShowSort(true)}
        onClose={() => setShowSort(false)}
        storageKey="history-sort"
        showButton={false}
      />

      {/* Modal de Detalles */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getActivityIcon(selectedActivity.type)}
                  {selectedActivity.title}
                </DialogTitle>
                <DialogDescription>
                  {format(selectedActivity.timestamp, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", {
                    locale: es,
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Descripción */}
                <div>
                  <Label className="text-xs text-muted-foreground">Descripción</Label>
                  <p className="text-sm mt-1">{selectedActivity.description}</p>
                </div>

                {/* Metadata según tipo */}
                {selectedActivity.type === 'form_completed' && selectedActivity.metadata && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Formulario</Label>
                    <p className="text-sm font-medium">
                      {selectedActivity.metadata.formName || 'Sin nombre'}
                    </p>
                    {selectedActivity.metadata.responseId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          navigate(`/mobile/form-response/${selectedActivity.metadata?.responseId}`)
                          setShowDetails(false)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver respuestas
                      </Button>
                    )}
                  </div>
                )}

                {selectedActivity.type === 'photo_captured' && selectedActivity.metadata && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Fotos</Label>
                    <p className="text-sm">
                      {selectedActivity.metadata.photoCount || 0} foto(s) capturada(s)
                    </p>
                    {selectedActivity.metadata.photoThumbnails &&
                      selectedActivity.metadata.photoThumbnails.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {selectedActivity.metadata.photoThumbnails.slice(0, 6).map((thumb, i) => (
                            <img
                              key={i}
                              src={thumb}
                              alt={`Foto ${i + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {selectedActivity.type === 'config_changed' && selectedActivity.metadata && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Cambio</Label>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">{selectedActivity.metadata.configKey}</span>
                      </p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="line-through">{selectedActivity.metadata.oldValue}</span>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-foreground">
                          {selectedActivity.metadata.newValue}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Flag className="h-4 w-4 mr-2" />
                    Reportar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Export */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar historial</DialogTitle>
            <DialogDescription>
              Elige el formato y rango de fechas para exportar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Formato</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleExport('csv')}
                >
                  CSV
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleExport('pdf')}
                >
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default History

