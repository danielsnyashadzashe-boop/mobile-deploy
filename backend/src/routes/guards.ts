import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

/**
 * GET /api/guards/by-email/:email
 * Get guard details by email
 */
router.get('/by-email/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params
    console.log('🔍 Fetching guard by email:', email)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    })

    if (!user) {
      console.log('❌ User not found for email:', email)
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Find guard by userId
    const guard = await prisma.carGuard.findUnique({
      where: { userId: user.id },
      include: {
        location: true
      }
    })

    if (!guard) {
      console.log('❌ Guard not found for user:', user.id)
      return res.status(404).json({
        success: false,
        error: 'Guard profile not found'
      })
    }

    console.log('✅ Found guard:', guard.guardId)

    return res.json({
      success: true,
      data: {
        id: guard.id,
        guardId: guard.guardId,
        name: guard.name,
        surname: guard.surname,
        email: user.email,
        phone: guard.phone,
        balance: guard.balance || 0,
        lifetimeEarnings: guard.lifetimeEarnings || 0,
        status: guard.status,
        qrCode: guard.qrCode,
        locationId: guard.locationId,
        createdAt: guard.createdAt,
        location: guard.location
      }
    })
  } catch (error) {
    console.error('❌ Error fetching guard by email:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/guards/:guardId
 * Get guard details by guardId
 */
router.get('/:guardId', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    console.log('🔍 Fetching guard by guardId:', guardId)

    const guard = await prisma.carGuard.findUnique({
      where: { guardId },
      include: {
        user: {
          select: { id: true, email: true }
        },
        location: true
      }
    })

    if (!guard) {
      console.log('❌ Guard not found:', guardId)
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    console.log('✅ Found guard:', guard.guardId)

    return res.json({
      success: true,
      data: {
        id: guard.id,
        guardId: guard.guardId,
        name: guard.name,
        surname: guard.surname,
        email: guard.user.email,
        phone: guard.phone,
        balance: guard.balance || 0,
        lifetimeEarnings: guard.lifetimeEarnings || 0,
        status: guard.status,
        qrCode: guard.qrCode,
        locationId: guard.locationId,
        createdAt: guard.createdAt,
        location: guard.location
      }
    })
  } catch (error) {
    console.error('❌ Error fetching guard:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
