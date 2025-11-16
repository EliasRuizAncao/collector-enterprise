/**
 * Componente de skeleton loader para rutas con lazy loading
 * Optimizado para mobile y desktop
 */
const RouteSkeleton = ({ variant = 'default' }: { variant?: 'default' | 'mobile' }) => {
  if (variant === 'mobile') {
    return (
      <div className="flex min-h-screen flex-col bg-background p-4">
        {/* Header skeleton */}
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  // Default skeleton (admin/desktop)
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}

export default RouteSkeleton

