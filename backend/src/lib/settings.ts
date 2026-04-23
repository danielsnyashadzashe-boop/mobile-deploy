import prisma from './prisma'

let cachedServiceKey: string | null = null

export async function getNetcashServiceKey(): Promise<string | null> {
  if (cachedServiceKey) return cachedServiceKey

  const setting = await prisma.settings.findUnique({
    where: { key: 'netcash_service_key' }
  })

  cachedServiceKey = setting?.value || null
  return cachedServiceKey
}
