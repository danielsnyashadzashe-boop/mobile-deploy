import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

/**
 * Generate a unique 6-digit linking code
 */
const generateLinkingCode = async (): Promise<string> => {
  let code: string
  let isUnique = false

  while (!isUnique) {
    code = Math.floor(100000 + Math.random() * 900000).toString()
    const existing = await prisma.carGuard.findFirst({
      where: { linkingCode: code }
    })
    isUnique = !existing
  }

  return code!
}

/**
 * POST /api/mobile/link-account
 * Link Clerk user to guard profile using 6-digit code
 */
router.post('/link-account', async (req: Request, res: Response) => {
  try {
    const { linkingCode, clerkUserId, clerkEmail } = req.body

    console.log('🔗 Linking account request:', { linkingCode, clerkUserId, clerkEmail })

    if (!linkingCode || linkingCode.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid linking code format. Must be 6 digits.'
      })
    }

    if (!clerkUserId) {
      return res.status(400).json({
        success: false,
        error: 'Clerk user ID is required'
      })
    }

    // Check if this Clerk user is already linked to a guard
    const existingLink = await prisma.carGuard.findFirst({
      where: { clerkUserId: clerkUserId },
      include: {
        location: {
          select: { id: true, name: true, address: true }
        }
      }
    })

    if (existingLink) {
      console.log('✅ User already linked to guard:', existingLink.guardId)
      return res.json({
        success: true,
        alreadyLinked: true,
        data: {
          id: existingLink.id,
          guardId: existingLink.guardId,
          name: existingLink.name,
          surname: existingLink.surname,
          fullName: `${existingLink.name} ${existingLink.surname}`,
          email: existingLink.clerkEmail,
          phone: existingLink.phone,
          balance: existingLink.balance || 0,
          totalEarnings: existingLink.lifetimeEarnings || 0,
          qrCodeUrl: existingLink.qrCodeUrl,
          status: existingLink.status,
          location: existingLink.location
        }
      })
    }

    // Find guard by linking code
    const guard = await prisma.carGuard.findFirst({
      where: {
        linkingCode: linkingCode,
        status: 'ACTIVE',
        clerkUserId: null  // Not yet linked
      },
      include: {
        location: {
          select: { id: true, name: true, address: true }
        }
      }
    })

    if (!guard) {
      console.log('❌ Invalid linking code or already used:', linkingCode)
      return res.status(404).json({
        success: false,
        error: 'Invalid linking code or code already used'
      })
    }

    // Check if code has expired
    if (guard.linkingCodeExpiry && new Date() > guard.linkingCodeExpiry) {
      console.log('❌ Linking code expired:', linkingCode)
      return res.status(400).json({
        success: false,
        error: 'Linking code has expired. Please contact your manager for a new code.'
      })
    }

    // Link the Clerk user to this guard
    const updatedGuard = await prisma.carGuard.update({
      where: { id: guard.id },
      data: {
        clerkUserId: clerkUserId,
        clerkEmail: clerkEmail,
        linkedAt: new Date(),
        // Clear the linking code after successful link
        linkingCode: null,
        linkingCodeExpiry: null
      },
      include: {
        location: {
          select: { id: true, name: true, address: true }
        }
      }
    })

    console.log('✅ Account linked successfully:', updatedGuard.guardId)

    res.json({
      success: true,
      data: {
        id: updatedGuard.id,
        guardId: updatedGuard.guardId,
        name: updatedGuard.name,
        surname: updatedGuard.surname,
        fullName: `${updatedGuard.name} ${updatedGuard.surname}`,
        email: clerkEmail,
        phone: updatedGuard.phone,
        balance: updatedGuard.balance || 0,
        totalEarnings: updatedGuard.lifetimeEarnings || 0,
        qrCodeUrl: updatedGuard.qrCodeUrl,
        status: updatedGuard.status,
        location: updatedGuard.location
      }
    })
  } catch (error) {
    console.error('❌ Error linking account:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to link account'
    })
  }
})

/**
 * GET /api/mobile/check-link/:clerkUserId
 * Check if Clerk user is already linked to a guard
 */
router.get('/check-link/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params

    console.log('🔍 Checking link for Clerk user:', clerkUserId)

    const guard = await prisma.carGuard.findFirst({
      where: { clerkUserId: clerkUserId },
      select: {
        id: true,
        guardId: true,
        name: true,
        surname: true,
        phone: true,
        balance: true,
        lifetimeEarnings: true,
        status: true,
        qrCodeUrl: true,
        clerkEmail: true,
        location: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    })

    if (!guard) {
      console.log('ℹ️ No guard linked to Clerk user:', clerkUserId)
      return res.json({
        success: true,
        isLinked: false
      })
    }

    console.log('✅ Found linked guard:', guard.guardId)

    res.json({
      success: true,
      isLinked: true,
      data: {
        id: guard.id,
        guardId: guard.guardId,
        name: guard.name,
        surname: guard.surname,
        fullName: `${guard.name} ${guard.surname}`,
        email: guard.clerkEmail,
        phone: guard.phone,
        balance: guard.balance || 0,
        totalEarnings: guard.lifetimeEarnings || 0,
        status: guard.status,
        qrCodeUrl: guard.qrCodeUrl,
        location: guard.location
      }
    })
  } catch (error) {
    console.error('❌ Error checking link:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check account link'
    })
  }
})

/**
 * GET /api/mobile/guard/:clerkUserId
 * Get guard profile by Clerk user ID
 */
