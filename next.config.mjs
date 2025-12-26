/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.alias["supabase/functions"] = false;
        return config;
    },
    turbopack: {},
};

export default nextConfig;
