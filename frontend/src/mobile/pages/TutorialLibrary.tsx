/**
 * Biblioteca de Tutoriales - Página con todos los tutoriales disponibles
 * Accesible desde Settings > Ayuda
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  Clock,
  FileText,
  Camera,
  WifiOff,
  History,
  Lightbulb,
  CheckCircle2,
  ArrowUpDown,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import SortOptions, { type SortOption, type SortDirection } from '../components/SortOptions'
import { Tutorial } from '../components/Tutorial'
import { resetTutorialState } from '../utils/tutorialManager'

/**
 * Tutorial disponible en la biblioteca
 */
interface TutorialItem {
  id: string
  title: string
  description: string
  duration: string
  icon: React.ReactNode
  category: string
  thumbnail?: string
  steps: Array<{
    id: string
    title: string
    description: string
    target?: string
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  }>
}

/**
 * Página de Biblioteca de Tutoriales
 */
const TutorialLibrary = () => {
  const navigate = useNavigate()
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null)
  const [currentTutorialSteps, setCurrentTutorialSteps] = useState<any[]>([])
  const [showSort, setShowSort] = useState(false)
  const [sort, setSort] = useState<string>('name_asc')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Lista de tutoriales disponibles
  const tutorials: TutorialItem[] = [
    {
      id: 'complete-form',
      title: 'Cómo completar un formulario',
      description:
        'Aprende a navegar entre campos, guardar borradores y enviar formularios completos.',
      duration: '3 min',
      icon: <FileText className="h-6 w-6" />,
      category: 'Formularios',
      steps: [
        {
          id: 'step-1',
          title: 'Abrir formulario',
          description: 'Toca una tarea para abrir el formulario asignado.',
          position: 'center',
        },
        {
          id: 'step-2',
          title: 'Navegar entre campos',
          description: 'Usa los botones Anterior/Siguiente o desliza para cambiar de campo.',
          position: 'center',
        },
        {
          id: 'step-3',
          title: 'Guardar progreso',
          description: 'Tu progreso se guarda automáticamente. También puedes usar "Guardar borrador".',
          position: 'center',
        },
      ],
    },
    {
      id: 'capture-photos',
      title: 'Cómo capturar fotos',
      description:
        'Aprende a tomar fotos, editarlas y adjuntarlas a tus formularios.',
      duration: '2 min',
      icon: <Camera className="h-6 w-6" />,
      category: 'Captura',
      steps: [
        {
          id: 'step-1',
          title: 'Abrir cámara',
          description: 'Toca el botón de cámara en un campo de foto.',
          position: 'center',
        },
        {
          id: 'step-2',
          title: 'Tomar foto',
          description: 'Usa el botón grande para capturar. Puedes tomar múltiples fotos.',
          position: 'center',
        },
        {
          id: 'step-3',
          title: 'Editar y usar',
          description: 'Edita la foto si es necesario y selecciona "Usar foto".',
          position: 'center',
        },
      ],
    },
    {
      id: 'work-offline',
      title: 'Cómo trabajar offline',
      description:
        'Aprende a usar la app sin conexión y cómo se sincronizan tus datos.',
      duration: '2 min',
      icon: <WifiOff className="h-6 w-6" />,
      category: 'Offline',
      steps: [
        {
          id: 'step-1',
          title: 'Modo offline',
          description: 'La app funciona completamente sin conexión. Verás un indicador cuando estés offline.',
          position: 'center',
        },
        {
          id: 'step-2',
          title: 'Completar formularios',
          description: 'Puedes completar formularios normalmente. Se guardarán localmente.',
          position: 'center',
        },
        {
          id: 'step-3',
          title: 'Sincronización automática',
          description: 'Cuando vuelva la conexión, tus datos se sincronizarán automáticamente.',
          position: 'center',
        },
      ],
    },
    {
      id: 'review-history',
      title: 'Cómo revisar historial',
      description:
        'Aprende a ver tus formularios completados y filtrar por fecha o estado.',
      duration: '2 min',
      icon: <History className="h-6 w-6" />,
      category: 'Historial',
      steps: [
        {
          id: 'step-1',
          title: 'Acceder al historial',
          description: 'Ve a la pestaña "Historial" en la navegación inferior.',
          position: 'center',
        },
        {
          id: 'step-2',
          title: 'Filtrar resultados',
          description: 'Usa los filtros para ver formularios por fecha, estado o tipo.',
          position: 'center',
        },
        {
          id: 'step-3',
          title: 'Ver detalles',
          description: 'Toca un formulario para ver todos los detalles y respuestas.',
          position: 'center',
        },
      ],
    },
    {
      id: 'tips-tricks',
      title: 'Consejos y trucos',
      description:
        'Descubre funciones avanzadas y atajos para ser más productivo.',
      duration: '4 min',
      icon: <Lightbulb className="h-6 w-6" />,
      category: 'Productividad',
      steps: [
        {
          id: 'step-1',
          title: 'Atajos de teclado',
          description: 'En campos de texto, usa Enter para ir al siguiente campo.',
          position: 'center',
        },
        {
          id: 'step-2',
          title: 'Búsqueda rápida',
          description: 'Desliza hacia abajo en la lista de tareas para buscar.',
          position: 'center',
        },
        {
          id: 'step-3',
          title: 'Sincronización manual',
          description: 'Mantén presionado el botón de sincronización para forzar una sync.',
          position: 'center',
        },
      ],
    },
  ]

  // Configuración de ordenamiento para tutoriales
  const sortOptions: SortOption[] = useMemo(
    () => [
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
      {
        value: 'category',
        label: 'Categoría',
        description: 'Ordenar por categoría',
      },
      {
        value: 'duration',
        label: 'Duración',
        description: 'Ordenar por duración (corta a larga)',
      },
    ],
    [],
  )

  // Ordenar tutoriales
  const sortedTutorials = useMemo(() => {
    const sorted = [...tutorials]

    switch (sort) {
      case 'name_asc':
        sorted.sort((a, b) => {
          return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' })
        })
        break

      case 'name_desc':
        sorted.sort((a, b) => {
          return b.title.localeCompare(a.title, 'es', { sensitivity: 'base' })
        })
        break

      case 'category':
        sorted.sort((a, b) => {
          return sortDirection === 'asc'
            ? a.category.localeCompare(b.category, 'es', { sensitivity: 'base' })
            : b.category.localeCompare(a.category, 'es', { sensitivity: 'base' })
        })
        break

      case 'duration':
        // Extraer minutos de la duración (ej: "3 min" -> 3)
        const parseDuration = (duration: string) => {
          const match = duration.match(/(\d+)/)
          return match ? parseInt(match[1], 10) : 0
        }
        sorted.sort((a, b) => {
          const durationA = parseDuration(a.duration)
          const durationB = parseDuration(b.duration)
          return sortDirection === 'asc' ? durationA - durationB : durationB - durationA
        })
        break

      default:
        break
    }

    return sorted
  }, [tutorials, sort, sortDirection])

  // Handler para cambio de ordenamiento
  const handleSortChange = useCallback((newSort: string, newDirection: SortDirection) => {
    setSort(newSort)
    setSortDirection(newDirection)
  }, [])

  // Iniciar tutorial
  const handleStartTutorial = (tutorial: TutorialItem) => {
    setCurrentTutorialSteps(tutorial.steps)
    setActiveTutorial(tutorial.id)
  }

  // Completar tutorial
  const handleTutorialComplete = () => {
    setActiveTutorial(null)
    setCurrentTutorialSteps([])
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
        <h1 className="flex-1 text-xl font-bold">Tutoriales</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSort(true)}
          className="h-9 w-9"
          aria-label="Ordenar"
        >
          <ArrowUpDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Contenido */}
      <div className="flex-1 space-y-6 p-4">
        {/* Introducción */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
              <h2 className="text-lg font-semibold">Aprende a usar Collector</h2>
              <p className="text-sm text-muted-foreground">
                Explora nuestros tutoriales interactivos para dominar todas las funciones
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de tutoriales */}
        <div className="space-y-4">
          {sortedTutorials.map((tutorial) => (
            <Card key={tutorial.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    {tutorial.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{tutorial.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {tutorial.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {tutorial.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {tutorial.duration}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => handleStartTutorial(tutorial)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar tutorial
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Opciones avanzadas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                resetTutorialState()
                navigate('/mobile/dashboard')
                window.location.reload()
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Reiniciar tutorial de bienvenida
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tutorial activo */}
      {activeTutorial && (
        <Tutorial
          active={true}
          steps={currentTutorialSteps}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialComplete}
        />
      )}

      {/* Sort Options Modal */}
      <SortOptions
        options={sortOptions}
        currentSort={sort}
        currentDirection={sortDirection}
        onChange={handleSortChange}
        open={showSort}
        onOpen={() => setShowSort(true)}
        onClose={() => setShowSort(false)}
        storageKey="tutorials-sort"
        showButton={false}
      />
    </div>
  )
}

export default TutorialLibrary

