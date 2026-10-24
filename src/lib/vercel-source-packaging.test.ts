import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import ts from 'typescript'
import { expect, it } from 'vitest'

it('keeps every resolved local source dependency in the filtered Vercel upload', () => {
  const root = process.cwd()
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
  const excludedProbes = ['tests/e2e/public.spec.ts', 'tests/fixtures/not-allowlisted.json', 'tests/private.png', 'api/tenant-icon.test.ts']
  const includedProbes = ['public/icons/icon-192.png', 'src/example.png', 'api/_assets/rewardme-client-icon.png']
  // Git supplies directory traversal and negation semantics, including the rule
  // that a child cannot be re-included while its parent directory is excluded.
  const sandbox = mkdtempSync(join(tmpdir(), 'vercel-source-contract-'))
  try {
    execFileSync('git', ['init', '--quiet', sandbox])
    writeFileSync(join(sandbox, '.gitignore'), readFileSync(join(root, '.vercelignore')))
    const result = execFileSync('git', ['-c', 'core.excludesFile=', 'check-ignore', '--no-index', '-z', '--stdin'], {
      cwd: sandbox, input: [...files, ...excludedProbes, ...includedProbes].join('\0') + '\0', encoding: 'utf8',
    })
    const excluded = new Set(result.split('\0').filter(Boolean))
    const missing: string[] = []
    for (const config of ['tsconfig.app.json', 'tsconfig.node.json']) {
      const parsed = ts.getParsedCommandLineOfConfigFile(resolve(root, config), {}, {
        ...ts.sys, onUnRecoverableConfigFileDiagnostic: diagnostic => { throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')) },
      })!
      const pending = [...parsed.fileNames]
      const visited = new Set<string>()
      while (pending.length) {
        const file = pending.pop()!
        if (visited.has(file)) continue
        visited.add(file)
        if (excluded.has(relative(root, file).replaceAll('\\', '/'))) continue
        const source = readFileSync(file, 'utf8')
        for (const dependency of ts.preProcessFile(source, true, true).importedFiles) {
          const resolved = ts.resolveModuleName(dependency.fileName, file, { ...parsed.options, resolveJsonModule: true }, ts.sys).resolvedModule
          if (!resolved || resolved.isExternalLibraryImport) continue
          const path = relative(root, resolved.resolvedFileName).replaceAll('\\', '/')
          if (excluded.has(path)) missing.push(`${relative(root, file)} -> ${path}`)
          else pending.push(resolved.resolvedFileName)
        }
      }
    }
    expect(missing, 'Typechecked source imports files missing from the Vercel upload').toEqual([])
    expect(files.filter(path => path.startsWith('tests/') && !excluded.has(path)).sort()).toEqual([
      'tests/fixtures/home-markup.ts',
      'tests/fixtures/rewardme-reference-copy.json',
      'tests/fixtures/wondertown-home-main-7428.json',
    ])
    // These representative boundaries also protect the deliberately narrow
    // fixture exception and the existing public/source/API icon safeguards.
    for (const path of excludedProbes) {
      expect(excluded.has(path), `${path} must stay excluded`).toBe(true)
    }
    for (const path of includedProbes) {
      expect(excluded.has(path), `${path} must stay included`).toBe(false)
    }
  } finally {
    if (sandbox.startsWith(join(tmpdir(), 'vercel-source-contract-'))) {
      rmSync(sandbox, { recursive: true, force: true })
    }
  }
})
