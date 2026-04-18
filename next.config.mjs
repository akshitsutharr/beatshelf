/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  images: {
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: "https", hostname: "**.clerk.com" },
      { protocol: "https", hostname: "**.clerk.dev" },
      { protocol: "https", hostname: "**.scdn.co" },
      { protocol: "https", hostname: "**.spotifycdn.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://beatshelf.netlify.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;