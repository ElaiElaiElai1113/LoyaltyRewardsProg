import type { Business } from '@/types/domain'

type NumericMapPosition = {
  left: number
  top: number
}

export type BusinessMapPosition = {
  left: string
  top: string
}

const MAP_LIMITS = {
  left: 16,
  right: 84,
  top: 20,
  bottom: 80,
}

const PREVIEW_PIN_POSITIONS: NumericMapPosition[] = [
  { left: 28, top: 34 },
  { left: 58, top: 26 },
  { left: 72, top: 54 },
  { left: 42, top: 68 },
  { left: 20, top: 58 },
  { left: 82, top: 36 },
  { left: 36, top: 44 },
  { left: 64, top: 72 },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function hasExactMapPin(business: Business) {
  return business.latitude !== null && business.longitude !== null
}

function getPreviewMapPosition(index: number): NumericMapPosition {
  const base = PREVIEW_PIN_POSITIONS[index % PREVIEW_PIN_POSITIONS.length]
  const lap = Math.floor(index / PREVIEW_PIN_POSITIONS.length)
  const offset = lap * 4

  return {
    left: clamp(base.left + offset, MAP_LIMITS.left, MAP_LIMITS.right),
    top: clamp(base.top + (lap % 2 === 0 ? offset : -offset), MAP_LIMITS.top, MAP_LIMITS.bottom),
  }
}

function projectCoordinate(
  value: number,
  min: number,
  max: number,
  outputMin: number,
  outputMax: number,
  fallback: number,
) {
  const span = max - min
  if (span < Number.EPSILON) return fallback
  return outputMin + ((value - min) / span) * (outputMax - outputMin)
}

function pinsAreCrowded(first: NumericMapPosition, second: NumericMapPosition) {
  return Math.abs(first.left - second.left) < 18 && Math.abs(first.top - second.top) < 14
}

function findReadablePosition(candidate: NumericMapPosition, index: number, placed: NumericMapPosition[]) {
  const alternatives = [
    candidate,
    getPreviewMapPosition(index),
    ...PREVIEW_PIN_POSITIONS,
  ]

  return alternatives.find((position) => placed.every((existing) => !pinsAreCrowded(position, existing)))
    ?? candidate
}

/**
 * Projects each tenant's real coordinates across the illustrative map's usable
 * area. The relative north/south/east/west ordering remains accurate while a
 * very small town no longer collapses every pin into the center.
 */
export function getBusinessMapPositions(businesses: Business[]) {
  const exactBusinesses = businesses.filter(hasExactMapPin)
  const latitudes = exactBusinesses.map((business) => business.latitude as number)
  const longitudes = exactBusinesses.map((business) => business.longitude as number)
  const minLatitude = latitudes.length > 0 ? Math.min(...latitudes) : 0
  const maxLatitude = latitudes.length > 0 ? Math.max(...latitudes) : 0
  const minLongitude = longitudes.length > 0 ? Math.min(...longitudes) : 0
  const maxLongitude = longitudes.length > 0 ? Math.max(...longitudes) : 0
  const placed: NumericMapPosition[] = []

  return businesses.reduce<Record<string, BusinessMapPosition>>((positions, business, index) => {
    const fallback = getPreviewMapPosition(index)
    const projected = hasExactMapPin(business)
      ? {
          left: projectCoordinate(
            business.longitude as number,
            minLongitude,
            maxLongitude,
            MAP_LIMITS.left,
            MAP_LIMITS.right,
            fallback.left,
          ),
          top: projectCoordinate(
            maxLatitude - (business.latitude as number),
            0,
            maxLatitude - minLatitude,
            MAP_LIMITS.top,
            MAP_LIMITS.bottom,
            fallback.top,
          ),
        }
      : fallback
    const readable = findReadablePosition(projected, index, placed)
    placed.push(readable)
    positions[business.id] = {
      left: `${readable.left}%`,
      top: `${readable.top}%`,
    }
    return positions
  }, {})
}
