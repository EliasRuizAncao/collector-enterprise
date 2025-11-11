import { useEffect } from 'react'

// Hook para actualizar dinámicamente el título y descripción de la página
export const useSeo = (title: string, description?: string) => {
  useEffect(() => {
    if (title) {
      document.title = title
    }

    if (description) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')

      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.append(meta)
      }

      meta.content = description
    }
  }, [title, description])
}

export default useSeo

