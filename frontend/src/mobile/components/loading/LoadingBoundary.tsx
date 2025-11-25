import { ReactNode, Suspense, Component, ErrorInfo } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { SkeletonScreen } from './SkeletonScreen'

interface LoadingBoundaryProps {
  /**
   * Componente a renderizar
   */
  children: ReactNode
  /**
   * Fallback mientras carga (default: SkeletonScreen)
   */
  fallback?: ReactNode
  /**
   * Mensaje de error opcional
   */
  errorMessage?: string
  /**
   * Si mostrar skeleton screen
   */
  showSkeleton?: boolean
  /**
   * Si mostrar mensaje de error
   */
  showError?: boolean
}

interface LoadingBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * LoadingBoundary - Suspense boundary con manejo de errores
 * Usa React Suspense con fallback apropiado
 * Maneja errores y muestra retry button
 * Por ruta o componente
 */
class ErrorBoundary extends Component<
  { children: ReactNode; errorMessage?: string; showError?: boolean },
  LoadingBoundaryState
> {
  constructor(props: { children: ReactNode; errorMessage?: string; showError?: boolean }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): LoadingBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('LoadingBoundary error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.props.showError !== false) {
      return (
        <Card className="m-4 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error al cargar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {this.props.errorMessage || 
                this.state.error?.message || 
                'Ocurrió un error al cargar este contenido.'}
            </p>
            <Button
              variant="outline"
              onClick={this.handleRetry}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * LoadingBoundary - Wrapper de Suspense con ErrorBoundary
 * Usa React Suspense para lazy loading
 * Maneja errores con ErrorBoundary
 * Fallback configurable
 */
export const LoadingBoundary = ({
  children,
  fallback,
  errorMessage,
  showSkeleton = true,
  showError = true,
}: LoadingBoundaryProps) => {
  const defaultFallback = showSkeleton ? (
    <SkeletonScreen cardCount={5} showHeader={true} />
  ) : (
    <div className="flex h-64 items-center justify-center">
      <div className="text-sm text-muted-foreground">Cargando...</div>
    </div>
  )

  return (
    <ErrorBoundary errorMessage={errorMessage} showError={showError}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

