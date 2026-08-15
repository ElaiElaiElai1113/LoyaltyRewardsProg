import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, ImageUp, RefreshCw, ScanLine } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { scanQrImageBitmap, scanQrSourceWithJsQr } from '@/lib/qr-image-scanner'

type BarcodeDetectorLike = {
  detect: (source: ImageBitmap | HTMLCanvasElement | HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === 'undefined') return null
  return ('BarcodeDetector' in window ? (window as Window & { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector : null) ?? null
}

interface QrScannerProps {
  idleMessage?: string
  detectedMessage?: string
  unavailableMessage?: string
  onDetected: (value: string) => void
}

export function QrScanner({
  idleMessage = 'Point the device camera at a QR code or upload a screenshot.',
  detectedMessage = 'QR detected. Review the result before continuing.',
  unavailableMessage = 'Live camera scanning is not available in this browser. Use upload or paste the code.',
  onDetected,
}: QrScannerProps) {
  const [scannerState, setScannerState] = useState<'idle' | 'starting' | 'scanning' | 'processing'>('idle')
  const [message, setMessage] = useState(idleMessage)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<number | null>(null)
  const detectorRef = useRef<BarcodeDetectorLike | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current)
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function stopCamera() {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScannerState('idle')
  }

  function handleDetected(value: string) {
    setMessage(detectedMessage)
    stopCamera()
    onDetected(value)
  }

  function getCanvas() {
    canvasRef.current = canvasRef.current ?? document.createElement('canvas')
    return canvasRef.current
  }

  async function detectQrCode(source: ImageBitmap | HTMLVideoElement, exhaustive = false) {
    const BarcodeDetector = getBarcodeDetectorCtor()
    if (BarcodeDetector) {
      detectorRef.current = detectorRef.current ?? new BarcodeDetector({ formats: ['qr_code'] })
      const codes = await detectorRef.current.detect(source)
      const rawValue = codes.find((code) => code.rawValue)?.rawValue
      if (rawValue) return rawValue
    }

    return scanQrSourceWithJsQr(source, getCanvas(), exhaustive)
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(unavailableMessage)
      return
    }

    try {
      setScannerState('starting')
      setMessage('Starting camera...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setScannerState('scanning')
      setMessage('Scanning for QR code...')

      scanIntervalRef.current = window.setInterval(() => {
        const video = videoRef.current

        if (!video || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return

        void detectQrCode(video).then((rawValue) => {
          if (rawValue) handleDetected(rawValue)
        })
      }, 900)
    } catch (error) {
      stopCamera()
      setMessage('Camera access was blocked. Use upload or paste the code.')
      toast.error(error instanceof Error ? error.message : 'Unable to access the camera.')
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      setScannerState('processing')
      setMessage('Checking the whole image for a QR code...')
      const bitmap = await createImageBitmap(file)
      let rawValue: string | null = null
      try {
        rawValue = await scanQrImageBitmap(bitmap)
      } finally {
        bitmap.close()
      }

      if (!rawValue) {
        setScannerState('idle')
        setMessage('No QR found. Try a clearer screenshot or use the camera.')
        toast.error('No QR code was found in that image.')
        return
      }

      handleDetected(rawValue)
    } catch (error) {
      setScannerState('idle')
      setMessage(idleMessage)
      toast.error(error instanceof Error ? error.message : 'Unable to scan the uploaded QR image.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded border border-dashed border-primary-container/20 bg-surface-low">
        <div className="aspect-[4/3] w-full">
          {scannerState === 'scanning' || scannerState === 'starting' ? (
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="rounded bg-primary-container/10 p-4 text-primary-container">
                <ScanLine className="size-8" />
              </div>
              <p className="max-w-sm text-sm font-medium text-on-surface-variant">{message}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {scannerState === 'scanning' || scannerState === 'starting' ? (
          <Button type="button" variant="outline" className="sm:col-span-2" onClick={stopCamera}>
            <RefreshCw className="size-4" />
            Stop Camera
          </Button>
        ) : (
          <>
            <Button type="button" onClick={() => void startCamera()} disabled={scannerState === 'processing'}>
              <Camera className="size-4" />
              Scan With Camera
            </Button>
            <Button type="button" variant="secondary" disabled={scannerState === 'processing'} onClick={() => fileInputRef.current?.click()}>
              <ImageUp className="size-4" />
              {scannerState === 'processing' ? 'Checking Screenshot...' : 'Choose Screenshot'}
            </Button>
          </>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  )
}
