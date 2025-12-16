// Move the funding button to bottom

import { isValidPackagePage } from '../utils'

export const description = `\
Move the "Fund this package" button to the bottom of the sidebar.
`

export function run() {
  if (!isValidPackagePage()) return

  // Find funding button. This is poorly tagged, so we just find all the buttons in the sidebar and
  // look for one that contains "Fund this package" text
  const sidebarButtons = document.querySelectorAll('[aria-label="Package sidebar"] a.button')
  let fundingButton: HTMLElement | null = null
  for (const button of sidebarButtons) {
    if (button.textContent.includes('Fund this package')) {
      fundingButton = button.parentElement as HTMLElement
      break
    }
  }

  if (fundingButton) {
    // Put it after the collaborators section
    const collaboratorsSection = document.querySelector('div:has(> #collaborators)')
    collaboratorsSection?.insertAdjacentElement('afterend', fundingButton)
  }
}
