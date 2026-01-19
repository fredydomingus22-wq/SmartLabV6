/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.alias["supabase/functions"] = false;
        return config;
    },
    transpilePackages: [
        '@supabase/ssr',
        '@supabase/supabase-js',
        '@supabase/auth-js'
    ],
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    turbopack: {},
};

export default nextConfig;
