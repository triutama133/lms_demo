import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Enable image optimization
    formats: ['image/webp', 'image/avif'],
    // Define device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Define image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow images from Google Cloud Storage (for uploaded content)
    domains: ['storage.googleapis.com', 'firebasestorage.googleapis.com'],
    // Enable image optimization for local images
    unoptimized: false,
  },
  // Enable experimental features for better performance
  experimental: {
    // Enable optimizePackageImports for better tree shaking
    optimizePackageImports: ['@supabase/supabase-js', '@tiptap/react', 'framer-motion'],
  },
};

export default nextConfig;
