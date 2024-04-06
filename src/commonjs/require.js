import { Module } from 'socket:module'
import location from 'socket:location'
import path from 'socket:path'

import config from '../config.js'

/**
 * @typedef {{
 *   origin?: string | URL
 * }} CreateRequireOptions
 */

/**
 * @typedef {import('socket:commonjs/require').RequireFunction} RequireFunction
 */

/**
 * Creates a CommonJS `require()` function suitable for loading the 'next'
 * module and subsequent dependencies.
 * @param {CreateRequireOptions=} [options]
 * @return {RequireFunction}
 */
export function createRequire (options) {
  const origin = options?.origin ?? location.origin
  const distDir = config.next.distDir ?? './next/'

  Module.resolvers.push((specifier, ctx, next) => {
    if (specifier.startsWith(`./${distDir}`)) {
      return new URL(specifier, origin).href
    } else if (specifier.startsWith(distDir)) {
      return new URL(`./${specifier}`, origin).href
    }

    if (specifier.startsWith('.') && path.basename(specifier).startsWith('serve-static')) {
      if (path.basename(ctx.id) === 'router-server.js') {
        return new URL('../modules/serve-static.js', import.meta.url).href
      }
    }

    return next(specifier)
  })

  return Module.createRequire(origin)
}

export default { createRequire }
