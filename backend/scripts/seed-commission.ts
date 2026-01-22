import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCommission() {
  try {
    console.log('🌱 Seeding commission settings...')

    // Check if there's already an active commission setting
    const existing = await prisma.commissionSetting.findFirst({
      where: { isActive: true }
    })

    if (existing) {
      console.log('✅ Active commission setting already exists:', existing.name)
      console.log(`   Rate: ${existing.percentage}%`)
      return
    }

    // Create default 5% commission setting
    const commissionSetting = await prisma.commissionSetting.create({
      data: {
        settingId: `CS-${Date.now()}`,
        name: 'Standard Commission',
        description: 'Default 5% commission on all tips',
        percentage: 5,
        isActive: true,
        appliesTo: 'TIPS',
        setByAdminName: 'System',
        setByAdminEmail: 'admin@nogada.com'
      }
    })

    console.log('✅ Commission setting created successfully!')
    console.log(`   ID: ${commissionSetting.settingId}`)
    console.log(`   Name: ${commissionSetting.name}`)
    console.log(`   Rate: ${commissionSetting.percentage}%`)
    console.log(`   Applies to: ${commissionSetting.appliesTo}`)
    console.log(`   Active: ${commissionSetting.isActive}`)
  } catch (error) {
    console.error('❌ Error seeding commission:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedCommission()
  .then(() => {
    console.log('🎉 Commission seeding completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Commission seeding failed:', error)
    process.exit(1)
  })
