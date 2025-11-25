/**
 * Página de Preguntas Frecuentes (FAQ) - Mobile
 * Centro de ayuda con preguntas y respuestas comunes
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  FileText,
  Smartphone,
  WifiOff,
  Camera,
  MapPin,
  Settings,
  Shield,
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'

/**
 * Categoría de FAQ
 */
type FAQCategory =
  | 'general'
  | 'formularios'
  | 'offline'
  | 'fotos'
  | 'ubicacion'
  | 'sincronizacion'
  | 'notificaciones'
  | 'seguridad'
  | 'configuracion'

/**
 * Pregunta frecuente
 */
interface FAQ {
  id: string
  question: string
  answer: string
  category: FAQCategory
  tags: string[]
  helpful?: number
  notHelpful?: number
}

/**
 * FAQs predefinidas
 */
const faqs: FAQ[] = [
  // General
  {
    id: '1',
    question: '¿Qué es Collector Enterprise?',
    answer:
      'Collector Enterprise es una aplicación móvil diseñada para operadores de campo que permite completar formularios, capturar fotos, registrar ubicaciones y trabajar sin conexión a internet. Todo se sincroniza automáticamente cuando hay conexión.',
    category: 'general',
    tags: ['inicio', 'introducción', 'qué es'],
  },
  {
    id: '2',
    question: '¿Necesito internet para usar la app?',
    answer:
      'No. Collector funciona completamente offline. Puedes completar formularios, tomar fotos y guardar datos sin conexión. Todo se sincroniza automáticamente cuando vuelves a tener internet.',
    category: 'general',
    tags: ['offline', 'internet', 'conexión'],
  },
  {
    id: '3',
    question: '¿Cómo instalo la app en mi teléfono?',
    answer:
      'En iOS: Abre Safari, visita collector.amaranto.com, toca el botón de compartir y selecciona "Añadir a pantalla de inicio". En Android: Abre Chrome, visita el sitio y toca "Instalar app" cuando aparezca el prompt.',
    category: 'general',
    tags: ['instalación', 'instalar', 'pwa'],
  },

  // Formularios
  {
    id: '4',
    question: '¿Cómo completo un formulario?',
    answer:
      'Ve a la sección "Tareas", selecciona el formulario asignado y comienza a llenar los campos. Puedes navegar entre campos deslizando o usando los botones "Anterior" y "Siguiente". El progreso se guarda automáticamente.',
    category: 'formularios',
    tags: ['formulario', 'completar', 'llenar'],
  },
  {
    id: '5',
    question: '¿Puedo guardar un formulario sin completarlo?',
    answer:
      'Sí. Los formularios se guardan automáticamente cada 30 segundos y al cambiar de campo. También puedes usar el botón "Guardar borrador" en cualquier momento. Podrás continuar más tarde desde la misma sección.',
    category: 'formularios',
    tags: ['guardar', 'borrador', 'progreso'],
  },
  {
    id: '6',
    question: '¿Qué pasa si cometo un error al completar un formulario?',
    answer:
      'Puedes corregir cualquier campo antes de enviar. Una vez enviado, contacta a tu supervisor para hacer correcciones. Los formularios enviados no se pueden editar directamente desde la app.',
    category: 'formularios',
    tags: ['error', 'corregir', 'editar'],
  },

  // Offline
  {
    id: '7',
    question: '¿Cómo sé si estoy trabajando offline?',
    answer:
      'Verás un banner amarillo en la parte superior de la pantalla indicando "Sin conexión". También verás un ícono de nube en las tareas que aún no se han sincronizado. El indicador de sincronización en la esquina inferior derecha también muestra el estado.',
    category: 'offline',
    tags: ['offline', 'sin conexión', 'indicador'],
  },
  {
    id: '8',
    question: '¿Cuánto tiempo puedo trabajar offline?',
    answer:
      'No hay límite de tiempo. Puedes trabajar offline indefinidamente. Los datos se guardan localmente y se sincronizan cuando vuelves a tener conexión. Solo asegúrate de tener suficiente espacio en tu dispositivo.',
    category: 'offline',
    tags: ['offline', 'tiempo', 'límite'],
  },
  {
    id: '9',
    question: '¿Qué pasa si se me acaba la batería mientras trabajo offline?',
    answer:
      'Todos tus datos están guardados localmente. Cuando recargues tu teléfono y vuelvas a abrir la app, todo estará ahí. Los datos se sincronizarán automáticamente cuando tengas conexión.',
    category: 'offline',
    tags: ['batería', 'datos', 'guardado'],
  },

  // Fotos
  {
    id: '10',
    question: '¿Cómo tomo una foto desde la app?',
    answer:
      'En un campo de foto, toca "Capturar foto". Permite el acceso a la cámara si es la primera vez. Toma la foto y revisa el preview. Puedes retomar si no te gusta o usar la foto. También puedes tomar múltiples fotos.',
    category: 'fotos',
    tags: ['foto', 'cámara', 'capturar'],
  },
  {
    id: '11',
    question: '¿Puedo usar fotos de mi galería?',
    answer:
      'Sí. Al tocar "Capturar foto", también verás la opción de elegir de la galería. Selecciona la foto que quieras usar. La app comprimirá la imagen automáticamente para ahorrar espacio.',
    category: 'fotos',
    tags: ['galería', 'elegir', 'seleccionar'],
  },
  {
    id: '12',
    question: '¿Cuánto espacio ocupan las fotos?',
    answer:
      'Las fotos se comprimen automáticamente para optimizar el espacio. Una foto típica ocupa entre 200KB y 500KB después de la compresión. Puedes configurar la calidad en Configuración > Almacenamiento.',
    category: 'fotos',
    tags: ['espacio', 'tamaño', 'compresión'],
  },

  // Ubicación
  {
    id: '13',
    question: '¿Cómo funciona la geolocalización?',
    answer:
      'Toca "Obtener ubicación" en un campo de geolocalización. La app usará el GPS de tu teléfono para obtener tu ubicación actual. Asegúrate de tener el GPS activado y estar en un área con buena señal.',
    category: 'ubicacion',
    tags: ['ubicación', 'gps', 'geolocalización'],
  },
  {
    id: '14',
    question: '¿Por qué mi ubicación no es precisa?',
    answer:
      'La precisión depende de varios factores: señal GPS, si estás en interior o exterior, y la calidad del GPS de tu dispositivo. Intenta estar en un área abierta y espera unos segundos más. También puedes recalibrar desde la configuración.',
    category: 'ubicacion',
    tags: ['precisión', 'exactitud', 'gps'],
  },
  {
    id: '15',
    question: '¿Puedo ingresar la ubicación manualmente?',
    answer:
      'Sí. Si el GPS no funciona o prefieres ingresar la ubicación manualmente, hay una opción para hacerlo. Toca "Ingresar manualmente" y escribe la dirección o coordenadas.',
    category: 'ubicacion',
    tags: ['manual', 'dirección', 'coordenadas'],
  },

  // Sincronización
  {
    id: '16',
    question: '¿Cuándo se sincronizan mis datos?',
    answer:
      'La sincronización es automática cuando hay conexión. También puedes sincronizar manualmente deslizando hacia abajo en cualquier pantalla o tocando el botón de sincronización. Puedes configurar la frecuencia en Configuración > Datos y Sincronización.',
    category: 'sincronizacion',
    tags: ['sincronizar', 'sync', 'automático'],
  },
  {
    id: '17',
    question: '¿Qué pasa si la sincronización falla?',
    answer:
      'Los datos permanecen guardados localmente. La app intentará sincronizar nuevamente automáticamente. Si el problema persiste, verifica tu conexión a internet. Los datos nunca se pierden.',
    category: 'sincronizacion',
    tags: ['error', 'fallo', 'reintentar'],
  },
  {
    id: '18',
    question: '¿Puedo sincronizar solo en WiFi?',
    answer:
      'Sí. En Configuración > Datos y Sincronización, puedes activar "Sincronizar solo en WiFi". Esto evitará que la app use tus datos móviles para sincronizar, especialmente útil para fotos grandes.',
    category: 'sincronizacion',
    tags: ['wifi', 'datos', 'ahorro'],
  },

  // Notificaciones
  {
    id: '19',
    question: '¿Cómo activo las notificaciones?',
    answer:
      'La primera vez que uses la app, se te pedirá permiso para enviar notificaciones. Si lo rechazaste, ve a Configuración > Notificaciones y activa las notificaciones push. También puedes configurarlas en los ajustes de tu teléfono.',
    category: 'notificaciones',
    tags: ['notificaciones', 'activar', 'permisos'],
  },
  {
    id: '20',
    question: '¿Qué tipos de notificaciones recibo?',
    answer:
      'Puedes recibir notificaciones de: nuevas tareas asignadas, recordatorios de tareas pendientes, tareas vencidas, comentarios en tus formularios y actualizaciones del sistema. Puedes configurar cuáles recibir en Configuración > Notificaciones.',
    category: 'notificaciones',
    tags: ['tipos', 'configurar', 'personalizar'],
  },
  {
    id: '21',
    question: '¿Puedo desactivar las notificaciones temporalmente?',
    answer:
      'Sí. En Configuración > Notificaciones, puedes configurar un horario de "No molestar" donde no recibirás notificaciones. También puedes desactivar completamente las notificaciones push.',
    category: 'notificaciones',
    tags: ['desactivar', 'no molestar', 'silenciar'],
  },

  // Seguridad
  {
    id: '22',
    question: '¿Es segura mi información?',
    answer:
      'Sí. Usamos encriptación de extremo a extremo, conexiones HTTPS seguras, y puedes habilitar autenticación biométrica (Face ID/Touch ID) para mayor seguridad. Tus datos están protegidos.',
    category: 'seguridad',
    tags: ['seguridad', 'privacidad', 'encriptación'],
  },
  {
    id: '23',
    question: '¿Cómo cambio mi contraseña?',
    answer:
      'Ve a Perfil > Seguridad > Cambiar contraseña. Ingresa tu contraseña actual y la nueva contraseña. Asegúrate de que cumpla con los requisitos de seguridad (mínimo 8 caracteres, mayúsculas, números, etc.).',
    category: 'seguridad',
    tags: ['contraseña', 'cambiar', 'seguridad'],
  },
  {
    id: '24',
    question: '¿Qué hago si perdí mi teléfono?',
    answer:
      'Informa inmediatamente a tu supervisor. Ellos pueden cerrar tu sesión remotamente desde el panel administrativo. También puedes cambiar tu contraseña desde otro dispositivo para mayor seguridad.',
    category: 'seguridad',
    tags: ['perdido', 'robo', 'seguridad'],
  },

  // Configuración
  {
    id: '25',
    question: '¿Cómo cambio el idioma de la app?',
    answer:
      'Ve a Configuración > Idioma y Región > Idioma de la app. Selecciona el idioma que prefieras. La app se actualizará inmediatamente. Actualmente soportamos español e inglés.',
    category: 'configuracion',
    tags: ['idioma', 'lenguaje', 'español'],
  },
  {
    id: '26',
    question: '¿Puedo usar la app en modo oscuro?',
    answer:
      'Sí. Ve a Configuración > Apariencia > Tema. Puedes elegir entre Claro, Oscuro o Automático (sigue la configuración de tu teléfono). El cambio se aplica inmediatamente.',
    category: 'configuracion',
    tags: ['tema', 'oscuro', 'claro'],
  },
  {
    id: '27',
    question: '¿Cómo libero espacio en la app?',
    answer:
      'Ve a Configuración > Almacenamiento. Puedes limpiar el cache, eliminar borradores antiguos (más de 30 días), y gestionar las fotos guardadas. La app también limpia automáticamente datos antiguos.',
    category: 'configuracion',
    tags: ['espacio', 'limpiar', 'almacenamiento'],
  },
]

