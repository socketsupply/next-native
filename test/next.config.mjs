/** @type {import('next').NextConfig} */
export default {
  basePath: '/app',
  output: 'standalone',
  experimental: {
    esmExternals: true,
    serverComponentsExternalPackages: ['socket:fs/promises']
  },

  webpack (config, ctx) {
    config.externals ||= []
    config.externals.push(({ context, request }, callback) => {
      if (/^socket:/.test(request)) {
        return callback(null, 'module ' + request)
      }
      return callback()
    })

    return config
  }
}
