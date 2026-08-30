const INSTALL_PROMPT_ELIGIBLE_PATHS = new Set(['/', '/landing-page'])

export function isInstallPromptEligiblePath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return INSTALL_PROMPT_ELIGIBLE_PATHS.has(normalizedPath)
}