/**
 * Categorías con iconos
 */
const categoryInfo: Record<
  FAQCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  general: { label: 'General', icon: HelpCircle },
  formularios: { label: 'Formularios', icon: FileText },
  offline: { label: 'Modo Offline', icon: WifiOff },
  fotos: { label: 'Fotos y Cámara', icon: Camera },
  ubicacion: { label: 'Ubicación', icon: MapPin },
  sincronizacion: { label: 'Sincronización', icon: RefreshCw },
  notificaciones: { label: 'Notificaciones', icon: MessageCircle },
  seguridad: { label: 'Seguridad', icon: Shield },
  configuracion: { label: 'Configuración', icon: Settings },
}

/**
 * Página principal de FAQ
 */
const FAQ = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'all'>('all')
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Filtrar FAQs
  const filteredFAQs = useMemo(() => {
    let filtered = faqs

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((faq) => faq.category === selectedCategory)
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(term) ||
          faq.answer.toLowerCase().includes(term) ||
          faq.tags.some((tag) => tag.toLowerCase().includes(term)),
      )
    }

    return filtered
  }, [searchTerm, selectedCategory])

  // Agrupar por categoría
  const groupedFAQs = useMemo(() => {
    const groups: Record<string, FAQ[]> = {}

    filteredFAQs.forEach((faq) => {
      if (!groups[faq.category]) {
        groups[faq.category] = []
      }
      groups[faq.category].push(faq)
    })

    return groups
  }, [filteredFAQs])

  // Toggle expandir item
  const toggleItem = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-xl font-bold">Preguntas Frecuentes</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/mobile/support')}
          className="h-9 w-9"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar preguntas..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Categorías */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="flex-shrink-0"
          >
            Todas
          </Button>
          {Object.entries(categoryInfo).map(([key, info]) => {
            const Icon = info.icon
            return (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key as FAQCategory)}
                className="flex-shrink-0"
              >
                <Icon className="h-4 w-4 mr-2" />
                {info.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-4">
        {filteredFAQs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No se encontraron preguntas
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Intenta con otros términos de búsqueda o cambia la categoría
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
            >
              Limpiar búsqueda
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedCategory === 'all' ? (
              // Mostrar agrupado por categoría
              Object.entries(groupedFAQs).map(([category, categoryFAQs]) => {
                const categoryData = categoryInfo[category as FAQCategory]
                const Icon = categoryData.icon

                return (
                  <section key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">
                        {categoryData.label}
                      </h2>
                      <Badge variant="secondary" className="ml-auto">
                        {categoryFAQs.length}
                      </Badge>
                    </div>
                    <Accordion
                      type="multiple"
                      value={expandedItems}
                      onValueChange={setExpandedItems}
                    >
                      {categoryFAQs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {faq.answer}
                            </p>
                            {faq.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {faq.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </section>
                )
              })
            ) : (
              // Mostrar solo la categoría seleccionada
              <Accordion
                type="multiple"
                value={expandedItems}
                onValueChange={setExpandedItems}
              >
                {filteredFAQs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                      {faq.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {faq.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        )}
      </div>

      {/* Footer con ayuda adicional */}
      <div className="border-t bg-muted/30 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿No encuentras lo que buscas?</CardTitle>
            <CardDescription>
              Contacta a nuestro equipo de soporte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              onClick={() => navigate('/mobile/support')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contactar Soporte
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/mobile/tutorials')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Ver Tutoriales
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FAQ

