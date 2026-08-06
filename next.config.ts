import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/sponsor",
        destination: "/activity",
        permanent: true,
      },
      {
        source: "/dashboard/maintainer",
        destination: "/activity",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

