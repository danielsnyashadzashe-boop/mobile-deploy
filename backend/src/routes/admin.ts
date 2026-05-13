import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { notifyGuard } from '../lib/notifications'

const router = Router()

// ─── Guard listing ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/guards
 * List guards with optional filters (status, search, limit, page)
 */
router.get('/guards', async (req: Request, res: Response) => {
  try {
    const { status, search, limit = '100', page = '1' } = req.query
    const take = parseInt(limit as string)
    const skip = (parseInt(page as string) - 1) * take

    const where: any = {}
    if (status && status !== 'all') where.status = String(status).toUpperCase()
    if (search) {
      const s = String(search)
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { surname: { contains: s, mode: 'insensitive' } },
        { guardId: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
      ]
    }

    const [guards, total] = await Promise.all([
      prisma.carGuard.findMany({
        where,
        orderBy: { name: 'asc' },
        take,
        skip,
        select: {
          id: true,
          guardId: true,
          name: true,
          surname: true,
          phone: true,
          status: true,
          balance: true,
          location: { select: { name: true, city: true } },
        },
      }),
      prisma.carGuard.count({ where }),
    ])

    return res.json({ success: true, data: { guards, total } })
  } catch (error) {
    console.error('❌ Error fetching guards:', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch guards' })
  }
})

// ─── Payout admin endpoints ──────────────────────────────────────────────────

/**
 * GET /api/admin/payout-requests
 * List payout requests (optionally filtered by status)
 */
router.get('/payout-requests', async (req: Request, res: Response) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query

    const where: any = {}
    if (status && status !== 'all') where.status = String(status).toUpperCase()

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          guard: {
            select: {
              guardId: true,
              name: true,
              surname: true,
              phone: true,
              bankName: true,
              accountNumber: true,
              branchCode: true,
              accountType: true,
              balance: true,
            },
          },
        },
      }),
      prisma.payout.count({ where }),
    ])

    return res.json({
      success: true,
      data: {
        payouts: payouts.map(p => ({
          id: p.id,
          payoutId: p.payoutId || `PAY-${p.id.slice(-8).toUpperCase()}`,
          amount: p.amount,
          status: p.status,
          method: p.method,
          notes: p.notes,
          adminNotes: p.adminNotes,
          rejectionReason: p.rejectionReason,
          requestedAt: p.createdAt.toISOString(),
          approvedAt: p.approvedAt?.toISOString() || null,
          processedAt: p.processedAt?.toISOString() || null,
          completedAt: p.completedAt?.toISOString() || null,
          guard: p.guard,
        })),
        total,
      },
    })
  } catch (error) {
    console.error('❌ Error fetching payout requests:', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch payout requests' })
  }
})

/**
 * POST /api/admin/payout-requests/:id/approve
 * Approve a payout — deduct from guard balance, notify guard
 */
router.post('/payout-requests/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { adminId, adminNotes } = req.body

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: { guard: { select: { id: true, balance: true, guardId: true } } },
    })

    if (!payout) return res.status(404).json({ success: false, error: 'Payout request not found' })
    if (payout.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: `Cannot approve a payout with status: ${payout.status}` })
    }

    const guard = payout.guard
    if (guard.balance < payout.amount) {
      return res.status(400).json({ success: false, error: 'Guard has insufficient balance' })
    }

    const newBalance = guard.balance - payout.amount

    // Update payout + deduct balance atomically
    await prisma.$transaction([
      prisma.payout.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: adminId || null,
          adminNotes: adminNotes || null,
          processedAt: new Date(),
        },
      }),
      prisma.carGuard.update({
        where: { id: guard.id },
        data: { balance: newBalance },
      }),
      prisma.transaction.create({
        data: {
          guardId: guard.id,
          type: 'PAYOUT',
          amount: -payout.amount,
          description: `Payout approved: R${payout.amount.toFixed(2)}`,
          status: 'COMPLETED',
          balance: newBalance,
          reference: payout.payoutId || id,
        },
      }),
    ])

    await notifyGuard(
      guard.id,
      'PAYOUT_APPROVED',
      'Payout Approved',
      `Your payout of R${payout.amount.toFixed(2)} has been approved and is being processed.`,
      { payoutId: payout.payoutId || id, amount: payout.amount }
    )

    console.log('✅ Payout approved:', id, 'Guard:', guard.guardId)
    return res.json({ success: true, message: 'Payout approved successfully' })
  } catch (error) {
    console.error('❌ Error approving payout:', error)
    return res.status(500).json({ success: false, error: 'Failed to approve payout' })
  }
})

/**
 * POST /api/admin/payout-requests/:id/reject
 * Reject a payout request
 */
