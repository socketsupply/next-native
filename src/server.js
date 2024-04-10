import { Deferred } from 'socket:async'
import location from 'socket:location'
import process from 'socket:process'
import http from 'socket:http'

import config, { Config } from './config.js'
import { createRequire } from './commonjs/require.js'

process.env.SOCKET_RUNTIME_HTTP_ADAPTER_SERVICE_WORKER_IGNORE_PORT_CHECK = true

// this server isn't actually listening on a port, but
// we use a port to play well with nextjs
const NEXT_HTTP_SERVER_PORT = 3000

/**
 * @typedef {{
 *   config?: import('./config.js').Config
 * }} ServerOptions
 */

/**
 * @typedef {{ filename?: string, origin?: string | URL }} ServerPrepareOptions
 */

/**
 * @typedef {{}} ServerRequestHandlerOptions
 */

/**
 * @typedef {function(
 *   import('socket:http').IncomingMessage,
 *   import('socket:http').ServerResponse
 * ):void} ServerRequestHandler
 */

/**
 * A container for Next.js Server and Socket Runtime Service Worker HTTP Server.
 */
export default class Server {
  #instance = null
  #prepared = null
  #require = null
  #server = null
  #config = null

  /**
   * `Server` class constructor.
   * @param {ServerOptions=} [options]
   */
  constructor (options = null) {
    this.#config = options?.config ?? config ?? new Config()
  }

  get prepared () {
    return this.#prepared?.promise
  }

  /**
   * A reference to the server configuration.
   * @type {import('./config.js').Config}
   */
  get config () {
    return this.#config
  }

  /**
   * A reference to the top level CommonJS module for this server.
   * @type {import('socket:module').Module?}
   */
  get module () {
    return this.#require?.module ?? null
  }

  /**
   * A reference to the top level CommonJS `require()` function for this server.
   * @type {import('socket:module').RequireFunction?}
   */
  get require () {
    return this.#require ?? null
  }

  /**
   * Prepares the server instance to be used.
   * @param {ServerPrepareOptions=} [options]
   */
  async prepare (options = null) {
    if (this.#prepared) {
      return this.#prepared.promise
    }

    // force 'production' environment for any configuration
    // and/or modules loaded with `require()` as "dev" mode just
    // will not work here
    process.env.NODE_ENV = 'production'

    this.#prepared = new Deferred()
    // create a `require()` based on the origin of the application
    this.#require = createRequire(options)

    // attempt to load user config from the filesystem
    await this.#config.load({
      ...options,
      require: this.#require
    })

    // bootstrap the vm hacks
    this.#require(new URL('./modules/vm.js', import.meta.url))

    // create next server instance with static options
    this.#instance = this.#require('next')({
      dir: options?.origin ?? location.origin,
      hostname: '0.0.0.0',
      port: NEXT_HTTP_SERVER_PORT,
      dev: false
    })

    // await for next to be prepared
    await this.#instance.prepare()
    this.#prepared.resolve()
  }

  /**
   * Starts the server.
   * @param {ServerRequestHandlerOptions=} [options]
   */
  async start (options = null) {
    await this.prepare()
    const deferred = new Deferred()
    this.#server = http.createServer(this.getRequestHandler(options))
    this.#server.listen(deferred.resolve)
    this.#server.once('error', deferred.reject)
    return deferred.promise
  }

  /**
   * Gets a request handler function for this server.
   * @param {ServerRequestHandlerOptions=} [options]
   * @return {ServerRequestHandler}
   */
  getRequestHandler (options = null) {
    // eslint-disable-next-line
    void options
    const handle = this.#instance.getRequestHandler()
    return onRequest
    function onRequest (req, res) {
      req.headers.host = '0.0.0.0'
      req.headers['x-forwarded-proto'] = 'http'
      req.headers['x-forwarded-host'] = `localhost:${NEXT_HTTP_SERVER_PORT}`
      req.headers['x-forwarded-for'] = '127.0.0.1'
      handle(req, res)
    }
  }
}
