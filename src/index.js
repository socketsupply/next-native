import Server from './server.js'

/**
 * @typedef {{}} CreateServerOptions
 */

/**
 * @param {CreateServerOptions} options
 * @return {Promise<Server>}
 */
export default async function createServer (options) {
  const server = new Server(options)
  await server.prepare()
  return server
}
