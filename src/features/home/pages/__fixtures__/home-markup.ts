export function visibleWords(markup: string) {
  return markup.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
}

export function homeMarkupSnapshot(markup: string) {
  const attribute = (tag: string, name: string) => tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1] ?? null
  return {
    text: visibleWords(markup),
    links: [...markup.matchAll(/<a\s([^>]*)>([\s\S]*?)<\/a>/g)].map(match => ({ href: attribute(match[1], 'href'), label: visibleWords(match[2]), ariaLabel: attribute(match[1], 'aria-label') })),
    images: [...markup.matchAll(/<img\s([^>]*)>/g)].map(match => ({ src: attribute(match[1], 'src'), alt: attribute(match[1], 'alt'), decorative: attribute(match[1], 'aria-hidden') })),
  }
}
