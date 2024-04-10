const util = require('node:util')
const vm = require('node:vm')

const { compileFunction } = vm

const patchedRequireSymbol = Symbol('PatchedRequireSymbol')

util.inspectSymbols.push(
  Symbol.for('edge-runtime.inspect.custom')
)

vm.runInContext = (source, context = {}) => {
  if (source.includes('webpack') || source.includes('require') || source.includes(';')) {
    source = (
      [
        ';(() => {',
        '  const timers = __runtime_require("socket:timers");',
        '  if (!globalThis.__didPatchTimers) {',
        '    globalThis.setTimeout = timers.setTimeout;',
        '    globalThis.setInterval = timers.setInterval;',
        '    globalThis.setImmediate = timers.setImmediate;',
        '    globalThis.__didPatchTimers = true;',
        '  }',
        '})();'
      ].join('\n') +
      source
    )
  }

  // XXX(@jwerle): this is a hack to detect the source from
  // `getDefineEventListenersCode() in the
  // 'https://github.com/vercel/edge-runtime/blob/main/packages/vm/src/edge-vm.ts
  // file to inject helper code to attach freely defined global functions to the
  // actually scoped 'globalThis'. We do this because our VM implementation is
  // async and runs in a completely isolated web context and realm, so we fake the VM
  // just for this server implementation
  if (source.includes('function __conditionallyUpdatesHandlerList')) {
    source += `
      Object.assign(globalThis, {
        addEventListener,
        removeEventListener,
        __conditionallyUpdatesHandlerList
      });
    `
  }

  // XXX(@jwerle): this is another hack to handle webpack files that
  // include a free '_ENTRIES' variable assignment
  if (source.includes('self.webpackChunk' && source.includes('_ENTRIES='))) {
    source = `
      if (!globalThis._ENTRIES) {
        globalThis._ENTRIES = globalThis._ENTRIES = {}
      }

      ${source}
    `
  }

  // @ts-ignore
  if (context && !context.globalThis) {
    // @ts-ignore
    context.globalThis = context
    // @ts-ignore
    context.self = context
    // @ts-ignore
    context.global = globalThis
  }

  // @ts-ignore
  context.__runtime_require = require
  // @ts-ignore
  context.require = require
  // @ts-ignore
  context.isServiceWorkerScope = true
  // @ts-ignore
  context.isSocketRuntime = true
  // @ts-ignore
  context.isWorkerScope = true

  const compiled = compileFunction(source, {
    async: false,
    context,
    scope: ['globalThis']
  })

  return compiled()
}

vm.runInThisContext = (source) => {
  const compiled = compileFunction(source, {
    async: false,
    context: globalThis,
    scope: ['globalThis']
  })

  return compiled()
}

vm.runInNewContext = (source) => vm.runInContext(source, {})
