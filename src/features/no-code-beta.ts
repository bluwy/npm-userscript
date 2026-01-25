import { addStyle } from '../utils.ts'

export const description = `\
Hide the "Beta" label in the package code tab.
`

// The code tab actually still suck after all these years, so it should still be considered beta
export const disabled = true

export function runPre() {
  addStyle(`
    #package-tab-code > span > span:last-child {
      display: none;
    }
  `)
}
