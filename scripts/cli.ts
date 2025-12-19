import { build, getUserscriptManagerOutDir } from './build.ts'

await build({
  input: 'src/index.ts',
  outDir: 'dist',
  copyOutDir: [getUserscriptManagerOutDir('Userscripts')],
  watch: process.argv[2] === 'dev',
  userscriptMeta: {
    namespace: 'https://greasyfork.org/en/scripts/559139-npm-userscript',
    match: 'https://www.npmjs.com/**',
    icon: 'https://www.google.com/s2/favicons?sz=64&domain=npmjs.com',
    grant: 'none',
    'run-at': 'document-start',
  },
})
