import { PrismaClient } from '@/libs/shared/type_gen/.prisma/client'

let _instance: ExtendedPrismaClient | undefined
let _nonRlsInstance: PrismaClient | undefined
export async function getPrismaClient(userId?: string): Promise<ExtendedPrismaClient> {
  if (!userId) {
    console.warn('No user ID provided, using non-RLS client')
    if (!_nonRlsInstance) {
      _nonRlsInstance = newPrismaClient()
      await _nonRlsInstance.$connect()
    }
    return _nonRlsInstance as ExtendedPrismaClient
  }
  if (!_instance) {
    _instance = extendClient(newPrismaClient(userId), userId)
    await _instance.$connect()
  }
  return _instance as ExtendedPrismaClient
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

function cleanup() {
  console.log('Prisma cleanup')
  if (_instance) {
    _instance.$disconnect()
    _instance = undefined
  }
  if (_nonRlsInstance) {
    _nonRlsInstance.$disconnect()
    _nonRlsInstance = undefined
  }
}

process.on('beforeExit', cleanup)
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
process.on('SIGUSR2', cleanup)
