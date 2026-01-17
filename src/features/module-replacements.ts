import type { ModuleReplacement } from 'module-replacements'
import { fetchJson, fetchText } from '../utils-fetch.ts'
import { addPackageLabel, addPackageLabelStyle, computeFloatingUI } from '../utils-ui.ts'
import { addStyle, getPackageName, isValidPackagePage } from '../utils.ts'

export const description = `\
Suggest alternatives for the package based on "es-tooling/module-replacements" data set.
`

export function runPre() {
  addPackageLabelStyle()
  addStyle(`
    .npm-userscript-popup {
      display: none;
      width: max-content;
      max-width: 500px;
      max-height: 500px;
      z-index: 1000;
      overflow-y: auto;
      position: absolute;
      top: 0;
      left: 0;
      background: var(--background-color);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #aaa;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
  `)
}

export async function run() {
  if (!isValidPackagePage()) return

  const packageName = getPackageName()
  if (!packageName) return

  const moduleReplacements = await getModuleReplacements()
  const replacement = moduleReplacements.find((r) => r.moduleName === packageName)
  if (!replacement) return

  const injectParent = document.querySelector('#top > div:first-child')
  if (!injectParent) return

  switch (replacement.type) {
    case 'documented': {
      const label = addPackageLabel('see alternative packages', 'info')

      const popup = document.createElement('div')
      popup.className = 'npm-userscript-popup ' + getReadmeInternalClassName()
      injectParent.appendChild(popup)

      let fetched = false
      computeFloatingUI(label, popup, {
        async onBeforeOpen() {
          if (fetched) return
          fetched = true
          const html = await fetchDocumentedDocs(replacement.docPath)
          popup.innerHTML = html
        },
      })

      break
    }
    case 'native': {
      const label = addPackageLabel('prefer native code', 'warning')

      let replacementText = replacement.replacement
      if (replacementText.startsWith('Use ')) replacementText = replacementText.slice(4)

      const popup = document.createElement('div')
      popup.className = 'npm-userscript-popup ' + getReadmeInternalClassName()
      popup.innerHTML = `\
For Node.js v${replacement.nodeVersion} and later, use ${replacementText}. 
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/${replacement.mdnPath}" target="_blank">See MDN docs</a>.
`
      injectParent.appendChild(popup)

      computeFloatingUI(label, popup)
      break
    }
    case 'simple': {
      const label = addPackageLabel('prefer simpler code', 'error')

      const popup = document.createElement('div')
      popup.className = 'npm-userscript-popup ' + getReadmeInternalClassName()
      popup.textContent = replacement.replacement
      injectParent.appendChild(popup)

      computeFloatingUI(label, popup)
      break
    }
  }
}

function getReadmeInternalClassName() {
  const el = document.getElementById('readme')
  if (!el) return ''
  return el.className
    .split(' ')
    .filter((c) => c.startsWith('_'))
    .join(' ')
}

// https://github.com/es-tooling/module-replacements
async function getModuleReplacements(): Promise<ModuleReplacement[]> {
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

async function fetchDocumentedDocs(docPath: string) {
  let markdown = await fetchText(
    `https://api.github.com/repos/es-tooling/module-replacements/contents/docs/modules/${docPath}.md`,
    {
      headers: {
        Accept: 'application/vnd.github.raw+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )
  // Delete initial content until after the first heading ended
  markdown = markdown.replace(/^([\s\S]*?\n)# .+?\n/, '')

  const html = await fetchText('https://api.github.com/markdown', {
    method: 'POST',
    headers: {
      Accept: 'text/html',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      text: markdown,
      mode: 'gfm',
      context: 'es-tooling/module-replacements',
    }),
  })

  return html
}
