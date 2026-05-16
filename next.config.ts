import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
    ],
  },
  async rewrites() {
    console.log("backendBaseUrl:", process.env.BACKEND_URL);
    return [
      {
        source: "/api/auth/:path*",
        destination: `${process.env.BACKEND_URL}/api/auth/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
