import * as betterDependencies from './features/better-dependencies.ts'
import * as betterVersions from './features/better-versions.ts'
import * as dimMode from './features/dim-mode.ts'
import * as fixIssuePrCount from './features/fix-issue-pr-count.ts'
import * as fixStyles from './features/fix-styles.ts'
import * as helpfulLinks from './features/helpful-links.ts'
import * as moduleReplacements from './features/module-replacements.ts'
import * as moveFunding from './features/move-funding.ts'
import * as noCodeBeta from './features/no-code-beta.ts'
import * as rememberBanner from './features/remember-banner.ts'
import * as removeRunkit from './features/remove-runkit.ts'
import * as showBinaryLabel from './features/show-binary-label.ts'
import * as showCliLabelAndCommand from './features/show-cli-label-and-command.ts'
import * as showEngineLabel from './features/show-engine-label.ts'
import * as showFileTypesLabel from './features/show-file-types-label.ts'
import * as showLifecycleScriptsLabel from './features/show-lifecycle-scripts-label.ts'
import * as showTypesLabel from './features/show-types-label.ts'
import * as tarballSize from './features/tarball-size.ts'
import * as unpackedSizeAndTotalFiles from './features/unpacked-size-and-total-files.ts'

export interface FeatureModule {
  /**
   * Whether this feature is disabled by default
   */
  disabled?: boolean
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
  'better-dependencies': betterDependencies,
  'better-versions': betterVersions,
  'dim-mode': dimMode,
  'fix-issue-pr-count': fixIssuePrCount,
  'fix-styles': fixStyles,
  'helpful-links': helpfulLinks,
  'module-replacements': moduleReplacements,
  'move-funding': moveFunding,
  'no-code-beta': noCodeBeta,
  'remember-banner': rememberBanner,
  'remove-runkit': removeRunkit,
  'show-binary-label': showBinaryLabel,
  'show-cli-label': showCliLabelAndCommand,
  'show-engine-label': showEngineLabel,
  'show-file-types-label': showFileTypesLabel,
  'show-lifecycle-scripts-label': showLifecycleScriptsLabel,
  'show-types-label': showTypesLabel,
  'tarball-size': tarballSize,
  'unpacked-size-and-total-files': unpackedSizeAndTotalFiles,
}
