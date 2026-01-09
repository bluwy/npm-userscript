import { build, getUserscriptManagerOutDir } from '@bluwy/usb'

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
    'inject-into': 'content', // required to bypass CSP
    'run-at': 'document-start',
  },
})
