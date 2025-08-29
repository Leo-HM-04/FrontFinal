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
    domains: ['localhost', 'cdn-icons-png.flaticon.com', '46.202.177.106', 'bechapra.com.mx', 'www.bechapra.com.mx'],
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '46.202.177.106',
        port: '4000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bechapra.com.mx',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.bechapra.com.mx',
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
        destination: 'http://46.202.177.106:4000/api/estadisticas-aprobador/:path*',
      },
      {
        source: '/api/estadisticas-pagador-dashboard/:path*',
        destination: 'http://46.202.177.106:4000/api/estadisticas-pagador-dashboard/:path*',
      },
      {
        source: '/api/estadisticas/:path*',
        destination: 'http://46.202.177.106:4000/api/estadisticas/:path*',
      },
      {
        source: '/api/solicitud-archivos/:path*',
        destination: 'http://46.202.177.106:4000/api/solicitud-archivos/:path*',
      },
      {
        source: '/api/viaticos/mios',
        destination: 'http://46.202.177.106:4000/viaticos/mios',
      },
      {
        source: '/api/viaticos/:path*',
        destination: 'http://46.202.177.106:4000/viaticos/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://46.202.177.106:4000/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://46.202.177.106:4000/uploads/:path*',
      },
      {
        source: '/viaticos/:path*',
        destination: 'http://46.202.177.106:4000/viaticos/:path*',
      },
    ];
  },

  // Headers anti-cache para desarrollo
  async headers() {
    const headers = [];
    
    if (isDev) {
      headers.push({
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      });
    }
    
    // Headers CORS para todas las rutas
    headers.push({
      source: '/api/(.*)',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization',
        },
      ],
    });
    
    return headers;
  },

  // Configuración de imágenes
  images: {
    minimumCacheTTL: isDev ? 0 : 60,
    unoptimized: isDev,
  },
};

module.exports = nextConfig;