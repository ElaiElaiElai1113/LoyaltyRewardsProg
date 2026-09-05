export function removeRetiredInternalLabels(copy: string) {
  const trimmedCopy = copy.trim()
  const withoutLabels = trimmedCopy
    .replace(/\bquality[\s-]+assurance\b/gi, ' ')
    .replace(/\bqa\b/gi, ' ')

  if (withoutLabels === trimmedCopy) return trimmedCopy

  return withoutLabels
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/^[\s|/,.;:–—-]+|[\s|/,.;:–—-]+$/g, '')
    .trim()
}

const displayFields = new Set(['name', 'fullname', 'displayname', 'businessname', 'memberfullname', 'ownername', 'contactname', 'title', 'description', 'category'])

export function sanitizeVisibleData<T>(value: T, field = ''): T {
  if (typeof value === 'string') {
    return (displayFields.has(field.replaceAll('_', '').toLowerCase())
      ? removeRetiredInternalLabels(value)
      : value) as T
  }

  if (Array.isArray(value)) {
    let changed = false
    const nextValue = value.map((item) => {
      const nextItem = sanitizeVisibleData(item)
      changed ||= nextItem !== item
      return nextItem
    })
    return (changed ? nextValue : value) as T
  }

  if (value !== null && typeof value === 'object') {
    let changed = false
    const nextValue = Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        const nextItem = sanitizeVisibleData(item, key)
        changed ||= nextItem !== item
        return [key, nextItem]
      }),
    )
    return (changed ? nextValue : value) as T
  }

  return value
}
