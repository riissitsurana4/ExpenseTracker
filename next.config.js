
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: ['styles'], 
  },
  webpack: (config) => {
    config.resolve.alias['@'] = __dirname;
    return config;
  },
};

module.exports = nextConfig;
