/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para desarrollo
  allowedDevOrigins: [
    'localhost:3000',
    '192.168.1.10:3000',
    '127.0.0.1:3000'
  ],

  // Optimizaciones de compilación
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Optimizaciones de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Configuración de compresión
  compress: true,
  
  // Configuración de webpack simplificada
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Headers para optimización
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  
  // Redirecciones
  async redirects() {
    return [
      {
        source: '/usuarios',
        destination: '/dashboard/admin/usuarios',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;