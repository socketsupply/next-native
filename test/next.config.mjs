/** @type {import('next').NextConfig} */
export default {
  basePath: '/app',
  output: 'standalone',
  experimental: { esmExternals: true },
  webpack (config, ctx) {
    config.externals ||= []
    config.externals.push(({ context, request }, callback) => {
      if (/^socket:/.test(request)) {
        return callback(null, `(function () { try { return globalThis.require('${request}') } catch { return {} } }())`)
      }
      return callback()
    })

    return config
  }
}
