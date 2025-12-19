import fs from 'node:fs/promises'
import fss from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as esbuild from 'esbuild'

interface BuildOptions {
  /**
   * The input file path to bundle.
   */
  input: string
  /**
   * The output directory path. The file name is derived from `userscriptMeta.name`, .e.g
   * `<name>.user.js`.
   */
  outDir: string
  /**
   * Additional directories to copy the built userscript to. Useful for testing the userscript by
   * copying to the directory used by a userscript manager. If the directory does not exist, it will
   * be silently skipped. The userscript file will be named `<name> (Local).user.js`.
   */
  copyOutDir?: string[]
  /**
   * Build and watch for changes.
   */
  watch?: boolean
  /**
   * The root directory of the userscript project. Used for locating the `package.json` and
   * resolving relative paths in the options.
   *
   * @default process.cwd()
   */
  rootDir?: string
  /**
   * Userscript metadata fields: https://www.tampermonkey.net/documentation.php. Some fields are
   * automatically inferred from `package.json`:
   *
   * | Field | Metadata |
   * | :- | :- |
   * | `"name"`        | `@name`        |
   * | `"version"`     | `@version`     |
   * | `"description"` | `@description` |
   * | `"license"`     | `@license`     |
   * | `"author"`      | `@author`      |
   * | `"homepage"`    | `@homepageURL` |
   * | `"bugs"`        | `@supportURL`  |
   *
   * Any fields provided in this option will override the inferred values. If an array is passed,
   * the field will be repeated for each value (e.g. for multiple `@match` entries).
   */
  userscriptMeta?: Record<string, string | string[] | undefined>
}

export async function build(options: BuildOptions) {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : process.cwd()

  let pkg: Record<string, any>
  try {
    pkg = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'))
  } catch (e) {
    throw new Error('Failed to read package.json', { cause: e })
  }

  const name =
    (Array.isArray(options.userscriptMeta?.name)
      ? options.userscriptMeta.name[0]
      : options.userscriptMeta?.name) || (pkg.name ? npmNameToTitleCase(pkg.name) : undefined)
  if (!name) {
    throw new Error(
      'Package name is not defined. Please provide a name in package.json or in `userscriptMeta.name`.',
    )
  }

  const defaultUserscriptMeta: BuildOptions['userscriptMeta'] = {
    name,
    version: pkg.version,
    description: pkg.description,
    license: pkg.license,
    author: typeof pkg.author === 'object' ? pkg.author.name : pkg.author,
    homepageURL: pkg.homepage,
    supportURL: typeof pkg.bugs === 'object' ? pkg.bugs.url : pkg.bugs,
  }
  if (pkg.repository) {
    const repoUrl = normalizeGitUrl(
      typeof pkg.repository === 'string' ? pkg.repository : pkg.repository.url,
    )
    if (defaultUserscriptMeta.homepageURL == null) {
      defaultUserscriptMeta.homepageURL = repoUrl
    } else {
      defaultUserscriptMeta.source = repoUrl
    }
  }

  const esbuildOptions: esbuild.BuildOptions = {
    entryPoints: [path.resolve(rootDir, options.input)],
    outfile: path.resolve(rootDir, options.outDir, `${name}.user.js`),
    bundle: true,
    format: 'iife',
    logLevel: 'info',
    banner: {
      js: userscriptMetaToString({
        ...defaultUserscriptMeta,
        ...options.userscriptMeta,
      }),
    },
    plugins: options.copyOutDir ? [esbuildCopyOutDirPlugin(options.copyOutDir, name)] : undefined,
  }

  if (options.watch) {
    const ctx = await esbuild.context(esbuildOptions)
    await ctx.watch()
  } else {
    await esbuild.build(esbuildOptions)
  }
}

/**
 * Supported userscript managers:
 * - `"Userscripts"` - https://github.com/quoid/userscripts
 */
export function getUserscriptManagerOutDir(name: 'Userscripts') {
  switch (name) {
    case 'Userscripts':
      return path.join(
        os.homedir(),
        'Library/Containers/com.userscripts.macos.Userscripts-Extension/Data/Documents/scripts',
      )
  }
}

function userscriptMetaToString(meta: NonNullable<BuildOptions['userscriptMeta']>) {
  let str = '// ==UserScript==\n'

  const entries = Object.entries(meta)
  const maxKeyLength = Math.max(...entries.map(([key]) => key.length))
  for (const [key, value] of entries) {
    if (value == null) continue
    const values = Array.isArray(value) ? value : [value]
    for (const v of values) {
      if (v.trim()) {
        str += `// @${key.padEnd(maxKeyLength + 2)}${v.trim()}\n`
      }
    }
  }

  str += '// ==/UserScript==\n'
  return str
}

function esbuildCopyOutDirPlugin(copyOutDir: string[], name: string): esbuild.Plugin {
  return {
    name: 'copy-out-dir',
    setup(build: esbuild.PluginBuild) {
      build.onEnd(async (result) => {
        if (result.errors.length > 0) return

        const outfile = build.initialOptions.outfile
        if (!outfile) return

        for (const dir of copyOutDir) {
          if (!fss.existsSync(dir)) continue

          const destPath = path.join(dir, `${name} (Local).user.js`)
          const outContent = await fs.readFile(outfile, 'utf8')
          const modifiedContent = outContent.replace(
            /\/\/ @name\s+(.+)\n/,
            (m, $1) => m.slice(0, m.indexOf($1)) + $1 + ' (Local)\n',
          )

          await fs.writeFile(destPath, modifiedContent)
        }
      })
    },
  }
}

function normalizeGitUrl(url: string) {
  url = url
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/(^|\/)[^/]+?@/, '$1') // remove "user@" from "ssh://user@host.com:..."
    .replace(/(\.[^.]+?):/, '$1/') // change ".com:" to ".com/" from "ssh://user@host.com:..."
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\//, 'https://')
  if (url.startsWith('github:')) {
    return `https://github.com/${url.slice(7)}`
  } else if (url.startsWith('gitlab:')) {
    return `https://gitlab.com/${url.slice(7)}`
  } else if (url.startsWith('bitbucket:')) {
    return `https://bitbucket.org/${url.slice(10)}`
  } else if (!url.includes(':') && url.split('/').length === 2) {
    return `https://github.com/${url}`
  } else {
    return url.includes('://') ? url : `https://${url}`
  }
}

function npmNameToTitleCase(str: string) {
  return str
    .replace(/^@/, '')
    .split(/[\/-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
