import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Download,
  Eye,
  MapPin,
  Calendar,
  User,
  FileText,
  Loader2,
  ExternalLink,
  Mail,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Hash,
  Type,
  Link as LinkIcon,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import LoadingOverlay from '@/shared/components/common/LoadingOverlay'
import useFormResponses, { type FormResponseWithDetails } from '@/shared/hooks/useFormResponses'
import { useForms } from '@/shared/hooks/useForms'
import { type Field, FieldType } from '@/shared/types/formBuilder'
import { cn } from '@/shared/lib/utils'

/**
 * Página para ver las respuestas de un formulario
 */
const FormResponses = () => {
  const { formId: formIdParam } = useParams<{ formId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Obtener formId de params o query
  const formId = formIdParam || searchParams.get('formId') || ''

  const { responses, loading, error, pagination, fetchResponses, getResponse } = useFormResponses()
  const { forms } = useForms()

  const [selectedResponse, setSelectedResponse] = useState<FormResponseWithDetails | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [form, setForm] = useState<{ id: string; title: string; fields: Field[] } | null>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  const RESPONSES_PER_PAGE = 10

  // Cargar formulario
  useEffect(() => {
    if (formId) {
      const foundForm = forms.find((f) => f.id === formId)
      if (foundForm) {
        setForm({
          id: foundForm.id,
          title: foundForm.title,
          fields: foundForm.fields as Field[],
        })
      }
    }
  }, [formId, forms])

  // Cargar respuestas
  useEffect(() => {
    if (formId) {
      void fetchResponses({
        formId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: RESPONSES_PER_PAGE,
      })
    }
  }, [formId, startDate, endDate, currentPage, fetchResponses])

  /**
   * Maneja la aplicación de filtros de fecha
   */
  const handleApplyFilters = () => {
    setCurrentPage(1)
    void fetchResponses({
      formId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 1,
      limit: RESPONSES_PER_PAGE,
    })
  }

  /**
   * Limpia los filtros de fecha
   */
  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  /**
   * Abre el sheet con los detalles de una respuesta
   */
  const handleViewResponse = async (responseId: string) => {
    try {
      const response = await getResponse(responseId)
      setSelectedResponse(response)
      setIsSheetOpen(true)
    } catch (err) {
      console.error('Error al cargar respuesta:', err)
    }
  }

  /**
   * Genera URL de Google Maps para la ubicación
   */
  const getGoogleMapsUrl = (latitude: number, longitude: number) => {
    return `https://www.google.com/maps?q=${latitude},${longitude}`
  }

  /**
   * Renderiza el valor de un campo según su tipo
   */
  const renderFieldValue = (field: Field, value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">Sin respuesta</span>
    }

    switch (field.type) {
      case FieldType.CHECKBOX:
        if (typeof value === 'boolean') {
          return value ? 'Sí' : 'No'
        }
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : 'Ninguna seleccionada'
        }
        return String(value)

      case FieldType.MULTISELECT:
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : 'Ninguna seleccionada'
        }
        return String(value)

      case FieldType.DATE:
      case FieldType.TIME:
      case FieldType.DATETIME:
        try {
          return format(new Date(value as string), 'PPpp')
        } catch {
          return String(value)
        }

      case FieldType.NUMBER:
        return typeof value === 'number' ? value.toLocaleString('es-CL') : String(value)

      default:
        return String(value)
    }
  }

  if (!formId) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>ID de formulario no proporcionado.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // No retornar early, mostrar overlay mientras carga

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/formularios')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {form?.title || 'Respuestas del Formulario'}
              </h1>
              <p className="text-muted-foreground">
                {pagination?.total || 0} respuesta(s) encontrada(s)
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra las respuestas por rango de fechas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="endDate">Fecha de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters}>Aplicar filtros</Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de respuestas */}
      <Card>
        <CardContent className="p-0">
          {/* Mostrar mensaje de error o vacío solo si no está cargando o hay datos */}
          {error ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : responses.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay respuestas</p>
              <p className="text-sm text-muted-foreground">
                Aún no se han recibido respuestas para este formulario.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Fecha de envío</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{response.userName || 'Usuario desconocido'}</div>
                            {response.userEmail && (
                              <div className="text-sm text-muted-foreground">{response.userEmail}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(response.submittedAt), 'PPpp')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {response.latitude && response.longitude ? (
                          <a
                            href={getGoogleMapsUrl(response.latitude, response.longitude)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline"
                          >
                            <MapPin className="h-4 w-4" />
                            <span>Ver en mapa</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Sin ubicación</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewResponse(response.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * RESPONSES_PER_PAGE) + 1} a{' '}
                    {Math.min(currentPage * RESPONSES_PER_PAGE, pagination.total)} de{' '}
                    {pagination.total} respuestas
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="text-sm">
                      Página {currentPage} de {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Sheet con detalles de la respuesta */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          {selectedResponse && form && (
            <>
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Detalle de la Respuesta
                </SheetTitle>
                <SheetDescription className="text-base">
                  Información completa de la respuesta enviada
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Información del usuario - Card mejorado */}
                <Card className="border-2 border-slate-200 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      Información del Usuario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <User className="h-4 w-4" />
                          Nombre
                        </div>
                        <p className="text-base font-semibold text-slate-900">
                          {selectedResponse.userName || 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                        <p className="text-base font-semibold text-slate-900 break-all">
                          {selectedResponse.userEmail || 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Fecha de envío
                        </div>
                        <p className="text-base font-semibold text-slate-900">
                          {format(new Date(selectedResponse.submittedAt), 'PPpp')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ubicación - Card mejorado */}
                {selectedResponse.latitude && selectedResponse.longitude && (
                  <Card className="border-2 border-slate-200 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 bg-emerald-500 rounded-lg">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        Ubicación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-mono text-slate-600">
                            {selectedResponse.latitude.toFixed(6)}, {selectedResponse.longitude.toFixed(6)}
                          </span>
                        </div>
                        <a
                          href={getGoogleMapsUrl(selectedResponse.latitude, selectedResponse.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          Abrir en Google Maps
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <div className="w-full h-80 rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${selectedResponse.latitude},${selectedResponse.longitude}&zoom=15`}
                          allowFullScreen
                          title="Ubicación de la respuesta"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Respuestas de los campos - Cards mejorados */}
                <Card className="border-2 border-slate-200 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      Respuestas del Formulario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {form.fields
                        .sort((a, b) => a.order - b.order)
                        .map((field) => {
                          const value = selectedResponse.data[field.id]
                          const hasValue = value !== null && value !== undefined && value !== ''
                          const isPhoto = field.type === FieldType.PHOTO || field.type === FieldType.FILE
                          
                          return (
                            <div
                              key={field.id}
                              className={cn(
                                'p-4 rounded-lg border-2 transition-all',
                                hasValue
                                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                  : 'bg-slate-50/50 border-slate-100'
                              )}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {field.type === FieldType.PHOTO && <ImageIcon className="h-4 w-4 text-blue-500" />}
                                  {field.type === FieldType.FILE && <FileText className="h-4 w-4 text-purple-500" />}
                                  {field.type === FieldType.NUMBER && <Hash className="h-4 w-4 text-green-500" />}
                                  {field.type === FieldType.EMAIL && <Mail className="h-4 w-4 text-red-500" />}
                                  {field.type === FieldType.URL && <LinkIcon className="h-4 w-4 text-indigo-500" />}
                                  {!isPhoto && field.type !== FieldType.NUMBER && field.type !== FieldType.EMAIL && field.type !== FieldType.URL && (
                                    <Type className="h-4 w-4 text-slate-500" />
                                  )}
                                  <Label className="text-base font-semibold text-slate-900">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </Label>
                                </div>
                                {hasValue ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-slate-300 flex-shrink-0" />
                                )}
                              </div>
                              
                              {isPhoto && Array.isArray(value) && value.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                  {value.map((photo, index) => {
                                    if (typeof photo === 'string' && photo.startsWith('data:image')) {
                                      return (
                                        <div key={index} className="relative group">
                                          <img
                                            src={photo}
                                            alt={`${field.label} ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 shadow-sm group-hover:shadow-md transition-shadow"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
                                        </div>
                                      )
                                    }
                                    return null
                                  })}
                                </div>
                              ) : (
                                <div className={cn(
                                  'p-3 rounded-md mt-2',
                                  hasValue
                                    ? 'bg-white border border-slate-200'
                                    : 'bg-slate-100/50 border border-slate-100'
                                )}>
                                  <p className={cn(
                                    'text-sm whitespace-pre-wrap break-words',
                                    hasValue ? 'text-slate-900' : 'text-slate-400 italic'
                                  )}>
                                    {hasValue ? renderFieldValue(field, value) : 'Sin respuesta'}
                                  </p>
                                </div>
                              )}
                              
                              {field.helperText && (
                                <p className="text-xs text-slate-500 mt-2 italic">
                                  {field.helperText}
                                </p>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Loading Overlay */}
      <LoadingOverlay isLoading={loading} message="Cargando respuestas..." />
    </div>
  )
}

export default FormResponses

