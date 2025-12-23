import { addStyle } from '../utils'

export const description = `\
Make light mode less bright. Does not implement dark mode completely.
`

export function runPre() {
  const white = '#e9e9e9'
  const whiteDarker = '#e0e0e0'
  addStyle(`
    :root {
      --bg: ${white};
      --background-color: ${white};
      --code-bg: ${whiteDarker};
    }
    .bg-white { background-color: ${white}; }
    table tr th, table tr td { background-color: ${white} !important; }
    table tr:nth-child(2n) td { background-color: #dfdfdf !important; }
  `)
}
