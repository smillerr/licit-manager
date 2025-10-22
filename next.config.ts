/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración actualizada para Turbopack
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Configuración para el límite de tamaño del body parser
  serverRuntimeConfig: {
    // Límite para API routes (50MB)
    apiBodySizeLimit: '50mb',
  },
  publicRuntimeConfig: {
    // Configuraciones públicas si las necesitas
  },

  // Configuración para manejar archivos grandes en API routes
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
    externalResolver: true,
  },

  // Configuración para paquetes externos del servidor
  serverExternalPackages: ['formidable'],
  
 

}

module.exports = nextConfig