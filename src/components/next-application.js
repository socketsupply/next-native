/* global HTMLElement, EventTarget, Event */

/**
 * A container for event dispatched on a `NextApplicationState` instance.
 */
export class NextApplicationStateEvent extends Event {
  #data = null

  /**
   * `NextApplicationStateEvent` class constructor.
   * @param {'change'|'delete'} type
   * @param {object=} [data]
   */
  constructor (type, data = null) {
    super(type)
    this.#data = data
  }

  /**
   * A readonly reference to the data associated with this event.
   * This value may be `null`.
   * @type {any|null}
   */
  get data () {
    return this.#data
  }
}

/**
 * A container for an event dispatched on a `NextApplication` instance.
 */
export class NextApplicationEvent extends Event {
  /**
   * `NextApplicationEvent` class constructor.
   * @param {string} type
   */
  constructor (type) {
    super(type)
  }
}

/**
 * A container for a "navigation" event on a `NextApplication` instance.
 */
export class NextApplicationNavigationEvent extends NextApplicationEvent {
  #location  = null

  /**
   * `NextApplicationNavigationEvent` class constructor.
   * @param {string} type
   * @param {{ href: string }} options
   */
  constructor (type, options = null) {
    super(type)
    if (!options?.href || typeof options.href !== 'string') {
      throw new TypeError(
        `Expecting 'options.href' to be a string. Received: ${options.href}`
      )
    }

    if (
      !options.href.startsWith('.') &&
      !options.href.startsWith('/') &&
      !options.href.startsWith(globalThis.location.origin) &&
      // @ts-ignore
      URL.canParse(options.href, globalThis.location.origin)
    ) {
      throw new TypeError(
        `Expecting 'options.href' to be a relative URL. Received: ${options.href}`
      )
    }

    this.#location = new URL(options.href, globalThis.location.origin)
  }

  /**
   * A readonly reference to the location URL of this event.
   * @type {URL}
   */
  get location () {
    return this.#location
  }

  /**
   * A readonly reference to the absolute URL of this event.
   * @type {string}
   */
  get href () {
    return this.#location.href
  }
}

/**
 * A container for storing state for a `NextApplication` instance.
 */
export class NextApplicationState extends EventTarget {
  #data = new Map()
  #onchange = null

  /**
   * Level 1 'change' event accessor
   * @type {function(NextApplicationStateEvent):any?}
   */
  get onchange () { return this.#onchange }
  set onchange (onchange) {
    if (typeof this.#onchange === 'function') {
      this.removeEventListener('change', this.#onchange)
    }

    this.#onchange = null
    if (typeof onchange === 'function') {
      this.addEventListener('change', onchange)
      this.#onchange = onchange
    }
  }

  /**
   * Set a `value` for `key` in the state data. If `key` does not exist
   * or the `value` for `key` is different than the previous value for
   * `key` a 'change' event will be dispatched on the instance.
   * @param {string} key
   * @param {any} value
   * @return {NextApplicationState}
   */
  set (key, value) {
    if (key in Object.getPrototypeOf(this)) {
      throw TypeError(`Attemping to set illegal property '${key}'`)
    }

    const previous = this.#data.get(key)
    const exists = this.#data.has(key)
    this.#data.set(key, value)

    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      get: () => value,
      set: (value) => this.set(key, value)
    })

    if (!exists || (exists && previous !== value)) {
      this.dispatchEvent(new NextApplicationStateEvent('change', {
        key,
        value
      }))
    }

    return this
  }

  /**
   * Get a value for `key` in the state data. If `key` does not exist, then
   * this function returns `null`.
   * @param {string} key
   * @return {any|null}
   */
  get (key) {
    return this.#data.get(key)
  }

  /**
   * Returns `true` if the state contains a value for `key`, otherwise `false`.
   * @param {string} key
   * @return {boolean}
   */
  has (key) {
    return this.#data.has(key)
  }

  /**
   * Deletes a value for `key` in the state data. If `key` does not exist, then
   * this function will not do anything, otherwise a 'delete' event will be
   * dispatched on the instance.
   * @param {string} key
   * @return {NextApplicationState}
   */
  delete (key) {
    if (this.#data.has(key)) {
      delete this[key]
      this.#data.delete(key)
      this.dispatchEvent(new NextApplicationStateEvent('delete', { key }))
    }

    return this
  }
}

/**
 * A Web Component that should be used to contain a Next.js Application in
 * the context of a Socket Runtime WebView. This component maintains an
 * iframe that is the isolated context of the Next.js Application.
 * @example
 * ```html
 *   <next-application href="/app/hello">
 *     <div>A loading splash view can go here...</div>
 *   </next-application>
 * ```
 */
export class NextApplication extends (globalThis.HTMLElement ?? Object) {
  /**
   * DOM Element attributes observed
   * @type {string[]}
   */
  static observedAttributes = [
    'href',
    'allow',
    'allowfullscreen',
    'allowpaymentrequest',
    'csp',
    'loading',
    'height',
    'width',
    'name',
    'referrerpolicy'
  ]

