/**
 * ExportSheet - Componente UI para exportar datos
 * Sheet desde bottom con opciones de formato y compartir
 */

import { useState, useRef, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Switch } from '@/shared/components/ui/switch'
import { Progress } from '@/shared/components/ui/progress'
import {
  Download,
  Share2,
  Mail,
  MessageCircle,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useToast } from '@/shared/components/ui/use-toast'
import {
  exportData,
  shareReport,
  downloadFile,
  type ExportFormat,
  type ExportOptions,
} from '../utils/mobileExport'

interface ExportSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  data?: any[]
  element?: HTMLElement | null
  metadata?: ExportOptions['metadata']
  dateRange?: { start: Date; end: Date }
}

/**
 * Opciones de compartir
 */
type ShareOption = 'download' | 'share' | 'email' | 'whatsapp'

const ExportSheet = ({
  open,
  onClose,
  title = 'Exportar datos',
  data = [],
  element = null,
  metadata,
  dateRange,
}: ExportSheetProps) => {
  const { toast } = useToast()
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null)
  const [exportedFilename, setExportedFilename] = useState<string>('')
  const [fileSizeWarning, setFileSizeWarning] = useState<number | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  // Reset al cerrar
  const handleClose = useCallback(() => {
    if (!isExporting) {
      setProgress(0)
      setExportedBlob(null)
      setExportedFilename('')
      setFileSizeWarning(null)
      onClose()
    }
  }, [isExporting, onClose])

  // Generar export
  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true)
      setProgress(0)
      setFileSizeWarning(null)

      // Para PNG, usar el elemento proporcionado o el ref
      const targetElement = element || elementRef.current

      if (format === 'png' && !targetElement) {
        toast({
          title: 'Error',
          description: 'No se puede capturar la pantalla. Intenta con otro formato.',
          variant: 'destructive',
        })
        setIsExporting(false)
        return
      }

      const options: ExportOptions = {
        format,
        includeCharts,
        data: format !== 'png' ? data : undefined,
        title,
        metadata,
        dateRange,
      }

      const result = await exportData(
        options,
        targetElement || undefined,
        (prog) => setProgress(prog),
        (sizeMB) => {
          setFileSizeWarning(sizeMB)
          toast({
            title: 'Archivo grande',
            description: `El archivo es de ${sizeMB.toFixed(1)}MB. Puede tardar en compartirse.`,
            variant: 'default',
          })
        },
      )

      setExportedBlob(result.blob)
      setExportedFilename(result.filename)

      toast({
        title: 'Exportación completada',
        description: `Archivo generado: ${result.filename}`,
      })
    } catch (error: any) {
      console.error('Error exportando:', error)
      toast({
        title: 'Error al exportar',
        description: error.message || 'No se pudo generar el archivo',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }, [format, includeCharts, data, title, metadata, dateRange, element, toast])

  // Compartir/descargar
  const handleShare = useCallback(
    async (option: ShareOption) => {
      if (!exportedBlob || !exportedFilename) {
        toast({
          title: 'Error',
          description: 'Primero debes generar el archivo',
          variant: 'destructive',
        })
        return
      }

      try {
        switch (option) {
          case 'download':
            downloadFile(exportedBlob, exportedFilename)
            toast({
              title: 'Descargado',
              description: 'El archivo se ha descargado',
            })
            handleClose()
            break

          case 'share':
            const shared = await shareReport(exportedBlob, exportedFilename, title)
            if (shared) {
              handleClose()
            }
            break

          case 'email':
            // Crear mailto link
            const subject = encodeURIComponent(title)
            const body = encodeURIComponent('Adjunto encontrarás mi reporte de actividad.')
            const mailtoLink = `mailto:?subject=${subject}&body=${body}`
            window.location.href = mailtoLink
            toast({
              title: 'Email',
              description: 'Se abrirá tu cliente de email. Adjunta el archivo manualmente.',
            })
            break

          case 'whatsapp':
            // WhatsApp Web
            const whatsappText = encodeURIComponent(`Te comparto mi reporte: ${title}`)
            window.open(`https://wa.me/?text=${whatsappText}`, '_blank')
            toast({
              title: 'WhatsApp',
              description: 'Se abrirá WhatsApp. Adjunta el archivo manualmente.',
            })
            break
        }
      } catch (error) {
        console.error('Error compartiendo:', error)
        toast({
          title: 'Error',
          description: 'No se pudo compartir el archivo',
          variant: 'destructive',
        })
      }
    },
    [exportedBlob, exportedFilename, title, toast, handleClose],
  )

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent side="bottom" className="h-[85vh] max-h-[700px] p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="border-b border-border/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-mobile-h3 font-semibold">{title}</SheetTitle>
                <SheetDescription>Elige el formato y opciones de exportación</SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg touch-manipulation"
                onClick={handleClose}
                disabled={isExporting}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Formato */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Formato</Label>
              <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 rounded-lg border p-3">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-500" />
                        <div>
                          <div className="font-medium">PDF</div>
                          <div className="text-xs text-muted-foreground">Documento con gráficos</div>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border p-3">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">CSV</div>
                          <div className="text-xs text-muted-foreground">Datos tabulares</div>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border p-3">
                    <RadioGroupItem value="xlsx" id="xlsx" />
                    <Label htmlFor="xlsx" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Excel (XLSX)</div>
                          <div className="text-xs text-muted-foreground">Hoja de cálculo</div>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border p-3">
                    <RadioGroupItem value="png" id="png" disabled={!element && !elementRef.current} />
                    <Label
                      htmlFor="png"
                      className={cn(
                        'flex-1 cursor-pointer',
                        (!element && !elementRef.current) && 'opacity-50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">Imagen (PNG)</div>
                          <div className="text-xs text-muted-foreground">Captura de pantalla</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Opciones */}
            {format !== 'png' && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="charts" className="text-sm font-medium">
                    Incluir gráficos
                  </Label>
                  <p className="text-xs text-muted-foreground">Agregar visualizaciones al export</p>
                </div>
                <Switch id="charts" checked={includeCharts} onCheckedChange={setIncludeCharts} />
              </div>
            )}

            {/* Warning de tamaño */}
            {fileSizeWarning && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Archivo grande
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-200 mt-1">
                      El archivo es de {fileSizeWarning.toFixed(1)}MB. Puede tardar en compartirse.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Generando archivo...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Success */}
            {exportedBlob && !isExporting && (
              <div className="rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-950/20 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Archivo generado
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-200 mt-1">
                      {exportedFilename}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Elemento oculto para captura PNG */}
            {format === 'png' && !element && (
              <div ref={elementRef} className="hidden">
                {/* Este elemento se capturará si no se proporciona uno */}
              </div>
            )}
          </div>

          {/* Footer */}
          <SheetFooter className="border-t border-border/60 px-4 py-3 gap-2">
            {!exportedBlob ? (
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 gap-2"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generar archivo
                  </>
                )}
              </Button>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleShare('download')}
                    className="gap-2"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare('share')}
                    className="gap-2"
                    size="sm"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartir
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleShare('email')}
                    className="gap-2"
                    size="sm"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleShare('whatsapp')}
                    className="gap-2"
                    size="sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
                <Button variant="outline" onClick={handleClose} className="w-full" size="sm">
                  Cerrar
                </Button>
              </div>
            )}
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ExportSheet

