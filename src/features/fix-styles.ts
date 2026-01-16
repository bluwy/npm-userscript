import { addStyle, isValidPackagePage } from '../utils.ts'

export const description = `\
Fix various style issues on the npm site (mostly the package page at the moment).
`

export function runPre() {
  if (isValidPackagePage()) {
    // Remove extraneous padding and margin in sidebar
    addStyle(`
      #repository + p,
      #homePage + p {
        padding: 0 !important;
        margin: 0 !important;
        text-decoration: none;
      }
    `)

    // Fix icon alignment in sidebar links
    addStyle(`
      [aria-labelledby*=repository-link],
      [aria-labelledby*=homePage-link] {
        display: flex;
        align-items: center;
      }

      [aria-labelledby*=repository-link] > span {
        margin-right: 6px;
      }

      [aria-labelledby*=repository-link] > span > svg {
        display: block;
      }
    `)

    // Fix icon alignment in sidebar buttons
    addStyle(`
      [aria-label="Package sidebar"] a.button > svg {
        margin-right: 8px;
      }
    `)

    // Fix install copy button alignment
    addStyle(`
      button[aria-label="Copy install command line"] {
        right: -1px;
      }

      button[aria-label="Copy install command line"] > svg {
        margin-right: 0;
        margin-top: 4px;
      }
    `)

    // Align TS info icon vertically center in header
    addStyle(`
      h1 > div[data-nosnippet="true"] {
        display: flex;
      }
    `)
  }
}

export function run() {
  if (isValidPackagePage()) {
    // "Last publish" should be "Last Publish" for consistency
    const sidebar = document.querySelector('[aria-label="Package sidebar"]')
    const el = Array.from(sidebar?.querySelectorAll('h3') || []).find(
      (el) => el.textContent === 'Last publish',
    )
    if (el) {
      el.textContent = 'Last Publish'
    }
  }
}
