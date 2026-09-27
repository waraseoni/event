/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // `domains` is deprecated in favour of `remotePatterns`. The previous value
    // was ['localhost'], which is not even a remote host, so it bought nothing.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig
