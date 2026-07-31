import { useLayoutEffect } from 'react'

import { platformBrand } from '@/features/platform/platform-brand'

export function usePlatformDocumentBrand(enabled = true) {
  useLayoutEffect(() => {
    if (!enabled) return

    const title = document.title
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const siteName = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')
    const openGraphTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')
    const previousDescription = description?.content
    const previousSiteName = siteName?.content
    const previousOpenGraphTitle = openGraphTitle?.content

    document.title = platformBrand.adminTitle
    description?.setAttribute('content', platformBrand.description)
    siteName?.setAttribute('content', platformBrand.name)
    openGraphTitle?.setAttribute('content', platformBrand.adminTitle)

    return () => {
      document.title = title
      if (previousDescription !== undefined) description?.setAttribute('content', previousDescription)
      if (previousSiteName !== undefined) siteName?.setAttribute('content', previousSiteName)
      if (previousOpenGraphTitle !== undefined) openGraphTitle?.setAttribute('content', previousOpenGraphTitle)
    }
  }, [enabled])
}
