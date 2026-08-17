import jsQR from 'jsqr'

type BarcodeDetectorLike = {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

const MAX_UPLOAD_EDGE = 1_600

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === 'undefined') return null
  return ('BarcodeDetector' in window ? (window as Window & { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector : null) ?? null
}

function getCropOffsets(total: number, cropSize: number, overlapDivisor = 4) {
  if (cropSize >= total) return [0]

  const distance = total - cropSize
  const steps = Math.max(1, Math.ceil(distance / Math.max(cropSize / overlapDivisor, 1)))
  return Array.from({ length: steps + 1 }, (_, index) => Math.round((distance * index) / steps))
}

function readQrFromRegion(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const imageData = context.getImageData(left, top, width, height)
  return jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null
}

export function scanQrSourceWithJsQr(
  source: ImageBitmap | HTMLVideoElement,
  canvas: HTMLCanvasElement,
  exhaustive: boolean,
) {
  const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width
  const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height
  if (!width || !height) return null

  const uploadScale = exhaustive ? Math.min(1, MAX_UPLOAD_EDGE / Math.max(width, height)) : 1
  const canvasWidth = Math.max(1, Math.round(width * uploadScale))
  const canvasHeight = Math.max(1, Math.round(height * uploadScale))
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  context.drawImage(source, 0, 0, canvasWidth, canvasHeight)
  const fullImageValue = readQrFromRegion(context, 0, 0, canvasWidth, canvasHeight)
  if (fullImageValue || !exhaustive) return fullImageValue

  // Most mobile screenshots center the QR. The first pass moves closely enough
  // to isolate a code that has almost no white margin around it.
  const precisionCropSize = Math.max(96, Math.round(Math.min(canvasWidth, canvasHeight) * 0.56))
  const precisionLeft = Math.round((canvasWidth - precisionCropSize) / 2)
  for (let top = 0; top <= canvasHeight - precisionCropSize; top += 2) {
    const value = readQrFromRegion(context, precisionLeft, top, precisionCropSize, precisionCropSize)
    if (value) return value
  }

  // Keep broader centered passes for screenshots with a larger or smaller QR.
  for (const ratio of [0.72, 0.42]) {
    const cropSize = Math.max(96, Math.round(Math.min(canvasWidth, canvasHeight) * ratio))
    const left = Math.round((canvasWidth - cropSize) / 2)
    for (const top of getCropOffsets(canvasHeight, cropSize, 12)) {
      const value = readQrFromRegion(context, left, top, cropSize, cropSize)
      if (value) return value
    }
  }

  // Also scan an overlapping grid for landscape screenshots and off-center QR codes.
  const shortEdge = Math.min(canvasWidth, canvasHeight)
  const cropSizes = [0.9, 0.75, 0.6, 0.45]
    .map((ratio) => Math.max(96, Math.round(shortEdge * ratio)))
    .filter((size, index, sizes) => size <= shortEdge && sizes.indexOf(size) === index)

  for (const cropSize of cropSizes) {
    const leftOffsets = getCropOffsets(canvasWidth, cropSize)
    const topOffsets = getCropOffsets(canvasHeight, cropSize)

    for (const top of topOffsets) {
      for (const left of leftOffsets) {
        const value = readQrFromRegion(context, left, top, cropSize, cropSize)
        if (value) return value
      }
    }
  }

  return null
}

export async function scanQrImageBitmap(source: ImageBitmap) {
  const BarcodeDetector = getBarcodeDetectorCtor()
  if (BarcodeDetector) {
    try {
      const detected = await new BarcodeDetector({ formats: ['qr_code'] }).detect(source)
      const rawValue = detected[0]?.rawValue
      if (rawValue) return rawValue
    } catch {
      // Some embedded browsers expose BarcodeDetector even though QR detection
      // is not implemented for uploaded images. Continue with the jsQR scan so
      // a full-phone screenshot still works in those browsers.
    }
  }

  return scanQrSourceWithJsQr(source, document.createElement('canvas'), true)
}
