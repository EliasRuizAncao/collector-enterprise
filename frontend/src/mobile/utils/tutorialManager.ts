/**
 * Tutorial Manager - Gestión del estado y progreso de tutoriales
 */

/**
 * Tipos de tutorial
 */
export type TutorialType =
  | 'welcome'
  | 'dashboard'
  | 'navigation'
  | 'capture'
  | 'sync'
  | 'form'
  | 'photo'
  | 'offline'
  | 'history'

/**
 * Estado de tutorial
 */
export interface TutorialState {
  /** Si el tutorial principal ha sido completado */
  welcomeCompleted: boolean
  /** Si el usuario eligió no volver a mostrar */
  dontShowAgain: boolean
  /** Paso actual del tutorial (si está en progreso) */
  currentStep: number
  /** Tutoriales contextuales completados */
  contextualCompleted: Set<TutorialType>
  /** Última vez que se mostró un coach mark */
  lastCoachMark?: string
  /** Sesión actual (para limitar coach marks) */
  sessionId: string
}

/**
 * Clave de localStorage
 */
const STORAGE_KEY = 'collector-tutorial-state'

/**
 * Obtener estado del tutorial desde localStorage
 */
export const getTutorialState = (): TutorialState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...parsed,
        contextualCompleted: new Set(parsed.contextualCompleted || []),
        sessionId: parsed.sessionId || generateSessionId(),
      }
    }
  } catch (error) {
    console.error('Error al cargar estado del tutorial:', error)
  }

  return {
    welcomeCompleted: false,
    dontShowAgain: false,
    currentStep: 0,
    contextualCompleted: new Set(),
    sessionId: generateSessionId(),
  }
}

/**
 * Guardar estado del tutorial en localStorage
 */
export const saveTutorialState = (state: TutorialState): void => {
  try {
    const toSave = {
      ...state,
      contextualCompleted: Array.from(state.contextualCompleted),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (error) {
    console.error('Error al guardar estado del tutorial:', error)
  }
}

/**
 * Marcar tutorial principal como completado
 */
export const markWelcomeCompleted = (dontShowAgain: boolean = false): void => {
  const state = getTutorialState()
  state.welcomeCompleted = true
  state.dontShowAgain = dontShowAgain
  state.currentStep = 0
  saveTutorialState(state)
}

/**
 * Guardar progreso del tutorial
 */
export const saveTutorialProgress = (step: number): void => {
  const state = getTutorialState()
  state.currentStep = step
  saveTutorialState(state)
}

/**
 * Marcar tutorial contextual como completado
 */
export const markContextualCompleted = (type: TutorialType): void => {
  const state = getTutorialState()
  state.contextualCompleted.add(type)
  saveTutorialState(state)
}

/**
 * Verificar si un tutorial contextual está completado
 */
export const isContextualCompleted = (type: TutorialType): boolean => {
  const state = getTutorialState()
  return state.contextualCompleted.has(type)
}

/**
 * Verificar si debe mostrarse el tutorial principal
 */
export const shouldShowWelcomeTutorial = (): boolean => {
  const state = getTutorialState()
  return !state.welcomeCompleted && !state.dontShowAgain
}

/**
 * Registrar coach mark mostrado
 */
export const markCoachMarkShown = (coachMarkId: string): void => {
  const state = getTutorialState()
  state.lastCoachMark = coachMarkId
  saveTutorialState(state)
}

/**
 * Verificar si se puede mostrar un coach mark
 */
export const canShowCoachMark = (coachMarkId: string): boolean => {
  const state = getTutorialState()
  // Solo un coach mark por sesión
  return state.lastCoachMark !== coachMarkId
}

/**
 * Generar ID de sesión
 */
const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Resetear estado del tutorial (para testing)
 */
export const resetTutorialState = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}

