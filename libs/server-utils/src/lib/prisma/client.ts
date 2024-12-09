import { PrismaClient } from '@/libs/shared/type_gen/.prisma/client'

// See this answer for why we use globalThis: https://stackoverflow.com/questions/77198455/making-a-variable-globally-available-to-all-modules-in-next-js-application
// Also there is this Github discussion: https://github.com/vercel/next.js/discussions/26427
declare global {
  // eslint-disable-next-line no-var
  var _instance: ExtendedPrismaClient | undefined;
  // eslint-disable-next-line no-var
  var _nonRlsInstance: PrismaClient | undefined;
}

export async function getPrismaClient(userId?: string): Promise<ExtendedPrismaClient> {
  if (!userId) {
    console.warn('No user ID provided, using non-RLS client')
    if (!globalThis._nonRlsInstance) {
      globalThis._nonRlsInstance = newPrismaClient()
      await globalThis._nonRlsInstance.$connect()
    }
    return globalThis._nonRlsInstance as ExtendedPrismaClient
  }
  if (!globalThis._instance) {
    globalThis._instance = extendClient(newPrismaClient(userId), userId)
    await globalThis._instance.$connect()
  }
  return globalThis._instance as ExtendedPrismaClient
}

export type ExtendedPrismaClient = Awaited<ReturnType<typeof extendClient>>

function newPrismaClient(userId?: string) {
  console.log('newPrismaClient', userId)
  const datasourceUrl = process.env.SUPABASE_PRISMA_URL
  if (!datasourceUrl) {
    throw new Error('SUPABASE_PRISMA_URL is not set')
  }
  return new PrismaClient({ datasourceUrl })
}

function extendClient(client: PrismaClient, userId: string) {
  const extendedClient = client.$extends({
    name: 'SupabaseRowLevelSecurity',
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            const [, result] = await client.$transaction([
              client.$executeRaw`SELECT set_config('app.user_id', ${userId}, TRUE)`,
              query(args),
            ])
            return result
          } catch (e) {
            console.error(e)
            throw new Error('Not authorized')
          }
        },
      },
    },
  })
  return extendedClient
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
