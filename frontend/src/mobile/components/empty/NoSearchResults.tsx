import { Search, X } from 'lucide-react'
import { EmptyState, EmptyStateProps } from '../EmptyState'

interface NoSearchResultsProps extends Omit<EmptyStateProps, 'icon' | 'title' | 'description'> {
  /**
   * Términos de búsqueda actuales
   */
  searchTerm?: string
  /**
   * Callback para limpiar búsqueda
   */
  onClearSearch: () => void
  /**
   * Si mostrar botón de acción
   */
  showAction?: boolean
}

/**
 * NoSearchResults - Empty state para búsquedas sin resultados
 * Icon: SearchIcon
 * Título: "Sin resultados"
 * Descripción: "Intenta con otros términos de búsqueda"
 * Action: "Limpiar búsqueda"
 */
export const NoSearchResults = ({
  searchTerm,
  onClearSearch,
  showAction = true,
  variant = 'inline',
  ...props
}: NoSearchResultsProps) => {
  const description = searchTerm
    ? `No encontramos resultados para "${searchTerm}". Intenta con otros términos.`
    : 'Intenta con otros términos de búsqueda'

  return (
    <EmptyState
      icon={<Search className="h-full w-full text-muted-foreground" />}
      title="Sin resultados"
      description={description}
      action={
        showAction
          ? {
              label: 'Limpiar búsqueda',
              onClick: onClearSearch,
              variant: 'outline',
            }
          : undefined
      }
      variant={variant}
      {...props}
    />
  )
}

