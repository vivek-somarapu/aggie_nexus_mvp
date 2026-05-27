/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/accelerator/magic-link',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://axr-live.onrender.com' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent webpack from bundling these packages — they use Node.js internals
  // (pdfjs-dist workers, fs reads) that break when bundled. They run fine as
  // native Node.js modules in API routes.
  serverExternalPackages: ['pdf-parse', 'mammoth', 'pdfjs-dist'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gkzwxaiflfimhfikwfol.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "yqbxndlsxfjqhcfodvph.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
