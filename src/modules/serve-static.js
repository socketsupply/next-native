/**
 * @type {typeof import('socket:mime')}
 */
const mime = require('socket:mime')

module.exports = {
  /**
   * @param {import('socket:http').IncomingMessage} req
   * @param {import('socket:http').ServerResponse} res
   * @param {string} path
   * @param {object=} opts
   */
  async serveStatic (req, res, path, opts) {
    const { method, url } = req
    const headers = new Headers(Object.entries(req.getHeaders()))
    let response = null
    response = await fetch(url, { headers, method })

    if (!response.ok) {
      response = await fetch(`/public/${url}`, { headers, method })
    }

    if (response.ok) {
      res.statusCode = response.status
      const arrayBuffer = await response.arrayBuffer()
      res.write(arrayBuffer)
    }

    res.end()
  },

  getContentType (extension) {
    const results = mime.lookupSync(extension)
    if (results?.length) {
      return results[0].type
    }
  },

  getExtension (contentType) {
    const results = mime.lookupSync(contentType)
    if (results?.length) {
      return results[0].name
    }
  }
}