router.get('/guard/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params

    console.log('🔍 Fetching guard for Clerk user:', clerkUserId)

    const guard = await prisma.carGuard.findFirst({
      where: { clerkUserId: clerkUserId },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true
          }
        }
      }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    res.json({
      success: true,
      data: {
        id: guard.id,
        guardId: guard.guardId,
        name: guard.name,
        surname: guard.surname,
        fullName: `${guard.name} ${guard.surname}`,
        email: guard.clerkEmail,
        phone: guard.phone,
        balance: guard.balance || 0,
        totalEarnings: guard.lifetimeEarnings || 0,
        status: guard.status,
        rating: guard.rating || 0,
        qrCodeUrl: guard.qrCodeUrl,
        bankName: guard.bankName,
        accountNumber: guard.accountNumber,
        createdAt: guard.createdAt,
        location: guard.location
      }
    })
  } catch (error) {
    console.error('❌ Error fetching guard:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guard details'
    })
  }
})

/**
 * GET /api/mobile/guard/:clerkUserId/transactions
 * Get transactions for a guard by Clerk user ID
 */
router.get('/guard/:clerkUserId/transactions', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params
    const { limit = '20', offset = '0', type } = req.query

    const guard = await prisma.carGuard.findFirst({
      where: { clerkUserId: clerkUserId },
      select: { id: true, guardId: true }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    const whereClause: any = {
      guardId: guard.id
    }

    if (type && type !== 'all') {
      whereClause.type = (type as string).toUpperCase()
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        status: true,
        reference: true,
        balance: true,
        createdAt: true
      }
    })

    const total = await prisma.transaction.count({ where: whereClause })

    res.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          ...t,
          date: t.createdAt.toISOString().split('T')[0],
          time: t.createdAt.toISOString().split('T')[1].split('.')[0]
        })),
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + transactions.length < total
        }
      }
    })
  } catch (error) {
    console.error('❌ Error fetching transactions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    })
  }
})

/**
 * GET /api/mobile/guard/:clerkUserId/payouts
 * Get payouts for a guard by Clerk user ID
 */
router.get('/guard/:clerkUserId/payouts', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params

    const guard = await prisma.carGuard.findFirst({
      where: { clerkUserId: clerkUserId },
      select: { id: true, guardId: true }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    const payouts = await prisma.payout.findMany({
      where: { guardId: guard.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json({
      success: true,
      data: payouts.map(p => ({
        id: p.id,
        voucherNumber: p.voucherNumber,
        amount: p.amount,
        type: p.type,
        status: p.status,
        requestDate: p.requestDate,
        processDate: p.processDate,
        reference: p.reference,
        bankName: p.bankName,
        accountNumber: p.accountNumber,
        meterNumber: p.meterNumber,
        phoneNumber: p.phoneNumber,
        provider: p.provider
      }))
    })
  } catch (error) {
    console.error('❌ Error fetching payouts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payouts'
    })
  }
})

/**
 * POST /api/mobile/guard/:clerkUserId/update-activity
 * Update guard's last active timestamp
 */
router.post('/guard/:clerkUserId/update-activity', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params

    await prisma.carGuard.updateMany({
      where: { clerkUserId: clerkUserId },
      data: { lastActiveAt: new Date() }
    })

    res.json({
      success: true,
      message: 'Activity updated'
    })
  } catch (error) {
    console.error('❌ Error updating activity:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update activity'
    })
  }
})

/**
 * POST /api/mobile/admin/guards/:guardId/regenerate-linking-code
 * Admin endpoint to regenerate linking code for a guard
 */
router.post('/admin/guards/:guardId/regenerate-linking-code', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params

    console.log('🔄 Regenerating linking code for guard:', guardId)

    const guard = await prisma.carGuard.findFirst({
      where: { guardId: guardId }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Generate new linking code with 30-day expiry
    const linkingCode = await generateLinkingCode()
    const linkingCodeExpiry = new Date()
    linkingCodeExpiry.setDate(linkingCodeExpiry.getDate() + 30)

    const updatedGuard = await prisma.carGuard.update({
      where: { id: guard.id },
      data: {
        linkingCode,
        linkingCodeExpiry,
        // Clear any existing Clerk link
        clerkUserId: null,
        clerkEmail: null,
        linkedAt: null
      }
    })

    console.log('✅ New linking code generated:', linkingCode)

    res.json({
      success: true,
      data: {
        guardId: updatedGuard.guardId,
        linkingCode: updatedGuard.linkingCode,
        linkingCodeExpiry: updatedGuard.linkingCodeExpiry
      }
    })
  } catch (error) {
    console.error('❌ Error regenerating linking code:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate linking code'
    })
  }
})

/**
 * POST /api/mobile/admin/guards/:guardId/unlink-mobile
 * Admin endpoint to unlink a guard's mobile app
 */
router.post('/admin/guards/:guardId/unlink-mobile', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params

    console.log('🔓 Unlinking mobile app for guard:', guardId)

    const guard = await prisma.carGuard.findFirst({
      where: { guardId: guardId }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Generate new linking code for re-linking
    const linkingCode = await generateLinkingCode()
    const linkingCodeExpiry = new Date()
    linkingCodeExpiry.setDate(linkingCodeExpiry.getDate() + 30)

    const updatedGuard = await prisma.carGuard.update({
      where: { id: guard.id },
      data: {
        clerkUserId: null,
        clerkEmail: null,
        linkedAt: null,
        linkingCode,
        linkingCodeExpiry
      }
    })

    console.log('✅ Mobile app unlinked, new code:', linkingCode)

    res.json({
      success: true,
      message: 'Mobile app unlinked successfully',
      data: {
        guardId: updatedGuard.guardId,
        linkingCode: updatedGuard.linkingCode,
        linkingCodeExpiry: updatedGuard.linkingCodeExpiry
      }
    })
  } catch (error) {
    console.error('❌ Error unlinking mobile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to unlink mobile app'
    })
  }
})

// Export the generateLinkingCode function for use in other routes
export { generateLinkingCode }
export default router
