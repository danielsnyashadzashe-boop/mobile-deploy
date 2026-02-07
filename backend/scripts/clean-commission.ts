import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clean() {
  try {
    await prisma.commissionSetting.deleteMany({})
    console.log('✅ Cleaned commission settings')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clean()
