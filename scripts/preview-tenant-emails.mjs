import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [configArg, outputArg] = process.argv.slice(2)
if (!configArg) {
  console.error('Usage: npm run ops:email:preview -- tenant-config.json [output-directory]')
  process.exit(2)
}
const config = JSON.parse(await import('node:fs/promises').then(({ readFile }) => readFile(resolve(configArg), 'utf8')))
const outputDir = resolve(outputArg ?? `email-previews/${config.slug ?? 'tenant'}`)
await mkdir(outputDir, { recursive: true })
const origin = `https://${config.primaryDomain || `${config.slug}.rewardsplatform.app`}`
const templates = [
  ['invitation', 'You have been invited', `${origin}/join?invitation=PREVIEW`],
  ['password-recovery', 'Reset your password', `${origin}/reset-password?token=PREVIEW`],
  ['email-verification', 'Verify your email', `${origin}/signin?verified=PREVIEW`],
  ['administrator-invitation', `Admin access for ${config.programName}`, `${origin}/signin?admin_invitation=PREVIEW`],
]
for (const [filename, subject, actionUrl] of templates) {
  const html = `<!doctype html><html lang="${config.locale || 'en'}"><meta charset="utf-8"><title>${subject}</title><body><main><h1>${config.programName || config.slug}</h1><h2>${subject}</h2><p><a href="${actionUrl}">Continue</a></p><p>${config.emailFromAddress || ''}</p></main></body></html>`
  await writeFile(resolve(outputDir, `${filename}.html`), html)
}
await writeFile(resolve(outputDir, 'manifest.json'), `${JSON.stringify({ program: config.programName, origin, templates: templates.map(([name, subject, actionUrl]) => ({ name, subject, actionUrl })) }, null, 2)}\n`)
console.log(JSON.stringify({ ok: true, outputDir, templates: templates.length }, null, 2))
