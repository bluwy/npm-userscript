import { addStyle, isValidPackagePage } from '../utils.ts'

export const description = `\
Fix various style issues on the npm site.
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

    // Remove spacing under install
    addStyle(`
      aside[aria-label="Package sidebar"] > h3 + div {
        margin-bottom: 0;
      }
    `)

    // Fix dark mode deprecation color contrast
    addStyle(`
      html[data-color-mode="dark"] #top > div:first-child.bg-washed-red.b--black-10,
      html[data-color-mode="dark"] #top > div:first-child.bg-washed-red .b--black-10 {
        color: #262626 !important;
      }

      html[data-color-mode="dark"] #top > div:first-child code {
        color: var(--color-fg-default);
      }
    `)
  }

  if (/^\/settings\/.+?\/members/.test(location.pathname)) {
    // Fix member name alignment
    addStyle(`
      #tabpanel-members h3 {
        width: 300px;
        flex-grow: 0;
      }

      #tabpanel-members [data-type="role"] {
        text-align: left;
      }
    `)
  }

  if (location.pathname === '/') {
    addStyle(`
      ul[aria-labelledby="discover-packages-header"] {
        gap: 10px;
      }

      ul[aria-labelledby="discover-packages-header"] li {
        display: block;
        flex: unset;
        width: calc(50% - 5px);
        margin: 0;
      }

      ul[aria-labelledby="discover-packages-header"] a {
        padding-left: 0;
        padding-right: 0;
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
