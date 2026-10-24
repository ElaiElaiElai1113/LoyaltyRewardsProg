import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import ts from 'typescript'
import { expect, it } from 'vitest'

it('keeps typechecked source dependencies outside the excluded tests tree', () => {
  const root = process.cwd()
  const crossBoundaryImports: string[] = []
  for (const config of ['tsconfig.app.json', 'tsconfig.node.json']) {
    const parsed = ts.getParsedCommandLineOfConfigFile(resolve(root, config), {}, {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: diagnostic => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      },
    })!
    const pending = [...parsed.fileNames]
    const visited = new Set<string>()
    while (pending.length) {
      const file = pending.pop()!
      if (visited.has(file)) continue
      visited.add(file)
      for (const dependency of ts.preProcessFile(readFileSync(file, 'utf8'), true, true).importedFiles) {
        const resolved = ts.resolveModuleName(dependency.fileName, file, { ...parsed.options, resolveJsonModule: true }, ts.sys).resolvedModule
        if (!resolved || resolved.isExternalLibraryImport) continue
        const path = relative(root, resolved.resolvedFileName).replaceAll('\\', '/')
        // Vercel excludes the complete tests tree. Source tests must keep their
        // fixtures beside the test so strict deployment typechecking can read them.
        if (path.startsWith('tests/')) crossBoundaryImports.push(`${relative(root, file)} -> ${path}`)
        else pending.push(resolved.resolvedFileName)
      }
    }
  }
  expect(crossBoundaryImports, 'Typechecked source depends on the excluded tests tree').toEqual([])
})
