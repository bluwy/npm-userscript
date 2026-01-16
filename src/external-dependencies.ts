import type { ModuleReplacement } from 'module-replacements'

// https://github.com/es-tooling/module-replacements
export async function getModuleReplacements(): Promise<ModuleReplacement[]> {
  const fetchJson = (url: string) => fetch(url).then((res) => res.json())

  const results = [
    fetchJson('https://cdn.jsdelivr.net/npm/module-replacements@2/manifests/micro-utilities.json'),
    fetchJson('https://cdn.jsdelivr.net/npm/module-replacements@2/manifests/native.json'),
    fetchJson('https://cdn.jsdelivr.net/npm/module-replacements@2/manifests/preferred.json'),
  ]

  const [microUtilities, native, preferred] = await Promise.all(results)

  return [
    ...microUtilities.moduleReplacements,
    ...native.moduleReplacements,
    ...preferred.moduleReplacements,
  ]
}
