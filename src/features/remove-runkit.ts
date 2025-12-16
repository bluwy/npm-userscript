import { isValidPackagePage } from '../utils.ts'

export const description = `\
Remove the RunKit link as it's dead.
`

export function run() {
  if (!isValidPackagePage()) return

  const link = document.querySelector('a[href^="https://runkit.com/npm/"]')
  link?.remove()
}
