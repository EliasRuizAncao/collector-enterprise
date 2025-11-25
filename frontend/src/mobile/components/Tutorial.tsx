/**
 * Tutorial Interactivo - Tour inicial y tutoriales contextuales
 * Componente principal para guiar a nuevos usuarios
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Home,
  List,
  Camera,
  User,
  RefreshCw,
  WifiOff,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import {
  getTutorialState,
  markWelcomeCompleted,
  saveTutorialProgress,
  shouldShowWelcomeTutorial,
  type TutorialType,
} from '../utils/tutorialManager'
import { cn } from '@/shared/lib/utils'

/**
 * Paso del tutorial
 */
interface TutorialStep {
  id: string
  title: string
  description: string
  target?: string // Selector CSS del elemento a destacar
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  image?: string
  icon?: React.ReactNode
  action?: () => void // Acción a ejecutar (ej: navegar a otra página)
}

/**
 * Props del componente Tutorial
 */
interface TutorialProps {
  /** Si el tutorial está activo */
  active: boolean
  /** Callback cuando se completa */
  onComplete: () => void
  /** Callback cuando se omite */
  onSkip: () => void
  /** Pasos del tutorial */
  steps: TutorialStep[]
  /** Si es el tutorial de bienvenida */
  isWelcome?: boolean
}

/**
 * Componente principal del Tutorial
 */
