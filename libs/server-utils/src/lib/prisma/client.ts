import { PrismaClient } from '@/libs/shared/type_gen/.prisma/client'

let _instance: ExtendedPrismaClient
export async function getPrismaClient(userId?: string): Promise<ExtendedPrismaClient> {
  if (!userId) {
    console.warn('No user ID provided, using non-RLS client')
    return newPrismaClient()
  }
  if (!_instance) {
    _instance = await newPrismaClient(userId)
  }
  return _instance
}

export type ExtendedPrismaClient = Awaited<ReturnType<typeof newPrismaClient>>

export async function newPrismaClient(userId?: string) {
  const datasourceUrl = process.env.SUPABASE_PRISMA_URL
  if (!datasourceUrl) {
    throw new Error('SUPABASE_PRISMA_URL is not set')
  }
  const client = new PrismaClient({ datasourceUrl })
  if (!userId) {
    return client
  }
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
  await extendedClient.$connect()
  return extendedClient
}
