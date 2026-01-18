import { computePosition, shift, offset } from '@floating-ui/dom'
import { addStyle } from './utils.ts'

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
      border-style: solid;
      border-width: 1px;
      margin-left: 12px;
      gap: 3px;
      align-items: center;
      padding: 2px 4px;
      letter-spacing: normal;
    }
    button.npm-userscript-package-label {
      cursor: pointer;
    }
    .npm-userscript-package-label-info {
      color: #004085;
      background-color: #cce5ff;
      border-color: #b8daff;
    }
    .npm-userscript-package-label-warning {
      color: #856404;
      background-color: #ffe76a;
      border-color: #d4c150;
    }
    .npm-userscript-package-label-error {
      color: #721c24;
      background-color: #f8d7da;
      border-color: #f5c6cb;
    }
  `)
}

const PACKAGE_LABEL_ORDER = {
  'show-types-label': 10,
  'show-binary-label': 20,
  'module-replacements': 30,
} as const

const insertedLabels: HTMLElement[] = []

export function addPackageLabel(
  orderKey: keyof typeof PACKAGE_LABEL_ORDER,
  innerHtml: string,
  type: 'info' | 'warning' | 'error' = 'info',
  el: 'span' | 'button' = 'span',
): HTMLElement {
  const order = PACKAGE_LABEL_ORDER[orderKey]
  const titleEl = document.querySelector('#top h1')
  if (!titleEl) throw new Error('Could not find package title element')

  const label = document.createElement(el)
  label.className = `npm-userscript-package-label npm-userscript-package-label-${type}`
  label.innerHTML = innerHtml
  label.dataset.order = order.toString()

  // Insert in order
  let inserted = false
  for (let i = 0; i < insertedLabels.length; i++) {
    const insertedLabel = insertedLabels[i]
    const insertedOrder = Number(insertedLabel.dataset.order)
    if (order < insertedOrder) {
      titleEl.insertBefore(label, insertedLabel)
      insertedLabels.splice(i, 0, label)
      inserted = true
      return label
    }
  }
  if (!inserted) {
    titleEl.appendChild(label)
    insertedLabels.push(label)
  }

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
