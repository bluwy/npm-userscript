import { html, signal } from 'uhtml'
import { allFeatures } from './all-features.ts'

// NOTE: We use localStorage since it's sync and allow us to inject styles as soon as possible,
// which prevents CLS. This works well enough since this script works for npmjs.com only, but its
// state may be lost if the user clears site data.

interface LocalStorageStore<T> {
  get(): T
  set(value: T): void
  reset(): void
}

function localStorageStore<T>(key: string, defaultValue?: T): LocalStorageStore<T> {
  const store: LocalStorageStore<T> = {
    get() {
      const v = localStorage.getItem(key)
      if (v) return JSON.parse(v)
      if (defaultValue != null) {
        store.reset()
        return JSON.parse(JSON.stringify(defaultValue))
      }
    },
    set(value: T) {
      localStorage.setItem(key, JSON.stringify(value))
    },
    reset() {
      if (defaultValue != null) {
        store.set(defaultValue)
      } else {
        localStorage.removeItem(key)
      }
    },
  }

  return store
}

export const featureSettings = Object.fromEntries(
  Object.entries(allFeatures).map(([name, feature]) => {
    return [
      name,
      localStorageStore(`npm-userscript:settings:feature:${name}`, feature.disabled ? false : true),
    ]
  }),
)

function Settings() {
  const featureStates = Object.fromEntries(
    Object.entries(featureSettings).map(([name, setting]) => [name, signal(setting.get())]),
  )

  return html`
    <div id="npm-userscript-settings" @click=${(e: Event) => (e.currentTarget as HTMLElement).remove()}> }>
      <style>
        #npm-userscript-settings {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: 'Source Sans Pro', 'Lucida Grande', sans-serif;
        }
        #npm-userscript-settings .dialog {
          background-color: var(--background-color);
          width: 700px;
          max-width: 90vw;
          max-height: 90vh;
          padding: 16px;
          border-radius: 4px;
          overflow-y: auto;
        }
        #npm-userscript-settings h2 {
          margin: 0;
        }
        #npm-userscript-settings .features {
          font-size: 14px;
          margin: 12px 0 4px 0;
          color: var(--color-fg-muted);
        }
        #npm-userscript-settings .setting {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto auto;
          margin: 0 0 10px 0;
        }
        #npm-userscript-settings .setting > input {
          grid-area: 1 / 1 / 3 / 2;
          margin: 3px 6px 0 0;
        }
        #npm-userscript-settings .setting > span {
          grid-area: 1 / 2 / 2 / 3;
          font-weight: bold;
        }
        #npm-userscript-settings .setting > p {
          grid-area: 2 / 2 / 3 / 3; 
          margin: 4px 0 0 0;
          opacity: 0.6;
        }
        #npm-userscript-settings .footer {
          font-size: 12px;
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        #npm-userscript-settings .footer p {
          color: var(--color-fg-muted);
          margin: 0
        }
      </style>
      <div class="dialog" @click=${(e: Event) => e.stopPropagation()}>
        <h2>Npm Userscript Settings</h2>
        <p class="features">Features</p>
        ${Object.entries(featureStates).map(([name, state]) => {
          return html`
            <label class="setting" key=${name}>
              <input
                type="checkbox"
                .checked=${state.value}
                @change=${(e: Event) => {
                  const checked = (e.target as HTMLInputElement).checked
                  featureSettings[name].set(checked)
                  state.value = checked
                }}
              />
              <span>${name}</span>
              <p>${allFeatures[name].description.trim().replace(/\n/g, ' ')}</p>
            </label>
          `
        })}
        <div class="footer">
          <p class="note">(Refresh page to view changes)</p>
          <button
            @click=${() => {
              Object.entries(featureStates).forEach(([name, state]) => {
                featureSettings[name].reset()
                state.value = featureSettings[name].get()
              })
            }}
          >
            Reset to defaults 
          </button>
        </button>
      </div>
    </div>
  ` as HTMLElement
}

export function injectSettingsTrigger() {
  // Fallback to shortcut key sequence
  const button = document.createElement('button')
  button.innerHTML = 'Open Npm Userscript Settings'
  button.style.cssText =
    'font-size: 13px; border: 0px; background: none; cursor: pointer; padding: 0; opacity: 0.8;'
  button.onclick = () => document.body.append(html`<${Settings} />` as HTMLElement)

  const sidebar = document.querySelector('[aria-label="Package sidebar"]')
  sidebar?.insertAdjacentElement('beforeend', button)
}
