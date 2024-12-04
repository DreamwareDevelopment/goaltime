//@ts-check

const { composePlugins, withNx } = require('@nx/next');
// @ts-expect-error PrismaPlugin type is not defined
const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin')

module.exports = {
  // @ts-expect-error just ignore the config type
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()]
    }

    return config
  },
}

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
