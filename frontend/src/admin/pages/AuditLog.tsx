import { useState, useEffect, useMemo } from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Calendar as CalendarComponent } from '@/shared/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { cn } from '@/shared/lib/utils'
import { usePermission } from '@/shared/hooks/usePermission'
import { Permission } from '@/shared/types/permissions'
import LoadingOverlay from '@/shared/components/common/LoadingOverlay'
import { useAuditLogs, type AuditLog } from '@/shared/hooks/useAuditLogs'
import useUsers from '@/shared/hooks/useUsers'

/**
 * Página de registro de auditoría
 * Requiere permisos de gestión de roles/permisos
 */
const AuditLog = () => {
  const { hasPermission } = usePermission()
  const canViewAuditLogs = hasPermission(Permission.ROLES_VIEW) || hasPermission(Permission.PERMISSIONS_MANAGE)
  const {
    logs,
    modules,
    actions,
    loading,
    error,
    pagination,
    fetchAuditLogs,
    fetchModules,
    fetchActions,
    exportToCSV,
  } = useAuditLogs()
  const { users, fetchUsers } = useUsers()

  // Filtros
  const [userId, setUserId] = useState<string>('all')
  const [module, setModule] = useState<string>('all')
  const [action, setAction] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date()),
  })
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Cargar módulos y usuarios al montar
  useEffect(() => {
    void fetchModules()
    void fetchUsers()
  }, [fetchModules, fetchUsers])

  // Cargar acciones cuando cambia el módulo
  useEffect(() => {
    if (module) {
      void fetchActions(module)
    } else {
      void fetchActions()
    }
  }, [module, fetchActions])

  // Cargar logs cuando cambian los filtros
  useEffect(() => {
    void fetchAuditLogs({
      page: currentPage,
      limit: 20,
      userId: userId && userId !== 'all' ? userId : undefined,
      module: module && module !== 'all' ? module : undefined,
      action: action && action !== 'all' ? action : undefined,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    })
  }, [currentPage, userId, module, action, dateRange, fetchAuditLogs])

  // Verificar permisos
  if (!canViewAuditLogs) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            No tienes permisos para acceder a esta sección. Se requieren permisos de gestión de roles o permisos para ver los logs de auditoría.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  /**
   * Obtiene las iniciales del usuario para el avatar
   */
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  }

  /**
   * Alterna la expansión de una fila para ver detalles
   */
  const toggleRowExpansion = (logId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  /**
   * Limpia todos los filtros
   */
  const clearFilters = () => {
    setUserId('all')
    setModule('all')
    setAction('all')
    setDateRange({
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date()),
    })
    setCurrentPage(1)
  }

  /**
   * Maneja la exportación a CSV
   */
  const handleExportCSV = async () => {
    await exportToCSV({
      userId: userId && userId !== 'all' ? userId : undefined,
      module: module && module !== 'all' ? module : undefined,
      action: action && action !== 'all' ? action : undefined,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    })
  }

  const hasActiveFilters = (userId && userId !== 'all') || (module && module !== 'all') || (action && action !== 'all')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro de Auditoría</h1>
          <p className="text-muted-foreground mt-1">
            Historial completo de acciones realizadas en el sistema
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={loading || logs.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpiar filtros
              </Button>
            )}
          </div>
          <CardDescription>Filtra los logs de auditoría según tus necesidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Filtro por usuario */}
            <div className="grid gap-2">
              <Label>Usuario</Label>
              <Select value={userId} onValueChange={(value) => {
                setUserId(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por módulo */}
            <div className="grid gap-2">
              <Label>Módulo</Label>
              <Select value={module} onValueChange={(value) => {
                setModule(value)
                setAction('all') // Resetear acción cuando cambia el módulo
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los módulos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {modules.map((mod) => (
                    <SelectItem key={mod} value={mod}>
                      {mod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por acción */}
            <div className="grid gap-2">
              <Label>Acción</Label>
              <Select value={action} onValueChange={(value) => {
                setAction(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {actions.map((act) => (
                    <SelectItem key={act} value={act}>
                      {act}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por rango de fechas */}
            <div className="grid gap-2">
              <Label>Rango de fechas</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground',
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yyyy', { locale: es })} -{' '}
                          {format(dateRange.to, 'dd/MM/yyyy', { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy', { locale: es })
                      )
                    ) : (
                      <span>Seleccionar fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({
                          from: startOfDay(range.from),
                          to: endOfDay(range.to),
                        })
                        setCurrentPage(1)
                        setDatePickerOpen(false)
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensaje de error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabla de logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoría</CardTitle>
          <CardDescription>
            {pagination
              ? `Mostrando ${logs.length} de ${pagination.total} logs`
              : 'Cargando logs...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Fecha/Hora</TableHead>
                  <TableHead className="w-[200px]">Usuario</TableHead>
                  <TableHead className="w-[120px]">Módulo</TableHead>
                  <TableHead className="w-[200px]">Acción</TableHead>
                  <TableHead className="w-[150px]">IP Address</TableHead>
                  <TableHead className="w-[100px]">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && logs.length === 0 ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell colSpan={6}>
                        <div className="h-12 w-full bg-muted/40 animate-pulse rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No se encontraron logs de auditoría</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <>
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => toggleRowExpansion(log.id)}
                      >
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(log.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{log.user.name}</p>
                              <p className="text-xs text-muted-foreground">{log.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.module}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{log.action}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.ipAddress || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleRowExpansion(log.id)
                            }}
                          >
                            {expandedRows.has(log.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(log.id) && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30">
                            <div className="space-y-2 py-2">
                              <div>
                                <Label className="text-xs font-semibold">Rol del usuario:</Label>
                                <Badge variant="secondary" className="ml-2">
                                  {log.user.role}
                                </Badge>
                              </div>
                              {log.userAgent && (
                                <div>
                                  <Label className="text-xs font-semibold">User Agent:</Label>
                                  <p className="text-xs text-muted-foreground mt-1">{log.userAgent}</p>
                                </div>
                              )}
                              {log.details && Object.keys(log.details).length > 0 && (
                                <div>
                                  <Label className="text-xs font-semibold">Detalles (JSON):</Label>
                                  <pre className="mt-1 text-xs bg-background p-2 rounded border overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages} ({pagination.total} logs totales)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {pagination.page} / {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(pagination.totalPages)}
              disabled={currentPage === pagination.totalPages || loading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <LoadingOverlay isLoading={loading} message="Cargando logs de auditoría..." />
    </div>
  )
}

export default AuditLog

