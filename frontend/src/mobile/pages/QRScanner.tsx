import { useState, useEffect, useRef } from 'react'
import { QrCode, AlertCircle } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import useWarehouse from '@/shared/hooks/useWarehouse'
import { useToast } from '@/shared/components/ui/use-toast'

const QRScanner = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { scanQR, loading } = useWarehouse()
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const qrCodeRegionRef = useRef<HTMLDivElement>(null)
  const qrCodeRegionId = 'qr-reader'

  useEffect(() => {
    return () => {
      // Limpiar scanner al desmontar
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            try {
              scannerRef.current?.clear()
            } catch (e) {
              // Ignorar errores al limpiar
            }
            scannerRef.current = null
          })
          .catch(() => {
            try {
              scannerRef.current?.clear()
            } catch (e) {
              // Ignorar errores al limpiar
            }
            scannerRef.current = null
          })
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      setError(null)
      
      // Verificar que la API de cámara está disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta el acceso a la cámara. Usa un navegador moderno o ingresa el código manualmente.')
      }

      // Primero establecer scanning en true para que React renderice el elemento
      setScanning(true)

      // Esperar a que React renderice el elemento en el DOM
      // Usar requestAnimationFrame para asegurar que el DOM esté actualizado
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 200)
        })
      })

      // Verificar que el elemento existe
      const element = document.getElementById(qrCodeRegionId)
      if (!element) {
        throw new Error('No se pudo inicializar el escáner. Por favor, recarga la página.')
      }

      // Inicializar el scanner
      const html5QrCode = new Html5Qrcode(qrCodeRegionId)
      scannerRef.current = html5QrCode

      // Intentar iniciar el escáner
      // html5-qrcode manejará los permisos de cámara internamente
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        async (decodedText) => {
          // Código QR escaneado exitosamente
          await handleQRScanned(decodedText)
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo (solo mostrar cuando sea relevante)
          // Estos son errores normales mientras busca el QR
          // No hacer nada aquí para evitar spam de errores
        },
      )
    } catch (err: any) {
      console.error('Error starting scanner:', err)
      
      let errorMessage = 'No se pudo acceder a la cámara.'
      
      // Mensajes de error más específicos
      if (err.message) {
        if (err.message.includes('Permission denied') || err.message.includes('NotAllowedError')) {
          errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara en la configuración de tu navegador.'
        } else if (err.message.includes('NotFoundError') || err.message.includes('no camera')) {
          errorMessage = 'No se encontró ninguna cámara en tu dispositivo.'
        } else if (err.message.includes('NotReadableError') || err.message.includes('TrackStartError')) {
          errorMessage = 'La cámara está siendo usada por otra aplicación. Cierra otras apps que usen la cámara e intenta nuevamente.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      setScanning(false)
      
      // Limpiar scanner si se creó
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop().catch(() => {})
          scannerRef.current.clear()
        } catch (clearError) {
          // Ignorar errores al limpiar
        }
        scannerRef.current = null
      }
      
      toast({
        title: 'Error al iniciar escáner',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      })
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
    setScanning(false)
  }

  const handleQRScanned = async (qrCode: string) => {
    try {
      await stopScanning()

      // Marcar como lista para recoger usando el código QR
      const request = await scanQR(qrCode)
      
      toast({
        title: 'QR Escaneado',
        description: 'Solicitud marcada como lista para recoger',
      })
      
      // Navegar a la página de entrega
      navigate(`/mobile/warehouse/deliver/${request.id}`)
    } catch (err: any) {
      setError(err.message || 'Error al procesar código QR')
      toast({
        title: 'Error',
        description: err.message || 'Error al procesar código QR',
        variant: 'destructive',
      })
    }
  }

  const handleManualInput = () => {
    const qrCode = prompt('Ingresa el código QR manualmente:')
    if (qrCode) {
      handleQRScanned(qrCode)
    }
  }


  return (
    <div className="space-y-4 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold">Escanear QR</h1>
        <p className="text-sm text-muted-foreground">
          Escanea el código QR de una solicitud aprobada para marcar como lista
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {scanning && (
        <Card>
          <CardContent className="p-4">
            <div 
              ref={qrCodeRegionRef}
              id={qrCodeRegionId} 
              className="w-full rounded-lg overflow-hidden" 
              style={{ minHeight: '300px' }} 
            />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 pb-2">
        {!scanning ? (
          <>
            <Button className="flex-1" onClick={startScanning} disabled={loading}>
              <QrCode className="mr-2 h-4 w-4" />
              Iniciar Escaneo
            </Button>
            <Button variant="outline" onClick={handleManualInput} disabled={loading}>
              Ingresar Manualmente
            </Button>
          </>
        ) : (
          <Button className="w-full" variant="destructive" onClick={stopScanning}>
            Detener Escaneo
          </Button>
        )}
      </div>
    </div>
  )
}

export default QRScanner

