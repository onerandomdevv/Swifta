/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["res.cloudinary.com", "ui-avatars.com"],
  },
  transpilePackages: ["@hardware-os/shared"],
};

export default nextConfig;
