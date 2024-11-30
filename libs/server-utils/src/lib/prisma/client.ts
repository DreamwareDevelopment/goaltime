import { PrismaClient } from '@/libs/shared/type_gen/.prisma/client'

export async function getPrismaClient(): Promise<PrismaClient> {
  const datasourceUrl = process.env.POSTGRES_PRISMA_URL
  if (!datasourceUrl) {
    throw new Error('POSTGRES_PRISMA_URL is not set')
  }
  const client = new PrismaClient({ datasourceUrl })
  await client.$connect()
  return client
}
