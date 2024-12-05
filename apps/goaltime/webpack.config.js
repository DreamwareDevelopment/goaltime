// @ts-expect-error PrismaPlugin type is not defined
const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin')
// eslint-disable-next-line import/no-anonymous-default-export
export default function (config, options) {
  const { isServer } = options;
  if (isServer) {
    config.plugins = [...config.plugins, new PrismaPlugin()]
  }
  return config;
}