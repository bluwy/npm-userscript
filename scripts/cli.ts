import { build, getUserscriptManagerOutDir } from '@bluwy/usb'

const isDev = process.argv[2] === 'dev'

await build({
  input: 'src/index.ts',
  outDir: 'dist',
  copyOutDir: [getUserscriptManagerOutDir('Userscripts')],
  watch: isDev,
  userscriptMeta: {
    namespace: 'https://greasyfork.org/en/scripts/559139-npm-userscript',
    match: 'https://www.npmjs.com/**',
    icon: 'https://www.google.com/s2/favicons?sz=64&domain=npmjs.com',
    grant: ['GM.xmlHttpRequest'],
    connect: [
      'api.github.com',
      'cdn.jsdelivr.net',
      'registry.npmjs.org',
      isDev ? 'localhost' : 'npm-userscript.bjornlu.workers.dev',
    ],
    'inject-into': 'content', // run in isolated context
    'run-at': 'document-start',
  },
  esbuildOptions: {
    define: {
      API_URL: JSON.stringify(
        isDev ? 'http://localhost:8787' : 'https://npm-userscript.bjornlu.workers.dev',
      ),
    },
  },
})
