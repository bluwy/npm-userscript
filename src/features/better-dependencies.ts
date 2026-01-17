import { fetchJson } from '../utils-fetch.ts'
import {
  addStyle,
  getPackageName,
  getPackageVersion,
  isValidPackagePage,
  listenNavigate,
} from '../utils.ts'

export const description = `\
Improved package dependencies tab with added peer dependencies info, optional dependencies info,
and dependency semver ranges.
`

export function runPre() {
  addStyle(`
    #tabpanel-dependencies li sup {
      font-size: 0.875rem;
      top: -0.6rem;
      opacity: 0.7;
    }
  `)

  // Hide with CSS since we need to teardown our added elements manually when navigating away,
  // which can cause a flash of unrelated content. For some reason, npm isn't handling it for us
  // like how it works in better-versions.
  addStyle(`
    #tabpanel-dependencies[data-attribute="hidden"] {
      display: none;
    }
  `)

  // Hide all of the default content.
  // NOTE: Maybe we should not be this aggressive in case the UI fails
  addStyle(`
    #tabpanel-dependencies > h2:not([data-npm-userscript-added]),
    #tabpanel-dependencies > ul:not([data-npm-userscript-added]) {
      display: none;
    }
  `)
}

export function run() {
  _run()
  listenNavigate(() => _run())
}

async function _run() {
  if (!isValidPackagePage()) return ensureTabEmptyOnAway()
  if (new URLSearchParams(location.search).get('activeTab') !== 'dependencies')
    return ensureTabEmptyOnAway()
  if (document.querySelector('[aria-label="Peer Dependencies"]')) return

  const packageName = getPackageName()
  const packageVersion = getPackageVersion()
  if (!packageName || !packageVersion) return

  const packageJson = await fetchPackageJson(packageName, packageVersion)
  if (!packageJson) return

  const section = document.getElementById('tabpanel-dependencies')
  if (!section) return
  // Grab existing elements to preserve styling
  const h2 = section.querySelector('h2')!
  const ul = section.querySelector('ul')!
  const li = section.querySelector('li')!

  const peerDependencies: Record<string, string> = {}
  const optionalPeerDependencies: Record<string, string> = {}
  if (packageJson.peerDependencies) {
    for (const [depName, depVersion] of Object.entries<string>(packageJson.peerDependencies)) {
      if (packageJson.peerDependenciesMeta?.[depName]?.optional === true) {
        optionalPeerDependencies[depName] = depVersion
      } else {
        peerDependencies[depName] = depVersion
      }
    }
  }

  const groups: { title: string; data: Record<string, string> | undefined }[] = [
    { title: 'Dependencies', data: packageJson.dependencies },
    { title: 'Peer Dependencies', data: peerDependencies },
    { title: 'Optional Peer Dependencies', data: optionalPeerDependencies },
    { title: 'Optional Dependencies', data: packageJson.optionalDependencies },
    { title: 'Dev Dependencies', data: packageJson.devDependencies },
  ]

  const elements: HTMLElement[] = []
  for (const group of groups) {
    const normalizedData = group.data
      ? Object.entries(group.data).sort((a, b) => a[0].localeCompare(b[0]))
      : []

    const newH2 = h2.cloneNode() as HTMLElement
    newH2.setAttribute('data-npm-userscript-added', 'true')
    newH2.textContent = `${group.title} (${normalizedData.length})`
    elements.push(newH2)

    const newUl = ul.cloneNode() as HTMLElement
    newUl.setAttribute('data-npm-userscript-added', 'true')
    newUl.ariaLabel = group.title
    for (const [depName, depVersion] of normalizedData) {
      const newLi = li.cloneNode(true) as HTMLElement
      newLi.classList.remove('mr2')
      newLi.classList.add('mr1')
      newLi.querySelector('a')!.innerHTML = `${depName} <sup>${depVersion}</sup>`
      newLi.querySelector('a')!.href = `/package/${encodeURIComponent(depName)}`
      newUl.appendChild(newLi)
    }
    elements.push(newUl)
  }

  // NOTE: Do not delete the existing elements as npm react runtime still reference them for
  // deletion later
  for (const el of elements) {
    section.appendChild(el)
  }
}

async function fetchPackageJson(
  packageName: string,
  packageVersion: string,
): Promise<Record<string, any> | undefined> {
  return await fetchJson(`https://registry.npmjs.org/${packageName}/${packageVersion}`)
}

function ensureTabEmptyOnAway() {
  const section = document.getElementById('tabpanel-dependencies')
  if (section) section.innerHTML = ''
}
