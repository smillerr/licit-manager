/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  // Configuración adicional para manejar archivos grandes
  serverExternalPackages: ['formidable'],
}

module.exports = nextConfig