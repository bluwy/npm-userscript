import { addStyle, listenNavigate } from '../utils.ts'

export const description = `\
Improved package versions tab with compact table view, show tags next to versions, and fix
provenance icon alignment.
`

export function runPre() {
  if (!location.pathname.startsWith('/package/')) return

  // Make row compact
  addStyle(`
    table[aria-labelledby="current-tags"] tbody tr td,
    table[aria-labelledby="version-history"] tbody tr td {
      padding-bottom: 8px;
    }
  `)

  // Fix provenance icon alignment in versions tab. ffs
  // NOTE: No matter what style the popover seems fucked on Safari, can't fix that.
  addStyle(`
    table[aria-labelledby="current-tags"] td > span:last-child > div,
    table[aria-labelledby="version-history"] td > span:last-child > div,
    table[aria-labelledby="current-tags"] td > span:last-child > div > button,
    table[aria-labelledby="version-history"] td > span:last-child > div > button {
      display: inline-block;
    }

    table[aria-labelledby="current-tags"] td > span:last-child > div > div,
    table[aria-labelledby="version-history"] td > span:last-child > div > div {
      right: calc(50% - 2px);
    }
  `)

  // Fix table columns (original 27/40/33)
  addStyle(`
    /* table[aria-labelledby="current-tags"] th:nth-child(1), */
    table[aria-labelledby="version-history"] th:nth-child(1) {
      width: 37%;
    }
    /* table[aria-labelledby="current-tags"] th:nth-child(2), */
    table[aria-labelledby="version-history"] th:nth-child(2) {
      width: 30%;
    }
    /* table[aria-labelledby="current-tags"] th:nth-child(3), */
    table[aria-labelledby="version-history"] th:nth-child(3) {
      width: 33%;
    }
  `)
}

export function run() {
  _run()
  listenNavigate(() => _run())
}

function _run() {
  if (!location.pathname.startsWith('/package/')) return
  // Skip if already run
  if (document.querySelector('.npm-userscript-tag')) return

  // match the versions in the version-history list to the tag

  const versionToTags: Record<string, string[]> = {}
  document.querySelectorAll('table[aria-labelledby="current-tags"] tr').forEach((row) => {
    const version = row.querySelector('td a')?.textContent
    const tag = row.querySelector('td:last-child')?.textContent
    if (version && tag) {
      if (!versionToTags[version]) {
        versionToTags[version] = []
      }
      versionToTags[version].push(tag)
    }
  })

  for (const [version, tags] of Object.entries(versionToTags)) {
    const row = document.querySelector(
      `table[aria-labelledby="version-history"] tr td a[href$="/v/${version}"]`,
    )
    row?.insertAdjacentHTML(
      'afterend',
      `<span class="npm-userscript-tag ml2">(${tags.join(', ')})</span>`,
    )
  }
}
