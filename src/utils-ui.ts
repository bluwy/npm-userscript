import { computePosition, shift, offset } from '@floating-ui/dom'
import { addStyle } from './utils.ts'

const infoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14"><!--! Font Awesome Pro 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" fill="currentColor"/></svg>`
const warningSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14"><!--! Font Awesome Pro 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" fill="currentColor"/></svg>`
const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14"><!--! Font Awesome Pro 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" fill="currentColor"/></svg>`

export function createPillElement(text: string): HTMLSpanElement {
  const pill = document.createElement('span')
  pill.className = 'pill'
  pill.textContent = text
  return pill
}

let addedPackageLabelStyle = false
export function addPackageLabelStyle() {
  if (addedPackageLabelStyle) return
  addedPackageLabelStyle = true
  addStyle(`
    .npm-userscript-package-label {
      display: inline-flex;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: bold;
      cursor: pointer;
      border-style: solid;
      border-width: 1px;
      margin-left: 12px;
      gap: 3px;
      align-items: center;
      padding: 2px 4px;
    }
    .npm-userscript-package-label.info {
      color: #004085;
      background-color: #cce5ff;
      border-color: #b8daff;
    }
    .npm-userscript-package-label.warning {
      color: #856404;
      background-color: #ffe76a;
      border-color: #d4c150;
    }
    .npm-userscript-package-label.error {
      color: #721c24;
      background-color: #f8d7da;
      border-color: #f5c6cb;
    }

    /* More spacing if no dts icon */
    span + .npm-userscript-package-label {
      margin-left: 16px;
    }
  `)
}

export function addPackageLabel(text: string, type: 'info' | 'warning' | 'error') {
  const titleEl = document.querySelector('#top h1')
  if (!titleEl) throw new Error('Could not find package title element')

  const svg = type === 'info' ? infoSvg : type === 'warning' ? warningSvg : errorSvg

  const label = document.createElement('button')
  label.className = `npm-userscript-package-label ${type}`
  label.innerHTML = svg + text
  titleEl.appendChild(label)
  return label
}

export interface ComputeFloatingUIOptions {
  onBeforeOpen?: () => void | Promise<void>
}

export function computeFloatingUI(
  ref: HTMLElement,
  floating: HTMLElement,
  options?: ComputeFloatingUIOptions,
) {
  let manualOpened = false

  async function open() {
    await options?.onBeforeOpen?.()

    // Needs to be displayed to compute position
    floating.style.display = 'block'

    const computed = await computePosition(ref, floating, {
      placement: 'bottom-start',
      middleware: [offset(6), shift({ padding: 5 })],
    })

    floating.style.left = `${computed.x}px`
    floating.style.top = `${computed.y}px`
  }
  function close() {
    if (manualOpened) return
    // Delay hiding if the mouse enters the floating element
    setTimeout(() => {
      if (floating.matches(':hover') || floating.matches(':focus-within')) return
      floating.style.display = ''
    }, 100)
  }

  ;[
    ['mouseenter', open],
    ['mouseleave', close],
    ['focus', open],
    ['blur', close],
  ].forEach(([event, listener]) => {
    // @ts-expect-error
    ref.addEventListener(event, listener)
  })
  ref.addEventListener('click', () => {
    manualOpened = !manualOpened
    manualOpened ? open() : close()
  })
  // close on outside click
  document.addEventListener('click', (event) => {
    if (!ref.contains(event.target as Node) && !floating.contains(event.target as Node)) {
      manualOpened = false
      close()
    }
  })
}
