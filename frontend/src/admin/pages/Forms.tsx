import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  FileText,
  Plus,
  Search,
  Edit,
  Copy,
  Archive,
  Eye,
  MoreHorizontal,
  Calendar,
  Hash,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import ConfirmDialog from '@/shared/components/common/ConfirmDialog'
import useForms, { type FormSummary } from '@/shared/hooks/useForms'
import { type FormStatus } from '@/shared/types/formBuilder'
import { useAuthStore } from '@/shared/store/authStore'

const FORMS_PER_PAGE = 12

/**
 * Etiquetas para los estados de formulario
 */
const statusLabels: Record<FormStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
}

/**
 * Variantes de badge según el estado
 */
const statusBadgeVariants: Record<
  FormStatus,
  'default' | 'secondary' | 'muted' | 'outline' | 'success' | 'warning' | 'destructive'
> = {
  DRAFT: 'muted',
  PUBLISHED: 'success',
  ARCHIVED: 'outline',
}

/**
 * Página de lista de formularios
 * Muestra todos los formularios con filtros, búsqueda y acciones
 */
const Forms = () => {
  const navigate = useNavigate()
  const { forms, loading, error, pagination, fetchForms, archiveForm, duplicateForm } = useForms()
  const user = useAuthStore((state) => state.user)
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | FormStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [confirmArchive, setConfirmArchive] = useState<FormSummary | null>(null)

  /**
   * Aplica los filtros y búsqueda
   */
  const handleApplyFilters = () => {
    setCurrentPage(1)
    void fetchForms({
      search: searchTerm.trim() || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page: 1,
      pageSize: FORMS_PER_PAGE,
    })
  }

  /**
   * Maneja el cambio de página
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    void fetchForms({
      search: searchTerm.trim() || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
      pageSize: FORMS_PER_PAGE,
    })
  }

  /**
   * Maneja la duplicación de un formulario
   */
  const handleDuplicate = async (form: FormSummary) => {
    try {
      await duplicateForm(form.id)
    } catch (error) {
      console.error('Error al duplicar formulario:', error)
    }
  }

  /**
   * Maneja el archivado de un formulario
   */
  const handleArchive = async () => {
    if (!confirmArchive) return

    try {
      await archiveForm(confirmArchive.id)
      setConfirmArchive(null)
    } catch (error) {
      console.error('Error al archivar formulario:', error)
    }
  }

  /**
   * Obtiene la cantidad de campos de un formulario
   */
  const getFieldsCount = (form: FormSummary): number => {
    return Array.isArray(form.fields) ? form.fields.length : 0
  }

  /**
   * Trunca el texto a un máximo de caracteres
   */
  const truncateText = (text: string | undefined, maxLength: number): string => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return `${text.slice(0, maxLength)}...`
  }

  /**
   * Formatea la fecha de forma relativa
   */
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy")
    } catch {
      return dateString
    }
  }

  // Calcular total de páginas
  const totalPages = pagination?.totalPages ?? 1

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formularios</h1>
          <p className="text-sm text-muted-foreground">
            {isAdminOrManager
              ? 'Gestiona y organiza todos tus formularios dinámicos'
              : 'Visualiza los formularios disponibles'}
          </p>
        </div>
        {isAdminOrManager && (
          <Button onClick={() => navigate('/admin/formularios/nuevo')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Formulario
          </Button>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApplyFilters()
              }
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: 'all' | FormStatus) => {
            setStatusFilter(value)
            setCurrentPage(1)
            void fetchForms({
              search: searchTerm.trim() || undefined,
              status: value !== 'all' ? value : undefined,
              page: 1,
              pageSize: FORMS_PER_PAGE,
            })
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="PUBLISHED">Publicado</SelectItem>
            <SelectItem value="ARCHIVED">Archivado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleApplyFilters} variant="outline" className="gap-2">
          <Search className="h-4 w-4" />
          Buscar
        </Button>
      </div>

      {/* Contenido */}
      {loading && forms.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Error al cargar formularios</h3>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => fetchForms()} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No hay formularios</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron formularios con los filtros aplicados.'
                : 'Comienza creando tu primer formulario dinámico.'}
            </p>
            <Button onClick={() => navigate('/admin/formularios/nuevo')} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Formulario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid de formularios */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card
                key={form.id}
                className="group relative transition-all duration-200 hover:border-primary/50 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="line-clamp-2 text-base font-semibold leading-tight">
                        {form.title}
                      </CardTitle>
                      {form.description && (
                        <CardDescription className="line-clamp-2 text-xs">
                          {truncateText(form.description, 100)}
                        </CardDescription>
                      )}
                    </div>
                    {isAdminOrManager && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Opciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/formularios/${form.id}`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(form)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/formularios/${form.id}/respuestas`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver respuestas
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setConfirmArchive(form)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Badge de estado */}
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariants[form.status]}>
                      {statusLabels[form.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">v{form.version}</span>
                  </div>

                  {/* Información adicional */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5" />
                      <span>{getFieldsCount(form)} campos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(form.createdAt)}</span>
                    </div>
                  </div>

                  {/* Botón de acción principal (solo para ADMIN/MANAGER) */}
                  {isAdminOrManager && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/admin/formularios/${form.id}`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar formulario
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className="min-w-[2.5rem]"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      {/* Diálogo de confirmación para archivar */}
      <ConfirmDialog
        open={Boolean(confirmArchive)}
        onClose={() => setConfirmArchive(null)}
        onConfirm={handleArchive}
        title="Archivar formulario"
        description={`¿Estás seguro de que deseas archivar "${confirmArchive?.title}"? El formulario ya no estará disponible para los usuarios, pero podrás restaurarlo más tarde.`}
        confirmText="Archivar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}

export default Forms
