/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns = [];
remotePatterns.push(
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: '**.supabase.co',
    pathname: '/storage/v1/object/**',
  },
  {
    protocol: 'https',
    hostname: 'qliving.com',
    pathname: '/**',
  }
);
if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    remotePatterns.push({
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: url.port,
      pathname: '/storage/v1/object/**',
    });
  } catch {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is invalid; remote image optimization is disabled.');
  }
}

const nextConfig = {
  experimental: {
    inlineCss: true,
    staticGenerationRetryCount: 2,
    staticGenerationMaxConcurrency: 4,
    staticGenerationMinPagesPerWorker: 200,
  },
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 75, 85],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
