import os from 'node:os'
import path from 'node:path'
import { build } from './build.ts'

const command = process.argv[2]

await build({
  name: 'Npm Userscript',
  watch: command === 'dev',
  inputFile: 'src/index.ts',
  outputDir: 'dist',
  userscriptDir: path.join(
    os.homedir(),
    'Library/Containers/com.userscripts.macos.Userscripts-Extension/Data/Documents/scripts',
  ),
  userscriptMeta: {
    homepageURL: 'https://github.com/bluwy/npm-userscript',
    supportURL: 'https://github.com/bluwy/npm-userscript',
    namespace: 'https://greasyfork.org/',
    match: 'https://www.npmjs.com/**',
    icon: 'https://www.google.com/s2/favicons?sz=64&domain=npmjs.com',
    grant: 'none',
    'run-at': 'document-start',
  },
})
