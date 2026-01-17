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
    grant: ['GM.xmlHttpRequest'],
    connect: ['cdn.jsdelivr.net', 'registry.npmjs.org'],
    'inject-into': 'content', // run in isolated context
    'run-at': 'document-start',
  },
})
