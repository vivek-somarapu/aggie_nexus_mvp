

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript type checking during production builds
    ignoreBuildErrors: true,
  },

  // Upgraded images configuration using remotePatterns
  images: {
    /*
     * Allow <Image> to download and optimise files from our Supabase
     * storage bucket. Next.js blocks any remote host that is not
     * explicitly listed here.
     */
    domains: ["gkzwxaiflfimhfikwfol.supabase.co"],
    remotePatterns: [
      {
        //  Google user profiles
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        //  Supabase storage bucket
        protocol: 'https',
        hostname: 'gkzwxaiflfimhfikwfol.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
