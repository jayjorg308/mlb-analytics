import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            // Allow images from https://media.gamblersanonymo.us/
            {
                protocol: "https",
                hostname: "media.gamblersanonymo.us",
                port: "",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
