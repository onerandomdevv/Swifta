import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["res.cloudinary.com", "ui-avatars.com"],
  },
  transpilePackages: ["@twizrr/shared"],
  async rewrites() {
    return [
      {
        source: '/@:slug',
        destination: '/_at_/:slug',
      },
    ];
  },
  async redirects() {
    return [
      { source: '/buyer/catalogue', destination: '/buyer/feed', permanent: true },
      { source: '/buyer/products/:id', destination: '/p/:id', permanent: true },
      { source: '/buyer/merchants/:id', destination: '/@:id', permanent: true },
      { source: '/buyer/merchants', destination: '/merchants', permanent: true },
      { source: '/m/:slug', destination: '/@:slug', permanent: true },
      { source: '/merchant/wholesale', destination: '/merchant/products', permanent: true },
      { source: '/merchant/procurement', destination: '/merchant/products', permanent: true },
      { source: '/merchant/trade-financing', destination: '/merchant/dashboard', permanent: true },
    ];
  },
};

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    silent: true, // Suppresses all logs
    org: process.env.SENTRY_ORG || "twizrr",
    project: process.env.SENTRY_PROJECT || "twizrr-frontend",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
  },
);
