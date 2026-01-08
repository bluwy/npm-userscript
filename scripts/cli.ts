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
    require: 'https://openuserjs.org/src/libs/sizzle/GM_config.js',
    grant: ['GM.getValue', 'GM.setValue'],
    'inject-into': 'content', // required because we use GM apis and CSP
    'run-at': 'document-start',
  },
})
