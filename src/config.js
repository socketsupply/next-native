import location from 'socket:location'
import path from 'socket:path'

/**
 * The default Next.js configuration file name to load'
 */
export const DEFAULT_NEXT_CONFIG_FILENAME = 'next.config.mjs'

function extend (target, source) {
  if (
    (source && typeof source === 'object' && !Array.isArray(source)) &&
    (target && typeof target === 'object' && !Array.isArray(target))
  ) {
    for (const key in source) {
      if (
        (source[key] && typeof source[key] === 'object') &&
        (target[key] && typeof target[key] === 'object')
      ) {
        extend(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }

  return target
}

/**
 * @typedef {{
 *   next?: import('npm:next').NextConfig,
 *   require?: import('socket:module').RequireFunction
 * }} ConfigObject
 */

/**
 * @typedef {{
 *   filename?: string
 * }} ConfigLoadOptions
 */

/**
 * A container for Next.js configuration
 */
export class Config {
  /**
   * @type {ConfigObject}
   */
  #config = {}

  /**
   * Attempts to load configuration from the filesystem.
   * @param {string|ConfigLoadOptions=} filename
   * @param {ConfigLoadOptions=} [options]
   * @return {Promise<boolean>}
   */
  async load (filename = 'next.config.mjs', options = null) {
    if (!filename) {
      filename = DEFAULT_NEXT_CONFIG_FILENAME
    }

    if (filename && typeof filename === 'object') {
      options = filename
      filename = options.filename ?? DEFAULT_NEXT_CONFIG_FILENAME
    }

    if (!filename || typeof filename !== 'string') {
      throw new TypeError('Expecting filename to be a string')
    }

    const defaultConfig = { next: null }
    const config = { next: null }
    const url = new URL(filename, options?.origin ?? location.origin)

    if (typeof options?.require === 'function') {
      try {
        defaultConfig.next = { ...require('next/dist/server/config-shared.js').defaultConfig ?? null }
      } catch (err) {
        console.warn('Failed to load default Next.js config', err)
      }
    }

    if (options?.type === 'module' || path.extname(filename) === '.mjs') {
      try {
        const module = await import(url.href)
        config.next = module.default ?? module
      } catch (err) {
        console.debug(err)
        // TODO(@jwerle): debug()
        return false
      }
    }

    if (!config.next) {
      if (typeof options?.require === 'function') {
        try {
          config.next = require(url)
        } catch (err) {
          console.debug(err)
          // TODO(@jwerle): debug()
          return false
        }
      }
    }

    if (!config.next) {
      try {
        const response = await fetch(url)
        config.next = await response.json()
      } catch (err) {
        console.debug(err)
        // TODO(@jwerle): debug()
        return false
      }
    }

    this.set(extend(defaultConfig, config))

    return true
  }

  /**
   * Sets a new configuration object value.
   * @param {ConfigObject} config
   * @param {string=} [filename]
   */
  set (config, filename = null) {
    this.#config = {}
    this.#config.next ||= {}

    Object.assign(this.#config, config)

    const workerLocation = new URL(RUNTIME_WORKER_LOCATION)

    if (this.#config.next && typeof this.#config.next === 'object') {
      Object.assign(this.#config.next, {
        cacheMaxMemorySize: 52428800,
        configFileName: filename ?? 'next.config.mjs',
        pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
        trailingSlash: false,
        configOrigin: filename ?? 'next.config.mjs',
        cleanDistDir: true,
        assetPrefix: new URL('./', workerLocation).pathname,
        basePath: this.#config.next.basePath ?? '/',
        distDir: './.next',

        ...this.#config.next,

        useFileSystemPublicRoutes: true,
        outputFileTracing: false,
        poweredByHeader: false,
        generateEtags: false,
        optimizeFonts: false,
        swcMinify: false,
        compress: false,

        images: {
          deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
          imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
          path: `${this.#config.next.basePath ?? '/'}/_next/image`,
          loader: 'default',
          loaderFile: '',
          domains: [],
          disableStaticImages: false,
          minimumCacheTTL: 60,
          formats: ['image/webp'],
          dangerouslyAllowSVG: false,
          contentSecurityPolicy: 'script-src "none"; frame-src "none"; sandbox;',
          contentDispositionType: 'inline',
          remotePatterns: [],
          unoptimized: false,
          ...this.#config.next.images,
        },

        onDemandEntries: {
          maxInactiveAge: 60000,
          pagesBufferLength: 5
        },

        amp: {
          canonicalBase: this.#config.next.basePath ?? '/'
        },

        sassOptions: {},
        i18n: null,
        productionBrowserSourceMaps: false,
        excludeDefaultMomentLocales: true,
        serverRuntimeConfig: {},
        publicRuntimeConfig: {},
        reactProductionProfiling: false,
        reactStrictMode: null,
        httpAgentOptions: { keepAlive: true },
        staticPageGenerationTimeout: 60,
        output: 'standalone',
        modularizeImports: {
          '@mui/icons-material': { transform: '@mui/icons-material/{{member}}' },
          lodash: { transform: 'lodash/{{member}}' },
          ...this.#config.next.modularizeImports,
        }
      })

      this.#config.next.experimental ||= {}

      Object.assign(this.#config.next.experimental, {
        serverMinification: false,
        trustHostHeader: true,

        ...this.#config.next.experimental,
        serverSourceMaps: false,
        caseSensitiveRoutes: false,
        clientRouterFilter: true,
        clientRouterFilterRedirects: false,
        fetchCacheKeyPrefix: '',
        middlewarePrefetch: 'flexible',
        optimisticClientCache: true,
        manualClientBasePath: false,
        cpus: 7,
        memoryBasedWorkersCount: false,
        isrFlushToDisk: true,
        workerThreads: false,
        optimizeCss: false,
        nextScriptWorkers: false,
        scrollRestoration: false,
        externalDir: false,
        disableOptimizedLoading: false,
        gzipSize: true,
        craCompat: false,
        esmExternals: true,
        fullySpecified: false,
        swcTraceProfiling: false,
        forceSwcTransforms: false,
        largePageDataBytes: 128000,
        adjustFontFallbacks: false,
        adjustFontFallbacksWithSizeAdjust: false,
        typedRoutes: false,
        instrumentationHook: false,
        bundlePagesExternals: false,
        parallelServerCompiles: false,
        parallelServerBuildTraces: false,
        ppr: false,
        missingSuspenseWithCSRBailout: true,
        optimizePackageImports:[
          'lucide-react',
          'date-fns',
          'lodash-es',
          'ramda',
          'antd',
          'react-bootstrap',
          'ahooks',
          '@ant-design/icons',
          '@headlessui/react',
          '@headlessui-float/react',
          '@heroicons/react/20/solid',
          '@heroicons/react/24/solid',
          '@heroicons/react/24/outline',
          '@visx/visx',
          '@tremor/react',
          'rxjs',
          '@mui/material',
          '@mui/icons-material',
          'recharts',
          'react-use',
          '@material-ui/core',
          '@material-ui/icons',
          '@tabler/icons-react',
          'mui-core',
          'react-icons/ai',
          'react-icons/bi',
          'react-icons/bs',
          'react-icons/cg',
          'react-icons/ci',
          'react-icons/di',
          'react-icons/fa',
          'react-icons/fa6',
          'react-icons/fc',
          'react-icons/fi',
          'react-icons/gi',
          'react-icons/go',
          'react-icons/gr',
          'react-icons/hi',
          'react-icons/hi2',
          'react-icons/im',
          'react-icons/io',
          'react-icons/io5',
          'react-icons/lia',
          'react-icons/lib',
          'react-icons/lu',
          'react-icons/md',
          'react-icons/pi',
          'react-icons/ri',
          'react-icons/rx',
          'react-icons/si',
          'react-icons/sl',
          'react-icons/tb',
          'react-icons/tfi',
          'react-icons/ti',
          'react-icons/vsc',
          'react-icons/wi'
        ]
      })
    }

    process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(this.#config.next)
  }

  /**
   * Gets a reference to the underlying configuration object value.
   * @type {ConfigObject}
   */
  get () {
    return this.#config
  }

  /**
   * Gets the Next.js configuration object. This value may be `null`.
   * @type {import('npm:next').NextConfig}
   */
  get next () {
    return this.#config.next ?? {}
  }
}

// The default "singleton" configuration for
export default new Config()
