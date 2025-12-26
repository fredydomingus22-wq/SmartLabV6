/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.alias["supabase/functions"] = false;
        return config;
    },
};

export default nextConfig;
