import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Allow the Arena live-preview host to load Next dev resources (HMR).
     NOTE: entries must be bare hostnames (no scheme) — Next matches the
     Origin hostname directly, including wildcard subdomains. */
  allowedDevOrigins: ["3000-ict6if3jy01c094o7p1gj.e2b.app", "*.e2b.app"],
};

export default nextConfig;
