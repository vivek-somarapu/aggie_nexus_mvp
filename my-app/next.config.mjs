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
  images: {
    /*
     * Allow <Image> to download and optimise files from our Supabase
     * storage bucket. Next.js blocks any remote host that is not
     * explicitly listed here.
     */
    domains: ["gkzwxaiflfimhfikwfol.supabase.co"],
  },
};

export default nextConfig;
