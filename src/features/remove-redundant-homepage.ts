import { isSamePackagePage, isValidPackagePage } from '../utils.ts'
import { getNpmContext } from '../utils-npm-context.ts'

export const description = `\
Remove the homepage link if it's the same as the repository link, or only has a hash to the readme.
`

export function teardown(previousUrl: string) {
  // Skip teardown if navigating from the same package page
  if (isSamePackagePage(previousUrl)) return

  const homepageEl = document.getElementById('homePage')
  if (homepageEl) {
    homepageEl.parentElement!.style.display = ''
  }
}

export function run() {
  if (!isValidPackagePage()) return

  const homepageEl = document.getElementById('homePage')
  if (!homepageEl) return

  const npmContext = getNpmContext()
  const homepage = npmContext.context.packument.homepage
  const repository = npmContext.context.packument.repository
  if (!homepage || !repository) return

  const isRedundant = homepage === repository || homepage === `${repository}#readme`

  if (isRedundant) {
    homepageEl.parentElement!.style.display = 'none'
  }
}
