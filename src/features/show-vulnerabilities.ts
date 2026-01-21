import semverGte from 'semver/functions/gte.js'
import semverLt from 'semver/functions/lt.js'
import semverMaxSatisfying from 'semver/ranges/max-satisfying.js'
import { fetchJson } from '../utils-fetch.ts'
import { getNpmContext } from '../utils-npm-context.ts'
import { addPackageLabel, addPackageLabelStyle, computeFloatingUI } from '../utils-ui.ts'
import {
  addStyle,
  getPackageName,
  getPackageVersion,
  isSamePackagePage,
  isValidPackagePage,
  waitForElement,
} from '../utils.ts'

export const description = `\
Adds a label if a package is vulnerable in the header and versions table.
`

const warningSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>`

// Matches /worker/routes/vulnerabilities.ts
interface Vulnerability {
  id: string
  link: string
  score: number
  affected: [string, string][]
}

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  document.querySelector('.npm-userscript-vulnerability-label')?.remove()
  document.querySelectorAll('.npm-userscript-vulnerability-tag').forEach((el) => el.remove())
  document.querySelectorAll('.npm-userscript-vulnerability-popup').forEach((el) => el.remove())
}

export function runPre() {
  addPackageLabelStyle()

  // Vulnerability tag styles
  addStyle(`
    .npm-userscript-vulnerability-tag {
      background: none;
      border: none;
      padding: 0;
      margin-left: 8px;
      cursor: pointer;
      vertical-align: middle;
    }
    .npm-userscript-vulnerability-popup {
      display: none;
      z-index: 1000;
      overflow-y: auto;
      position: absolute;
      top: 0;
      left: 0;
      background: var(--background-color);
      font-size: 90%;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #aaa;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .npm-userscript-vulnerability-popup ul {
      margin: 0;
      padding: 0 0 0 16px;
      font-size: 1em
    }
    .npm-userscript-vulnerability-popup li {
      margin: 6px 0;
    }
  `)
}

export async function run() {
  if (!isValidPackagePage()) return
  if (
    document.querySelector('.npm-userscript-vulnerability-label') &&
    document.querySelector('.npm-userscript-vulnerability-tag')
  )
    return

  const packageName = getPackageName()
  const packageVersion = getPackageVersion()
  if (!packageName || !packageVersion) return

  const json = await fetchJson(`${API_URL}/vulnerabilities/${packageName}`)
  if (!json?.vulns || json.vulns.length === 0) return

  // Pad it in advanced so we don't have to do it later
  for (const vuln of json.vulns) {
    for (let i = 0; i < vuln.affected.length; i++) {
      const range = vuln.affected[i]
      range[0] = padVersion(range[0])
      range[1] = padVersion(range[1])
    }
  }

  if (!document.querySelector('.npm-userscript-vulnerability-label')) {
    const vulnsForVersion = getVulnerabilitiesForVersion(packageVersion, json.vulns)
    const injectParent = document.querySelector('#top > div:first-child')
    if (vulnsForVersion && injectParent) {
      const label = addPackageLabel('show-vulnerabilities', 'VULNERABLE', 'error', 'button')
      label.classList.add('npm-userscript-vulnerability-label')
      const popup = createPopup(vulnsForVersion, label)
      injectParent.appendChild(popup)
    }
  }

  if (new URLSearchParams(location.search).get('activeTab') === 'versions') {
    await addVulnerabilityTagToTable(json.vulns)
  }
}

async function addVulnerabilityTagToTable(vulns: Vulnerability[]) {
  if (document.querySelector('.npm-userscript-vulnerability-tag')) return

  const featureSettings = await getFeatureSettings()
  if (featureSettings['better-versions'].get() === true) {
    await waitForElement('[aria-labelledby="cumulated-versions"]')
  }

  const allVersions = Object.keys(getNpmContext().context.versionsDownloads)

  document.querySelectorAll('table tr').forEach((row) => {
    const versionEl = row.querySelector('td a') ?? row.querySelector('td span')
    if (!versionEl) return

    let version = versionEl.textContent
    // This ".x" is only for the cumulated versions table
    if (version.endsWith('.x')) {
      // Handle versions like "1.2.x" by picking the highest matching version
      const matched = semverMaxSatisfying(allVersions, version)
      if (!matched) return
      version = matched
    }

    const vulnsForVersion = getVulnerabilitiesForVersion(version, vulns)
    if (!vulnsForVersion) return

    const button = document.createElement('button')
    button.className = 'npm-userscript-vulnerability-tag ml2'
    button.innerHTML = warningSvg
    button.style.color = vulnerabilityScoreToColor(Math.max(...vulnsForVersion.map((v) => v.score)))

    const popup = createPopup(vulnsForVersion, button)

    versionEl.insertAdjacentElement('afterend', button)
    versionEl.insertAdjacentElement('afterend', popup)
  })
}

function createPopup(vulns: Vulnerability[], ref: HTMLElement): HTMLElement {
  const popup = document.createElement('div')
  popup.className = 'npm-userscript-vulnerability-popup'

  let inited = false
  computeFloatingUI(ref, popup, {
    onBeforeOpen() {
      if (inited) return
      inited = true
      popup.innerHTML = `
        <p class="mt1 mb2">This version is vulnerable:</p>
        <ul>
          ${vulns
            .map(
              (vuln) =>
                `<li>
                  <a class="black-60 code" href="${vuln.link}" target="_blank" rel="noopener noreferrer">${vuln.id}</a>
                  - ${vuln.score} (<span style="color: ${vulnerabilityScoreToColor(vuln.score)}">${vulnerabilityScoreToText(vuln.score)}</span>)
                </li>`,
            )
            .join('')}
        </ul>`
    },
  })
  return popup
}

function getVulnerabilitiesForVersion(
  version: string,
  vulnerabilities: Vulnerability[],
): Vulnerability[] | undefined {
  const matched: Vulnerability[] = []
  for (const vuln of vulnerabilities) {
    for (const affected of vuln.affected) {
      if (semverGte(version, affected[0]) && semverLt(version, affected[1])) {
        matched.push(vuln)
        break
      }
    }
  }
  return matched.length > 0 ? matched : undefined
}

function padVersion(v: string) {
  const parts = v.split('.')
  while (parts.length < 3) {
    parts.push('0')
  }
  return parts.join('.')
}

function vulnerabilityScoreToText(score: number): string {
  if (score >= 9) return 'Critical'
  if (score >= 7) return 'High'
  if (score >= 4) return 'Medium'
  if (score > 0) return 'Low'
  return 'None'
}

function vulnerabilityScoreToColor(score: number): string {
  // Use npm vars
  if (score >= 9) return 'var(--color-fg-danger)' // #bb2e3e
  if (score >= 7) return '#d15704'
  if (score >= 4) return 'var(--color-fg-attention)' // #886701
  if (score > 0) return 'var(color-fg-accent)' // #196cb2
  return 'var(--color-fg-subtle)' // #666666
}

async function getFeatureSettings() {
  const settings = await import('../settings.ts')
  return settings.featureSettings
}
