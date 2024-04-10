import NextApplication from './components/next-application.js'

if (globalThis.document) {
  // install to globalThis
  globalThis.NextApplicationElement = NextApplication

  // register for global usaage
  globalThis.customElements.define('next-application', NextApplication)
}
