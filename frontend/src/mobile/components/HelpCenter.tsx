/**
 * Help Center - Centro de ayuda contextual
 * Botón "?" que muestra ayuda según la página actual
 */

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  HelpCircle,
  X,
  BookOpen,
  MessageCircle,
  Video,
  FileText,
  Search,
  ChevronRight,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

/**
 * Tip de ayuda
 */
interface HelpTip {
  id: string
  title: string
  description: string
  category: string
}

/**
 * FAQ
 */
interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

/**
 * Props del Help Center
 */
interface HelpCenterProps {
  /** Si está abierto */
  open?: boolean
  /** Callback cuando cambia el estado */
  onOpenChange?: (open: boolean) => void
}

/**
 * Help Center Component
 */
export const HelpCenter = ({ open, onOpenChange }: HelpCenterProps) => {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')

  // Obtener ayuda contextual según la página
  const getContextualHelp = (): {
    tips: HelpTip[]
    faqs: FAQ[]
    tutorials: Array<{ id: string; title: string; description: string }>
  } => {
    const path = location.pathname

    // Tips contextuales por página
    const tips: HelpTip[] = []
    const faqs: FAQ[] = []
    const tutorials: Array<{ id: string; title: string; description: string }> = []

    if (path.includes('/dashboard')) {
      tips.push({
        id: 'dashboard-1',
        title: 'Ver tus tareas',
        description: 'Las tareas del día aparecen en la parte superior. Desliza para ver más.',
        category: 'Dashboard',
      })
      tutorials.push({
        id: 'dashboard-tour',
        title: 'Tour del Dashboard',
        description: 'Aprende a navegar por tu dashboard',
      })
    }

    if (path.includes('/form/')) {
      tips.push({
        id: 'form-1',
        title: 'Completar formulario',
        description: 'Desliza entre campos o usa los botones Anterior/Siguiente. Tu progreso se guarda automáticamente.',
        category: 'Formularios',
      })
      tips.push({
        id: 'form-2',
        title: 'Modo offline',
        description: 'Puedes completar formularios sin conexión. Se sincronizarán automáticamente cuando vuelva la conexión.',
        category: 'Formularios',
      })
      faqs.push({
        id: 'form-faq-1',
        question: '¿Puedo guardar un borrador?',
        answer: 'Sí, tu progreso se guarda automáticamente cada 30 segundos. También puedes usar el botón "Guardar borrador".',
        category: 'Formularios',
      })
      tutorials.push({
        id: 'form-tutorial',
        title: 'Cómo completar un formulario',
        description: 'Guía paso a paso para llenar formularios',
      })
    }

    if (path.includes('/assignments')) {
      tips.push({
        id: 'assignments-1',
        title: 'Filtrar tareas',
        description: 'Usa los filtros para ver tareas pendientes, completadas o por fecha.',
        category: 'Tareas',
      })
    }

    // Tips generales
    tips.push({
      id: 'general-1',
      title: 'Trabajar offline',
      description: 'La app funciona sin conexión. Todos tus datos se sincronizarán cuando vuelva la conexión.',
      category: 'General',
    })

    faqs.push({
      id: 'faq-1',
      question: '¿Cómo sincronizo mis datos?',
      answer: 'La sincronización es automática cuando hay conexión. También puedes sincronizar manualmente desde Configuración.',
      category: 'Sincronización',
    })

    faqs.push({
      id: 'faq-2',
      question: '¿Puedo usar la app sin internet?',
      answer: 'Sí, puedes completar formularios, tomar fotos y trabajar completamente offline. Todo se sincronizará después.',
      category: 'Offline',
    })

    return { tips, faqs, tutorials }
  }

  const { tips, faqs, tutorials } = getContextualHelp()

  // Filtrar por búsqueda
  const filteredTips = tips.filter(
    (tip) =>
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Centro de Ayuda
          </SheetTitle>
          <SheetDescription>
            Encuentra respuestas y consejos útiles
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ayuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tips contextuales */}
          {filteredTips.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Consejos útiles
              </h3>
              <div className="space-y-3">
                {filteredTips.map((tip) => (
                  <div
                    key={tip.id}
                    className="rounded-lg border p-4 bg-muted/50"
                  >
                    <p className="text-sm font-medium mb-1">{tip.title}</p>
                    <p className="text-xs text-muted-foreground">{tip.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tutoriales */}
          {tutorials.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Video className="h-4 w-4" />
                Tutoriales
              </h3>
              <div className="space-y-2">
                {tutorials.map((tutorial) => (
                  <Button
                    key={tutorial.id}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => {
                      // Navegar al tutorial
                      console.log('Abrir tutorial:', tutorial.id)
                    }}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">{tutorial.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {tutorial.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {filteredFAQs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Preguntas Frecuentes
              </h3>
              <div className="space-y-3">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="rounded-lg border p-4">
                    <p className="text-sm font-medium mb-2">{faq.question}</p>
                    <p className="text-xs text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contactar soporte */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Navegar a soporte
                console.log('Contactar soporte')
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contactar soporte
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Botón flotante de ayuda
 */
export const HelpButton = () => {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  
  // Ajustar posición si estamos en la página de solicitud de materiales (donde hay botón fijo de envío)
  const isMaterialRequestPage = location.pathname.includes('/warehouse/request')
  const bottomPosition = isMaterialRequestPage ? 'bottom-32' : 'bottom-24'

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={`fixed ${bottomPosition} right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg z-[70]`}
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      <HelpCenter open={open} onOpenChange={setOpen} />
    </>
  )
}

