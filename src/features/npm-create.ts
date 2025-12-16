import { getPackageName } from '../utils.ts'

export const description = `\
If the package is named \`create-*\`, change the suggested install command in the sidebar as
\`npm create *\` instead of \`npm install create-*\`.
`

export function run() {
  if (!location.pathname.startsWith('/package/')) return

  const packageName = getPackageName()
  if (!packageName) return

  let createPackageName: string | undefined
  if (packageName.startsWith('create-')) {
    createPackageName = packageName
  } else if (packageName.startsWith('@') && packageName.includes('/create-')) {
    createPackageName = packageName.replace('/create-', '/')
  } else {
    return
  }

  const codeBlock = document.querySelector('[aria-label="Package sidebar"] code')
  if (!codeBlock) return

  codeBlock.textContent = `npm create ${packageName.slice('create-'.length)}@latest`
  // NOTE: The copy button automatically picks up this change, so no handling needed for it
}
