import { PrismaClient } from '@prisma/client'

// See this answer for why we use globalThis: https://stackoverflow.com/questions/77198455/making-a-variable-globally-available-to-all-modules-in-next-js-application
// Also there is this Github discussion: https://github.com/vercel/next.js/discussions/26427
declare global {
  // eslint-disable-next-line no-var
  var _instance: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var _nonRlsInstance: PrismaClient | undefined;
}

// TODO: RLS is not supported at the moment without transactions on every query,
// will actually use the userId when prisma / postgres supports it
// https://github.com/prisma/prisma/issues/12735
// https://github.com/prisma/prisma/issues/4303
// https://github.com/prisma/prisma/issues/5128
export async function getPrismaClient(userId?: string): Promise<PrismaClient> {
  if (!userId) {
    console.warn('No user ID provided, using non-RLS client')
    if (!globalThis._nonRlsInstance) {
      globalThis._nonRlsInstance = newPrismaClient()
      await globalThis._nonRlsInstance.$connect()
    }
    return globalThis._nonRlsInstance
  }
  if (!globalThis._instance) {
    globalThis._instance = newPrismaClient(userId)
    await globalThis._instance.$connect()
  }
  return globalThis._instance
}

function newPrismaClient(userId?: string) {
  console.log('newPrismaClient', userId)
  const datasourceUrl = process.env.MY_PRISMA_URL
  if (!datasourceUrl) {
    throw new Error('MY_PRISMA_URL is not set')
  }
  return new PrismaClient({ datasourceUrl })
}

export function cleanup() {
  console.log('Prisma cleanup')
  if (globalThis._instance) {
    globalThis._instance.$disconnect()
    globalThis._instance = undefined
  }
  if (globalThis._nonRlsInstance) {
    globalThis._nonRlsInstance.$disconnect()
    globalThis._nonRlsInstance = undefined
  }
}
