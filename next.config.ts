import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    console.log("backendBaseUrl:", process.env.BACKEND_URL);
    return {
      // beforeFiles: run BEFORE filesystem — use for paths that must always go to backend
      beforeFiles: [
        {
          source: "/api/auth/:path*",
          destination: `${process.env.BACKEND_URL}/api/auth/:path*`,
        },
      ],
      // afterFiles: run AFTER filesystem — Next.js Route Handlers are checked first,
      // so /api/ai/course-suggest (and any future Route Handlers) work correctly.
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.BACKEND_URL}/api/:path*`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
