export function extractEnvironmentNames(payload: unknown): Set<string>

export function auditEnvironmentNames(names: Set<string>): {
  missingSupabase: string[]
  missingSmtp: string[]
}
