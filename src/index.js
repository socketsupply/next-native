import Server from './server.js'
import './components.js'

/**
 * @typedef {{}} CreateServerOptions
 */

/**
 * @param {CreateServerOptions=} [options]
 * @return {Promise<Server>}
 */
export default async function createServer (options = null) {
  const server = new Server(options)
  await server.prepare()
  return server
}
