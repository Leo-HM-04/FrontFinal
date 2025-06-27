/** @type {import('next').NextConfig} */
const nextConfig = {
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