export const Tutorial = ({
  active,
  onComplete,
  onSkip,
  steps,
  isWelcome = false,
}: TutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const currentStepData = steps[currentStep]

  // Obtener posición del elemento objetivo
  useEffect(() => {
    if (!active || !currentStepData?.target) {
      setTargetElement(null)
      setSpotlightRect(null)
      return
    }

    const updateTarget = () => {
      const element = document.querySelector(currentStepData.target!) as HTMLElement
      if (element) {
        setTargetElement(element)
        const rect = element.getBoundingClientRect()
        setSpotlightRect(rect)
      } else {
        setTargetElement(null)
        setSpotlightRect(null)
      }
    }

    updateTarget()
    window.addEventListener('resize', updateTarget)
    window.addEventListener('scroll', updateTarget, true)

    return () => {
      window.removeEventListener('resize', updateTarget)
      window.removeEventListener('scroll', updateTarget, true)
    }
  }, [active, currentStep, currentStepData?.target])

  // Ejecutar acción del paso si existe
  useEffect(() => {
    if (active && currentStepData?.action) {
      // Delay pequeño para que la animación se vea
      setTimeout(() => {
        currentStepData.action?.()
      }, 300)
    }
  }, [active, currentStep, currentStepData?.action])

  // Guardar progreso
  useEffect(() => {
    if (active) {
      saveTutorialProgress(currentStep)
    }
  }, [active, currentStep])

  // Navegar al siguiente paso
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }, [currentStep, steps.length])

  // Navegar al paso anterior
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // Completar tutorial
  const handleComplete = useCallback(() => {
    if (isWelcome) {
      markWelcomeCompleted(dontShowAgain)
    }
    onComplete()
  }, [isWelcome, dontShowAgain, onComplete])

  // Omitir tutorial
  const handleSkip = useCallback(() => {
    if (isWelcome) {
      markWelcomeCompleted(dontShowAgain)
    }
    onSkip()
  }, [isWelcome, dontShowAgain, onSkip])

  // Manejar swipe
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe && currentStep > 0) {
      handlePrevious()
    }
  }

  if (!active) return null

  // Calcular posición del tooltip
  const getTooltipPosition = () => {
    if (!spotlightRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const position = currentStepData.position || 'bottom'
    const padding = 16

    switch (position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - spotlightRect.top + padding}px`,
          left: `${spotlightRect.left + spotlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        }
      case 'bottom':
        return {
          top: `${spotlightRect.bottom + padding}px`,
          left: `${spotlightRect.left + spotlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        }
      case 'left':
        return {
          top: `${spotlightRect.top + spotlightRect.height / 2}px`,
          right: `${window.innerWidth - spotlightRect.left + padding}px`,
          transform: 'translateY(-50%)',
        }
      case 'right':
        return {
          top: `${spotlightRect.top + spotlightRect.height / 2}px`,
          left: `${spotlightRect.right + padding}px`,
          transform: 'translateY(-50%)',
        }
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
    }
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Overlay oscuro con agujero para spotlight */}
          <div className="absolute inset-0 bg-black/70">
            {spotlightRect && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <mask id="spotlight-mask">
                    <rect width="100%" height="100%" fill="black" />
                    <rect
                      x={spotlightRect.left - 8}
                      y={spotlightRect.top - 8}
                      width={spotlightRect.width + 16}
                      height={spotlightRect.height + 16}
                      rx={12}
                      fill="white"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="black"
                  opacity="0.7"
                  mask="url(#spotlight-mask)"
                />
              </svg>
            )}
          </div>

          {/* Contenido del tutorial */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={getTooltipPosition()}
              className={cn(
                'bg-background rounded-lg shadow-xl p-6 max-w-sm w-full pointer-events-auto',
                currentStepData.position === 'center' && 'absolute',
                currentStepData.position !== 'center' && 'absolute',
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {currentStepData.icon && (
                    <div className="text-primary">{currentStepData.icon}</div>
                  )}
                  <h3 className="text-lg font-bold">{currentStepData.title}</h3>
                </div>
                {!isWelcome && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleSkip}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Descripción */}
              <p className="text-sm text-muted-foreground mb-4">
                {currentStepData.description}
              </p>

              {/* Imagen si existe */}
              {currentStepData.image && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={currentStepData.image}
                    alt={currentStepData.title}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      index === currentStep
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted',
                    )}
                  />
                ))}
              </div>

              {/* Contador de pasos */}
              <p className="text-xs text-muted-foreground text-center mb-4">
                {currentStep + 1} de {steps.length}
              </p>

              {/* Checkbox "No volver a mostrar" (solo en welcome) */}
              {isWelcome && currentStep === steps.length - 1 && (
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    id="dont-show-again"
                    checked={dontShowAgain}
                    onCheckedChange={(checked) => setDontShowAgain(!!checked)}
                  />
                  <Label
                    htmlFor="dont-show-again"
                    className="text-xs cursor-pointer"
                  >
                    No volver a mostrar este tutorial
                  </Label>
                </div>
              )}

              {/* Botones de navegación */}
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className={currentStep === 0 ? 'flex-1' : ''}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Omitir
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Empezar
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Tutorial de Bienvenida
 */
export const WelcomeTutorial = () => {
  const navigate = useNavigate()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (shouldShowWelcomeTutorial()) {
      setActive(true)
    }
  }, [])

  const steps: TutorialStep[] = [
    {
      id: 'welcome',
      title: '¡Bienvenido a Collector!',
      description:
        'La herramienta que necesitas para gestionar formularios en campo de forma eficiente y sin conexión.',
      position: 'center',
      icon: <Sparkles className="h-6 w-6" />,
    },
    {
      id: 'dashboard',
      title: 'Tu Dashboard',
      description:
        'Aquí verás todas tus tareas del día. Las tareas pendientes aparecen en la parte superior.',
      target: '[data-tutorial="dashboard-tasks"]',
      position: 'bottom',
      icon: <Home className="h-5 w-5" />,
    },
    {
      id: 'navigation',
      title: 'Navegación',
      description:
        'Usa la barra inferior para navegar: Tareas, Historial y Perfil. Siempre visible y fácil de alcanzar.',
      target: '[data-tutorial="bottom-navigation"]',
      position: 'top',
      icon: <List className="h-5 w-5" />,
    },
    {
      id: 'capture',
      title: 'Captura de Datos',
      description:
        'Puedes tomar fotos, capturar tu ubicación y firmar digitalmente. Todo funciona sin conexión.',
      target: '[data-tutorial="capture-features"]',
      position: 'top',
      icon: <Camera className="h-5 w-5" />,
    },
    {
      id: 'sync',
      title: 'Sincronización Automática',
      description:
        'Tus datos se sincronizan automáticamente cuando hay conexión. Puedes trabajar tranquilo sin internet.',
      target: '[data-tutorial="sync-indicator"]',
      position: 'top',
      icon: <RefreshCw className="h-5 w-5" />,
    },
    {
      id: 'ready',
      title: '¡Listo para comenzar!',
      description:
        'Ya conoces lo básico. Explora la app y recuerda que siempre puedes ver este tutorial desde Configuración > Ayuda.',
      position: 'center',
      icon: <CheckCircle2 className="h-6 w-6" />,
    },
  ]

  return (
    <Tutorial
      active={active}
      steps={steps}
      isWelcome={true}
      onComplete={() => setActive(false)}
      onSkip={() => setActive(false)}
    />
  )
}

/**
 * Hook para usar tutoriales contextuales
 */
export const useTutorial = (type: TutorialType, steps: TutorialStep[]) => {
  const [active, setActive] = useState(false)
  const { isContextualCompleted, markContextualCompleted } = require('../utils/tutorialManager')

  useEffect(() => {
    if (!isContextualCompleted(type)) {
      // Delay pequeño para que la UI se renderice
      const timer = setTimeout(() => {
        setActive(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [type])

  const handleComplete = () => {
    markContextualCompleted(type)
    setActive(false)
  }

  return {
    active,
    setActive,
    handleComplete,
    TutorialComponent: (
      <Tutorial
        active={active}
        steps={steps}
        onComplete={handleComplete}
        onSkip={handleComplete}
      />
    ),
  }
}

export default Tutorial

