import * as betterVersions from './features/better-versions.ts'
import * as fixIssuePrCount from './features/fix-issue-pr-count.ts'
import * as fixStyles from './features/fix-styles.ts'
import * as moveFunding from './features/move-funding.ts'
import * as noCodeBeta from './features/no-code-beta.ts'
import * as npmCreate from './features/npm-create.ts'
import * as rememberBanner from './features/remember-banner.ts'
import * as removeRunkit from './features/remove-runkit.ts'

export interface FeatureModule {
  /**
   * What this feature does
   */
  description: string
  /**
   * Run as soon as possible on document load. Some elements may not be rendered yet.
   */
  runPre?: () => void | Promise<void>
  /**
   * Run when the page is ready and hydrated.
   */
  run?: () => void | Promise<void>
}

export const allFeatures: Record<string, FeatureModule> = {
  'better-versions': betterVersions,
  'fix-issue-pr-count': fixIssuePrCount,
  'fix-styles': fixStyles,
  'move-funding': moveFunding,
  'no-code-beta': noCodeBeta,
  'npm-create': npmCreate,
  'remember-banner': rememberBanner,
  'remove-runkit': removeRunkit,
}
