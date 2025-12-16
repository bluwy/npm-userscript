import { addStyle } from '../utils.ts'

export const description = `\
Hide the "Beta" label in the package code tab because it has been working for around 3 years now.
`

export function runPre() {
  addStyle(`
    #package-tab-code > span > span:last-child {
      display: none;
    }
  `)
}
