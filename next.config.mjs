/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ⚠️ Use carefully (hides TS errors in production)
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  images: {
    unoptimized: Boolean(process.env.VERCEL),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.clerk.com",
      },
      {
        protocol: "https",
        hostname: "**.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "**.scdn.co",
      },
      {
        protocol: "https",
        hostname: "**.spotifycdn.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  
};

export default nextConfig;