  /**
   * A record of default attributes and their values.
   * @type {Record<string, string>}
   */
  static defaultAttributes = {
    scrolling: 'auto',
    loading: 'eager',
    height: 'auto',
    width: 'auto',
    name: globalThis.location.hostname
  }

  #state = new NextApplicationState()
  #style = null
  #frame = null
  #defaults = { children: null }
  #onstatechange = null

  /**
   * `NextApplication` class constructor.
   * @ignore
   */
  constructor () {
    super()
    this.attachShadow({ mode: 'open' })

    this.#state.addEventListener('change', () => {
      this.dispatchEvent(new NextApplicationEvent('statechange'))
    })

    this.#state.addEventListener('delete', () => {
      this.dispatchEvent(new NextApplicationEvent('statechange'))
    })

    const href = this.attributes.getNamedItem('href')

    // @ts-ignore
    if (href?.value && URL.canParse(href.value, globalThis.location.origin)) {
      const url = new URL(href.value, globalThis.location.origin)
      this.#state.set('href', url.href)
    }

    this.#defaults.children = this.children

    // component style
    this.#style = globalThis.document.createElement('style')
    this.#style.textContent = `
      :host {
        display: block;
        margin: 0;
        padding: 0;
        width: 100%;
      }

      iframe {
        border: 0;
        display: block;
        position: absolute;
        height: 100%;
        left: 0px;
        top: 0px;
        width: 100%
      }
    `

    // component fraame
    this.#frame = globalThis.document.createElement('iframe')

    for (const attributeName of NextApplication.observedAttributes) {
      // ignore
      if (attributeName === 'href') {
        continue
      }

      const attribute = this.attributes.getNamedItem(attributeName)
      if (attribute) {
        this.#frame.setAttributeNode(attribute)
      }
    }

    for (const attributeName in NextApplication.defaultAttributes) {
      const attributeValue = NextApplication.defaultAttributes[attributeName]
      this.#frame.setAttribute(attributeName, attributeValue)
    }

    this.#frame.setAttribute('frameborder', 0)
  }

  /**
   * Level 1 'statechange' event accessor
   * @type {function(NextApplicationEvent):any?}
   */
  get onstatechange () { return this.#onstatechange }
  set onstatechange (onstatechange) {
    if (typeof this.#onstatechange === 'function') {
      this.removeEventListener('statechange', this.#onstatechange)
    }

    this.#onstatechange = null
    if (typeof onstatechange === 'function') {
      this.addEventListener('statechange', onstatechange)
      this.#onstatechange = onstatechange
    }
  }

  /**
   * A readonly reference to the `NextApplicationState` instance
   * @type {NextApplicationState}
   */
  get state () {
    return this.#state
  }

  /**
   * An accessor for getting and setting the application `href` value.
   * @type {string?}
   */
  get href () { return this.attributes.getNamedItem('href')?.value ?? null }
  set href (href) {
    this.setAttribute('href', href)
  }

  /**
   * @ignore
   * @private
   */
  connectedCallback () {
    this.render()
  }

  /**
   * @ignore
   * @private
   * @param {string} name
   * @param {string} _
   * @param {string} newValue
   */
  attributeChangedCallback (name, _, newValue) {
    if (name === 'href') {
      // @ts-ignore
      if (!URL.canParse(newValue, globalThis.location.origin)) {
        throw new TypeError(
          `Expecting 'href' to be a relative URL. Received: ${newValue}`
        )
      }

      const href = new URL(newValue, globalThis.location.origin).href
      const event = new NextApplicationNavigationEvent('navigation', { href })

      this.#state.set(name, href)
      this.dispatchEvent(event)
    } else {
      this.#frame.setAttribute(name, newValue)
    }

    this.render()
  }

  navigate (href) {
    if (href instanceof URL) {
      href = String(href)
    }

    if (!href || typeof href !== 'string') {
      throw new TypeError(
        `Expecting 'href' to be a string. Received: ${href}`
      )
    }

    if (
      !href.startsWith('.') &&
      !href.startsWith('/') &&
      !href.startsWith(globalThis.location.origin) &&
      // @ts-ignore
      URL.canParse(href, globalThis.location.origin)
    ) {
      throw new TypeError(
        `Expecting 'href' to be a relative URL. Received: ${href}`
      )
    }

    this.href = new URL(href, globalThis.location.origin).href
  }

  /**
   * @ignore
   * @private
   */
  render () {
    const href = this.#state.get('href')

    if (href && this.#frame.src === href) {
      return
    }

    this.shadowRoot.innerHTML = ''
    this.shadowRoot.appendChild(this.#style)

    if (href) {
      this.#frame.src = href
      this.#frame.style.visibility = 'hidden'
      this.shadowRoot.append(...this.#defaults.children)
      this.shadowRoot.appendChild(this.#frame)
      this.#frame.onload = () => {
        for (const child of this.#defaults.children) {
          child.parentNode?.removeChild(child)
        }
        this.#frame.style.visibility = ''
        this.dispatchEvent(new NextApplicationEvent('load'))
      }
    } else {
      this.shadowRoot.append(...this.#defaults.children)
    }
  }
}

export default NextApplication