router.post('/payout-requests/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { adminId, reason } = req.body

    if (!reason) return res.status(400).json({ success: false, error: 'Rejection reason is required' })

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: { guard: { select: { id: true, guardId: true } } },
    })

    if (!payout) return res.status(404).json({ success: false, error: 'Payout request not found' })
    if (payout.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: `Cannot reject a payout with status: ${payout.status}` })
    }

    await prisma.payout.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: adminId || null,
      },
    })

    await notifyGuard(
      payout.guard.id,
      'PAYOUT_REJECTED',
      'Payout Not Approved',
      `Your payout of R${payout.amount.toFixed(2)} was not approved. Reason: ${reason}`,
      { payoutId: payout.payoutId || id, amount: payout.amount, reason }
    )

    console.log('✅ Payout rejected:', id, 'Guard:', payout.guard.guardId)
    return res.json({ success: true, message: 'Payout rejected' })
  } catch (error) {
    console.error('❌ Error rejecting payout:', error)
    return res.status(500).json({ success: false, error: 'Failed to reject payout' })
  }
})

/**
 * POST /api/admin/payout-requests/:id/ewallet-sent
 * Mark payout as completed/sent — notify guard to check their messages
 */
router.post('/payout-requests/:id/ewallet-sent', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { adminId, notes } = req.body

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: { guard: { select: { id: true, guardId: true } } },
    })

    if (!payout) return res.status(404).json({ success: false, error: 'Payout request not found' })
    if (!['APPROVED', 'PROCESSING'].includes(payout.status)) {
      return res.status(400).json({ success: false, error: `Cannot mark as sent a payout with status: ${payout.status}` })
    }

    await prisma.payout.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        adminNotes: notes || payout.adminNotes,
        approvedBy: adminId || payout.approvedBy,
      },
    })

    await notifyGuard(
      payout.guard.id,
      'PAYOUT_SENT',
      'Payment Sent',
      `Your payout of R${payout.amount.toFixed(2)} has been sent. Check your messages.`,
      { payoutId: payout.payoutId || id, amount: payout.amount }
    )

    console.log('✅ Payout marked as sent:', id, 'Guard:', payout.guard.guardId)
    return res.json({ success: true, message: 'Payout marked as sent' })
  } catch (error) {
    console.error('❌ Error marking payout as sent:', error)
    return res.status(500).json({ success: false, error: 'Failed to update payout' })
  }
})

/**
 * POST /api/admin/registration/:id/approve
 * Approve a registration and create CarGuard record
 */
router.post('/registration/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    console.log('📋 Approving registration:', id)

    // Find registration
    const registration = await prisma.registration.findUnique({
      where: { id }
    })

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      })
    }

    if (registration.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'Registration already approved'
      })
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: registration.email }
    })

    if (!user) {
      console.log('Creating new user for:', registration.email)
      user = await prisma.user.create({
        data: {
          email: registration.email,
          username: registration.email,
          password: 'clerk_managed',
          role: 'GUARD',
          isVerified: true,
          emailVerified: true
        }
      })
    }

    // Check if CarGuard already exists
    const existingGuard = await prisma.carGuard.findUnique({
      where: { userId: user.id }
    })

    if (existingGuard) {
      return res.status(400).json({
        success: false,
        error: 'CarGuard profile already exists for this user'
      })
    }

    // Generate unique guardId
    const guardId = `GRD${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Generate QR code identifier
    const qrCode = `QR${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Generate NFC tag
    const nfcTag = `NFC${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create CarGuard record
    const guard = await prisma.carGuard.create({
      data: {
        userId: user.id,
        guardId: guardId,
        name: registration.name,
        surname: registration.surname,
        phone: registration.phone,
        alternatePhone: registration.alternatePhone,
        idNumber: registration.idNumber || `PASSPORT-${registration.passportNumber}`,
        passportNumber: registration.passportNumber,
        balance: 0,
        lifetimeEarnings: 0,
        qrCode: qrCode,
        nfcTag: nfcTag,
        locationId: registration.locationId,
        managerId: registration.managerId,
        status: 'ACTIVE',
        bankName: registration.bankName,
        accountNumber: registration.accountNumber,
        accountHolder: registration.accountHolder,
        branchCode: registration.branchCode,
        emergencyContact: registration.emergencyName,
        emergencyPhone: registration.emergencyPhone
      }
    })

    // Update registration status
    await prisma.registration.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: null, // TODO: Get actual admin ID from auth
        guardId: guardId,
        guardCreatedAt: new Date()
      }
    })

    console.log('✅ Registration approved, CarGuard created:', guardId)

    return res.json({
      success: true,
      data: {
        guard: {
          id: guard.id,
          guardId: guard.guardId,
          name: guard.name,
          surname: guard.surname,
          email: user.email,
          status: guard.status,
          qrCode: guard.qrCode
        }
      }
    })
  } catch (error) {
    console.error('❌ Error approving registration:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/admin/registration/:id/reject
 * Reject a registration
 */
router.post('/registration/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    console.log('📋 Rejecting registration:', id)

    const registration = await prisma.registration.findUnique({
      where: { id }
    })

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      })
    }

    await prisma.registration.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: null, // TODO: Get actual admin ID from auth
        rejectionReason: reason || 'No reason provided'
      }
    })

    console.log('✅ Registration rejected:', id)

    return res.json({
      success: true,
      message: 'Registration rejected successfully'
    })
  } catch (error) {
    console.error('❌ Error rejecting registration:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
