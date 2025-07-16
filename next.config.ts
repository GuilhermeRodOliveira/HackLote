/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assetsdelivery.eldorado.gg',
        port: '',
        pathname: '/v7/_assets_/icons/v21/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com', // ✅ Adicionado para evitar o erro de imagem
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
