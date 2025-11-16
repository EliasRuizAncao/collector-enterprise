/**
 * NetworkSpeedIndicator - Indicador de velocidad de red
 */

import { useState, useEffect } from 'react'
import { Wifi, Signal, SignalLow, SignalZero } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'

export type NetworkType = 'wifi' | '4g' | '3g' | '2g' | 'slow-2g' | 'offline'

export interface NetworkSpeedIndicatorProps {
  /** Si mostrar siempre o solo cuando es lenta */
  alwaysVisible?: boolean
  /** Si mostrar sugerencia de esperar */
  showSuggestion?: boolean
}

const NetworkSpeedIndicator = ({
  alwaysVisible = false,
  showSuggestion = true,
}: NetworkSpeedIndicatorProps) => {
  const [networkType, setNetworkType] = useState<NetworkType>('wifi')
  const [effectiveType, setEffectiveType] = useState<string>('4g')
  const [downlink, setDownlink] = useState<number | null>(null)

  useEffect(() => {
    if (!('connection' in navigator)) {
      setNetworkType('wifi') // Asumir WiFi si no hay API
      return
    }

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (!conn) {
      setNetworkType('wifi')
      return
    }

    const updateConnection = () => {
      const type = conn.type || 'wifi'
      const effective = conn.effectiveType || '4g'
      const downlinkSpeed = conn.downlink || null

      setEffectiveType(effective)
      setDownlink(downlinkSpeed)

      // Determinar tipo de red
      if (type === 'wifi' || type === 'ethernet') {
        setNetworkType('wifi')
      } else if (effective === '4g') {
        setNetworkType('4g')
      } else if (effective === '3g') {
        setNetworkType('3g')
      } else if (effective === '2g') {
        setNetworkType('2g')
      } else if (effective === 'slow-2g') {
        setNetworkType('slow-2g')
      } else {
        setNetworkType('offline')
      }
    }

    updateConnection()
    conn.addEventListener('change', updateConnection)

    return () => {
      conn.removeEventListener('change', updateConnection)
    }
  }, [])

  const getIcon = () => {
    switch (networkType) {
      case 'wifi':
        return <Wifi className="h-4 w-4" />
      case '4g':
        return <Signal className="h-4 w-4" />
      case '3g':
        return <Signal className="h-4 w-4" />
      case '2g':
        return <SignalLow className="h-4 w-4" />
      case 'slow-2g':
        return <SignalZero className="h-4 w-4" />
      case 'offline':
        return <SignalZero className="h-4 w-4" />
      default:
        return <Signal className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    switch (networkType) {
      case 'wifi':
        return 'WiFi'
      case '4g':
        return '4G'
      case '3g':
        return '3G'
      case '2g':
        return '2G'
      case 'slow-2g':
        return '2G Lento'
      case 'offline':
        return 'Sin conexión'
      default:
        return 'Desconocido'
    }
  }

  const getVariant = () => {
    if (networkType === 'offline' || networkType === 'slow-2g') return 'destructive'
    if (networkType === '2g') return 'secondary'
    return 'default'
  }

  const isSlow = networkType === 'slow-2g' || networkType === '2g' || networkType === 'offline'

  if (!alwaysVisible && !isSlow) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getVariant()} className="flex items-center gap-1.5">
        {getIcon()}
        <span className="text-xs">{getLabel()}</span>
        {downlink && (
          <span className="text-xs opacity-75">
            {downlink.toFixed(1)} Mbps
          </span>
        )}
      </Badge>

      {showSuggestion && isSlow && networkType !== 'offline' && (
        <span className="text-xs text-amber-600">
          Conexión lenta. Considera esperar antes de sincronizar.
        </span>
      )}
    </div>
  )
}

export default NetworkSpeedIndicator

