import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utilidad para concatenar clases de Tailwind evitando duplicados
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export default cn

