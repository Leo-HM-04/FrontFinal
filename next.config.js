/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  // Configuración compatible con Turbopack
  ...(isDev && {
    // Configuración simplificada para desarrollo
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Configuración básica de watch
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
          ignored: /node_modules/,
        };
      }
      return config;
    },
  }),
  
  // Configuración para optimización de imágenes
  images: {
    domains: ['localhost', 'cdn-icons-png.flaticon.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
  
  // Agregar configuración de proxy
  async rewrites() {
    return [
      {
        source: '/api/estadisticas-aprobador/:path*',
        destination: 'http://localhost:4000/api/estadisticas-aprobador/:path*',
      },
      {
        source: '/api/estadisticas/:path*',
        destination: 'http://localhost:4000/api/estadisticas/:path*',
      },
      {
        source: '/api/viaticos/mios',
        destination: 'http://localhost:4000/viaticos/mios',
      },
      {
        source: '/api/viaticos/:path*',
        destination: 'http://localhost:4000/viaticos/:path*',
      },
    ];
  },

  // Headers anti-cache para desarrollo
  async headers() {
    if (isDev) {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
            },
          ],
        },
      ];
    }
    return [];
  },

  // Configuración de imágenes
  images: {
    minimumCacheTTL: isDev ? 0 : 60,
    unoptimized: isDev,
  },
};

module.exports = nextConfig;