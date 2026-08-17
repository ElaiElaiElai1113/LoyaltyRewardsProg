import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, ImageUp, RefreshCw, ScanLine } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { scanQrImageBitmap, scanQrSourceWithJsQr } from '@/lib/qr-image-scanner'
import { useLanguage } from '@/lib/language'

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
  idleMessage,
  detectedMessage,
  unavailableMessage,
  onDetected,
}: QrScannerProps) {
  const { t } = useLanguage()
  const idleCopy = idleMessage ?? t('Point the device camera at a QR code or upload a screenshot.')
  const detectedCopy = detectedMessage ?? t('QR detected. Review the result before continuing.')
  const unavailableCopy = unavailableMessage ?? t('Live camera scanning is not available in this browser. Use upload or paste the code.')
  const localizedScannerError = (error: unknown, fallback: string) => {
    if (!(error instanceof Error)) return t(fallback)
    const translated = t(error.message)
    return translated === error.message ? t(fallback) : translated
  }
  const [scannerState, setScannerState] = useState<'idle' | 'starting' | 'scanning' | 'processing' | 'detected'>('idle')
  const [message, setMessage] = useState(idleCopy)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<number | null>(null)
  const detectorRef = useRef<BarcodeDetectorLike | null>(null)
  const detectionInFlightRef = useRef(false)
  const detectedRef = useRef(false)
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

  useEffect(() => {
    if (scannerState === 'idle') setMessage(idleCopy)
  }, [idleCopy, scannerState])

  function stopMedia() {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    detectionInFlightRef.current = false
  }

  function stopCamera() {
    stopMedia()
    detectedRef.current = false
    setScannerState('idle')
  }

  function handleDetected(value: string) {
    if (detectedRef.current) return

    detectedRef.current = true
    stopMedia()
    setMessage(detectedCopy)
    setScannerState('detected')
    onDetected(value)
  }

  function getCanvas() {
    canvasRef.current = canvasRef.current ?? document.createElement('canvas')
    return canvasRef.current
  }

  async function detectQrCode(source: ImageBitmap | HTMLVideoElement, exhaustive = false) {
    const BarcodeDetector = getBarcodeDetectorCtor()
    if (BarcodeDetector) {
      try {
        detectorRef.current = detectorRef.current ?? new BarcodeDetector({ formats: ['qr_code'] })
        const codes = await detectorRef.current.detect(source)
        const rawValue = codes.find((code) => code.rawValue)?.rawValue
        if (rawValue) return rawValue
      } catch {
        // Fall through to jsQR when an embedded browser advertises the API but
        // cannot process the current camera frame.
      }
    }

    return scanQrSourceWithJsQr(source, getCanvas(), exhaustive)
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(unavailableCopy)
      return
    }

    try {
      detectedRef.current = false
      setScannerState('starting')
      setMessage(t('Starting camera...'))
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
      setMessage(t('Scanning for QR code...'))

      scanIntervalRef.current = window.setInterval(() => {
        const video = videoRef.current

        if (
          !video ||
          video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA ||
          detectionInFlightRef.current ||
          detectedRef.current
        ) return

        detectionInFlightRef.current = true
        void detectQrCode(video).then((rawValue) => {
          if (rawValue) handleDetected(rawValue)
        }).catch(() => {
          // A transient frame failure should not end the camera session.
        }).finally(() => {
          detectionInFlightRef.current = false
        })
      }, 900)
    } catch (error) {
      stopCamera()
      setMessage(t('Camera access was blocked. Use upload or paste the code.'))
      toast.error(localizedScannerError(error, 'Unable to access the camera.'))
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      detectedRef.current = false
      setScannerState('processing')
      setMessage(t('Checking the whole image for a QR code...'))
      const bitmap = await createImageBitmap(file)
      let rawValue: string | null = null
      try {
        rawValue = await scanQrImageBitmap(bitmap)
      } finally {
        bitmap.close()
      }

      if (!rawValue) {
        setScannerState('idle')
        setMessage(t('No QR found. Try a clearer screenshot or use the camera.'))
        toast.error(t('No QR code was found in that image.'))
        return
      }

      handleDetected(rawValue)
    } catch (error) {
      setScannerState('idle')
      setMessage(idleCopy)
      toast.error(localizedScannerError(error, 'Unable to scan the uploaded QR image.'))
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
            {t('Stop Camera')}
          </Button>
        ) : (
          <>
            <Button type="button" onClick={() => void startCamera()} disabled={scannerState === 'processing'}>
              <Camera className="size-4" />
              {t('Scan With Camera')}
            </Button>
            <Button type="button" variant="secondary" disabled={scannerState === 'processing'} onClick={() => fileInputRef.current?.click()}>
              <ImageUp className="size-4" />
              {scannerState === 'processing' ? t('Checking Screenshot...') : t('Choose Screenshot')}
            </Button>
          </>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  )
}
