import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { mobileAuth } from '../middleware/mobileAuth'

const router = Router()

// Check if we're in sandbox mode (relax validation for testing)
const ONEVOUCHER_BASE_URL = process.env.ONEVOUCHER_SANDBOX_BASE_URL || process.env.ONEVOUCHER_BASE_URL || ''
const IS_SANDBOX = ONEVOUCHER_BASE_URL.includes('sandbox') || process.env.NODE_ENV === 'development'

/**
 * Normalize South African phone numbers
 * Converts various formats to +27XXXXXXXXX
 */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Handle South African numbers
  if (cleaned.startsWith('0')) {
    cleaned = '+27' + cleaned.substring(1)
  } else if (cleaned.startsWith('27') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  } else if (!cleaned.startsWith('+')) {
    // Assume it's a local number without country code
    cleaned = '+27' + cleaned
  }

  return cleaned
}

/**
 * POST /api/guards/verify-access-code
 * Step 1: Verify the 6-digit access code is valid and not expired
 */
router.post('/guards/verify-access-code', async (req: Request, res: Response) => {
  try {
    const { accessCode } = req.body

    if (!accessCode || accessCode.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid access code format. Please enter a 6-digit code.'
      })
    }

    console.log('🔍 Verifying access code:', accessCode)

    // Find guard with this access code
    const guard = await prisma.carGuard.findFirst({
      where: { accessCode },
      include: {
        location: true,
        user: {
          select: { email: true }
        }
      }
    })

    if (!guard) {
      console.log('❌ Access code not found:', accessCode)
      return res.status(404).json({
        success: false,
        error: 'Invalid access code. Please check the code and try again.'
      })
    }

    // Check if code is expired
    if (guard.accessCodeExpiry && new Date() > guard.accessCodeExpiry) {
      console.log('❌ Access code expired:', accessCode)
      return res.status(400).json({
        success: false,
        error: 'Access code has expired. Please contact your manager for a new code.'
      })
    }

    // Check if guard is active
    if (guard.status !== 'ACTIVE' && guard.status !== 'PENDING') {
      console.log('❌ Guard not active:', guard.guardId, guard.status)
      return res.status(400).json({
        success: false,
        error: 'This guard account is not active. Please contact your manager.'
      })
    }

    // Check if already linked
    if (guard.clerkUserId) {
      console.log('❌ Guard already linked:', guard.guardId)
      return res.status(400).json({
        success: false,
        error: 'This guard account is already linked to a mobile account.'
      })
    }

    console.log('✅ Access code valid for guard:', guard.guardId)

    return res.json({
      success: true,
      data: {
        guardId: guard.guardId,
        id: guard.id,
        name: guard.name,
        surname: guard.surname,
        phone: guard.phone,
        email: guard.user?.email || null,
        location: guard.location ? {
          id: guard.location.id,
          name: guard.location.name,
          address: guard.location.address
        } : null,
        status: guard.status
      }
    })
  } catch (error) {
    console.error('❌ Error verifying access code:', error)
    return res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.'
    })
  }
})

/**
 * POST /api/guards/link-mobile-account
 * Step 2: Link Clerk user to guard profile after email/phone verification
 */
router.post('/guards/link-mobile-account', async (req: Request, res: Response) => {
  try {
    const { accessCode, clerkUserId, clerkEmail, clerkPhone } = req.body

    if (!accessCode || !clerkUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      })
    }

    console.log('🔗 Linking mobile account:', { accessCode, clerkUserId })

    // Find guard with this access code
    const guard = await prisma.carGuard.findFirst({
      where: { accessCode },
      include: {
        location: true,
        user: {
          select: { email: true }
        }
      }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Invalid access code'
      })
    }

    // Check if code is expired
    if (guard.accessCodeExpiry && new Date() > guard.accessCodeExpiry) {
      return res.status(400).json({
        success: false,
        error: 'Access code has expired'
      })
    }

    // Check if already linked
    if (guard.clerkUserId) {
      return res.status(400).json({
        success: false,
        error: 'This account is already linked'
      })
    }

    // Verify email or phone matches
    const guardEmail = guard.user?.email?.toLowerCase()
    const guardPhone = normalizePhone(guard.phone)
    const normalizedClerkEmail = clerkEmail?.toLowerCase()
    const normalizedClerkPhone = normalizePhone(clerkPhone)

    const emailMatches = guardEmail && normalizedClerkEmail && guardEmail === normalizedClerkEmail
    const phoneMatches = guardPhone && normalizedClerkPhone && guardPhone === normalizedClerkPhone

    if (!emailMatches && !phoneMatches) {
      console.log('❌ Email/phone mismatch:', {
        guardEmail,
        clerkEmail: normalizedClerkEmail,
        guardPhone,
        clerkPhone: normalizedClerkPhone
      })
      return res.status(400).json({
        success: false,
        error: 'The email or phone number you signed up with does not match the guard profile. Please use the same email or phone your manager registered you with.'
      })
    }

    // Link the account — access code stays until admin explicitly regenerates it
    const updatedGuard = await prisma.carGuard.update({
      where: { id: guard.id },
      data: {
        clerkUserId,
        status: 'ACTIVE'
      },
      include: {
        location: true,
        user: {
          select: { email: true }
        }
      }
    })

    console.log('✅ Account linked successfully:', updatedGuard.guardId)

    return res.json({
      success: true,
      data: {
        guardId: updatedGuard.guardId,
        id: updatedGuard.id,
        name: updatedGuard.name,
        surname: updatedGuard.surname,
        phone: updatedGuard.phone,
        email: updatedGuard.user?.email || null,
        balance: updatedGuard.balance || 0,
        lifetimeEarnings: updatedGuard.lifetimeEarnings || 0,
        qrCode: updatedGuard.qrCode,
        qrCodeUrl: updatedGuard.qrCodeUrl,
        accessCode: null,
        accessCodeExpiry: null,
        location: updatedGuard.location ? {
          id: updatedGuard.location.id,
          name: updatedGuard.location.name,
          address: updatedGuard.location.address
        } : null,
        status: updatedGuard.status,
        rating: updatedGuard.rating || 0,
        totalRatings: updatedGuard.totalRatings || 0,
        profileImage: updatedGuard.profileImage
      }
    })
  } catch (error) {
    console.error('❌ Error linking account:', error)
    return res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.'
    })
  }
})

/**
 * GET /api/mobile/check-link/:clerkUserId
 * Check if a Clerk user is already linked to a guard profile
 */
router.get('/mobile/check-link/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params

    console.log('🔍 Checking link for Clerk user:', clerkUserId)

    const guard = await prisma.carGuard.findFirst({
      where: { clerkUserId },
      include: {
        location: true,
        user: {
          select: { email: true }
        }
      }
    })

    if (!guard) {
      return res.json({
        success: true,
        data: { isLinked: false }
      })
    }

    console.log('✅ Found linked guard:', guard.guardId)

    return res.json({
      success: true,
      data: {
        isLinked: true,
        id: guard.id,
        guardId: guard.guardId,
        name: guard.name,
        surname: guard.surname,
        phone: guard.phone,
        email: guard.user?.email || null,
        balance: guard.balance || 0,
        lifetimeEarnings: guard.lifetimeEarnings || 0,
        qrCode: guard.qrCode,
        qrCodeUrl: guard.qrCodeUrl,
        status: guard.status,
        rating: guard.rating || 0,
        location: guard.location ? {
          id: guard.location.id,
          name: guard.location.name,
          address: guard.location.address
        } : null
      }
    })
  } catch (error) {
    console.error('❌ Error checking link:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to check link status'
    })
  }
})

/**
 * GET /api/mobile/guard/:clerkUserId
 * Get guard profile by Clerk user ID
 */
router.get('/mobile/guard/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params

    const guard = await prisma.carGuard.findFirst({
      where: { clerkUserId },
      include: {
        location: true,
        user: {
          select: { email: true }
        }
      }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    return res.json({
      success: true,
      data: {
        id: guard.id,
        guardId: guard.guardId,
        name: guard.name,
        surname: guard.surname,
        phone: guard.phone,
        email: guard.user?.email || null,
        balance: guard.balance || 0,
        lifetimeEarnings: guard.lifetimeEarnings || 0,
        qrCode: guard.qrCode,
        qrCodeUrl: guard.qrCodeUrl,
        status: guard.status,
        rating: guard.rating || 0,
        location: guard.location ? {
          id: guard.location.id,
          name: guard.location.name,
          address: guard.location.address
        } : null
      }
    })
  } catch (error) {
    console.error('❌ Error fetching guard:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch guard profile'
    })
  }
})

/**
 * GET /api/mobile/guard/:clerkUserId/transactions
 * Get transactions for a guard by Clerk user ID
 */
router.get('/mobile/guard/:clerkUserId/transactions', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params
    const { limit = '50', offset = '0', type } = req.query

    const guard = await prisma.carGuard.findFirst({
      where: { clerkUserId },
      select: { id: true }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    const where: any = { guardId: guard.id }
    if (type && type !== 'all') {
      where.type = type
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.transaction.count({ where })
    ])

    return res.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          status: t.status || 'COMPLETED',
          reference: t.reference,
          balance: t.balance,
          date: t.createdAt.toISOString().split('T')[0],
          time: t.createdAt.toISOString().split('T')[1].split('.')[0],
          createdAt: t.createdAt.toISOString()
        })),
        pagination: {
          total,
          hasMore: parseInt(offset as string) + transactions.length < total
        }
      }
    })
  } catch (error) {
    console.error('❌ Error fetching transactions:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    })
  }
})

/**
 * GET /api/mobile/guard/:clerkUserId/payouts
 * Get payouts for a guard by Clerk user ID
 */
router.get('/mobile/guard/:clerkUserId/payouts', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params

    const guard = await prisma.carGuard.findFirst({
      where: { clerkUserId },
      select: { id: true }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    const payouts = await prisma.payout.findMany({
      where: { guardId: guard.id },
      orderBy: { createdAt: 'desc' }
    })

    return res.json({
      success: true,
      data: payouts.map(p => ({
        id: p.id,
        voucherNumber: null,
        amount: p.amount,
        type: 'BANK_TRANSFER',
        status: p.status,
        requestDate: p.createdAt.toISOString(),
        processDate: null,
        reference: null,
        bankName: null,
        accountNumber: null,
        meterNumber: null,
        phoneNumber: null,
        provider: null
      }))
    })
  } catch (error) {
    console.error('❌ Error fetching payouts:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payouts'
    })
  }
})

/**
 * POST /api/mobile/guard/:clerkUserId/update-activity
 * Update guard's last active timestamp
 */
router.post('/mobile/guard/:clerkUserId/update-activity', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params

    await prisma.carGuard.updateMany({
      where: { clerkUserId },
      data: { lastActiveAt: new Date() }
    })

    return res.json({ success: true })
  } catch (error) {
    // Silently fail - not critical
    return res.json({ success: true })
  }
})

// ==================== PAYOUT REQUEST ENDPOINTS ====================

/**
 * Generate a unique payout ID
 */
function generatePayoutId(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `PAY-${dateStr}-${random}`
}

/**
 * POST /api/mobile/payout/request
 * Submit a new payout request (goes through admin approval workflow)
 */
router.post('/mobile/payout/request', async (req: Request, res: Response) => {
  try {
    const { guardId, amount, notes } = req.body

    console.log('📝 New payout request:', { guardId, amount, sandbox: IS_SANDBOX })

    // Validate required fields
    if (!guardId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'guardId and amount are required'
      })
    }

    // Validate amount (minimum R10, must be whole rands)
    if (amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum payout amount is R10'
      })
    }

    if (amount % 10 !== 0) {
      return res.status(400).json({
        success: false,
        error: 'Payout amount must be a multiple of R10 (e.g. R10, R20, R30...)'
      })
    }

    // Find guard by guardId or database id (supports both formats)
    let guard = await prisma.carGuard.findUnique({
      where: { guardId }
    })

    // If not found by guardId, try by database id
    if (!guard) {
      guard = await prisma.carGuard.findUnique({
        where: { id: guardId }
      })
    }

    // In sandbox mode, if guard still not found, use mock data for testing
    if (!guard && IS_SANDBOX) {
      console.log('⚠️ Guard not found, using sandbox mock data')
      const mockPayoutId = generatePayoutId()
      return res.status(201).json({
        success: true,
        message: 'Payout request submitted successfully (sandbox mode)',
        data: {
          payoutId: mockPayoutId,
          amount: amount,
          status: 'PENDING',
          requestedAt: new Date().toISOString(),
          currentBalance: 1000, // Mock balance
          note: 'SANDBOX MODE: Your request is pending admin approval. Balance will be deducted upon approval.'
        }
      })
    }

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Check if guard is active
    if (guard.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Guard account is not active'
      })
    }

    // Check if guard has sufficient balance
    if (guard.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        currentBalance: guard.balance,
        requestedAmount: amount
      })
    }

    // Check for existing pending payout requests — always enforced
    {
      const existingPending = await prisma.payout.findFirst({
        where: {
          guardId: guard.id,
          status: 'PENDING'
        }
      })

      if (existingPending) {
        return res.status(400).json({
          success: false,
          error: 'You already have a pending payout request. Please wait for it to be processed.'
        })
      }
    }

    // Generate unique payout ID
    const payoutId = generatePayoutId()

    // Create payout request (status = PENDING, balance NOT deducted yet)
    const payout = await prisma.payout.create({
      data: {
        payoutId,
        guardId: guard.id,
        amount,
        status: 'PENDING',
        notes: notes || null
      }
    })

    console.log('✅ Payout request created:', payout.payoutId, IS_SANDBOX ? '(sandbox)' : '')

    return res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        payoutId: payout.payoutId,
        amount: payout.amount,
        status: payout.status,
        requestedAt: payout.createdAt.toISOString(),
        currentBalance: guard.balance,
        note: 'Your request is pending admin approval. Balance will be deducted upon approval.'
      }
    })
  } catch (error) {
    console.error('❌ Error creating payout request:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to create payout request. Please try again.'
    })
  }
})

/**
 * GET /api/mobile/payout/requests
 * Get guard's payout requests (for tracking approval status)
 */
router.get('/mobile/payout/requests', async (req: Request, res: Response) => {
  try {
    const { guardId, status, limit = '20' } = req.query

    if (!guardId) {
      return res.status(400).json({
        success: false,
        error: 'guardId is required'
      })
    }

    console.log('🔍 Fetching payout requests for guard:', guardId)

    // Find guard by guardId field first
    let guard = await prisma.carGuard.findUnique({
      where: { guardId: guardId as string }
    })

    // If not found, try by clerkUserId
    if (!guard) {
      guard = await prisma.carGuard.findFirst({
        where: { clerkUserId: guardId as string }
      })
    }

    // If still not found, try by MongoDB id (only if it looks like a valid ObjectId)
    if (!guard && /^[a-f\d]{24}$/i.test(guardId as string)) {
      guard = await prisma.carGuard.findUnique({
        where: { id: guardId as string }
      })
    }

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Build query
    const where: any = { guardId: guard.id }
    if (status && status !== 'all') {
      where.status = (status as string).toUpperCase()
    }

    // Fetch payout requests
    const payouts = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    })

    // Format response
    const formattedPayouts = payouts.map(p => ({
      id: p.id,
      payoutId: p.payoutId || `PAY-${p.id.slice(-8).toUpperCase()}`,
      amount: p.amount,
      status: p.status,
      method: p.method,
      requestedAt: p.createdAt.toISOString(),
      approvedAt: p.approvedAt?.toISOString() || null,
      processedAt: p.processedAt?.toISOString() || null,
      completedAt: p.completedAt?.toISOString() || null,
      notes: p.notes,
      adminNotes: p.adminNotes,
      rejectionReason: p.rejectionReason,
      voucherPin: p.voucherPin,
      voucherSerial: p.voucherSerial,
      voucherExpiry: p.voucherExpiry?.toISOString() || null
    }))

    console.log(`✅ Found ${payouts.length} payout requests for guard:`, guardId)

    return res.json({
      success: true,
      data: formattedPayouts
    })
  } catch (error) {
    console.error('❌ Error fetching payout requests:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payout requests'
    })
  }
})

/**
 * PUT /api/mobile/guard/:clerkUserId/profile
 * Update guard profile (personal info and banking details)
 */
router.put('/mobile/guard/:clerkUserId/profile', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params
    const {
      name,
      surname,
      phone,
      alternatePhone,
      bankName,
      accountNumber,
      accountHolder,
      branchCode,
      accountType
    } = req.body

    console.log('📝 Updating profile for Clerk user:', clerkUserId)

    const guard = await prisma.carGuard.findFirst({
      where: { clerkUserId }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Build update data - only include fields that are provided
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (surname !== undefined) updateData.surname = surname
    if (phone !== undefined) updateData.phone = phone
    if (alternatePhone !== undefined) updateData.alternatePhone = alternatePhone
    if (bankName !== undefined) updateData.bankName = bankName
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber
    if (accountHolder !== undefined) updateData.accountHolder = accountHolder
    if (branchCode !== undefined) updateData.branchCode = branchCode
    if (accountType !== undefined) updateData.accountType = accountType

    const updatedGuard = await prisma.carGuard.update({
      where: { id: guard.id },
      data: updateData,
      include: {
        location: true,
        user: {
          select: { email: true }
        }
      }
    })

    console.log('✅ Profile updated for guard:', updatedGuard.guardId)

    return res.json({
      success: true,
      data: {
        id: updatedGuard.id,
        guardId: updatedGuard.guardId,
        name: updatedGuard.name,
        surname: updatedGuard.surname,
        phone: updatedGuard.phone,
        email: updatedGuard.user?.email || null,
        balance: updatedGuard.balance || 0,
        lifetimeEarnings: updatedGuard.lifetimeEarnings || 0,
        qrCode: updatedGuard.qrCode,
        qrCodeUrl: updatedGuard.qrCodeUrl,
        status: updatedGuard.status,
        rating: updatedGuard.rating || 0,
        location: updatedGuard.location ? {
          id: updatedGuard.location.id,
          name: updatedGuard.location.name,
          address: updatedGuard.location.address
        } : null
      }
    })
  } catch (error) {
    console.error('❌ Error updating profile:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    })
  }
})

/**
 * POST /api/admin/guards/:guardId/generate-access-code
 * Generate a new 6-digit access code for a guard (admin endpoint)
 */
router.post('/admin/guards/:guardId/generate-access-code', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    const { expiryHours = 24 } = req.body

    // Generate unique 6-digit code (retry if already exists)
    let accessCode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      accessCode = Math.floor(100000 + Math.random() * 900000).toString()
      const existing = await prisma.carGuard.findFirst({
        where: { accessCode }
      })
      if (!existing) break
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate unique access code'
      })
    }

    const accessCodeExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

    const guard = await prisma.carGuard.update({
      where: { guardId },
      data: {
        accessCode,
        accessCodeExpiry,
        clerkUserId: null // Clear any existing link
      }
    })

    console.log('✅ Generated access code for guard:', guardId, accessCode)

    return res.json({
      success: true,
      data: {
        guardId: guard.guardId,
        accessCode,
        expiresAt: accessCodeExpiry.toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error generating access code:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to generate access code'
    })
  }
})

// ==================== JWT-AUTHENTICATED MOBILE ROUTES ====================
// These replace the clerkUserId-based routes. Identity comes from the JWT.

/**
 * GET /api/mobile/me
 * Get the logged-in guard's profile
 */
router.get('/mobile/me', mobileAuth, async (req: Request, res: Response) => {
  try {
    const guard = await prisma.carGuard.findUnique({
      where: { id: req.guard!.guardId },
      include: { location: { select: { id: true, name: true, address: true } } }
    })

    if (!guard) return res.status(404).json({ success: false, error: 'Guard not found' })

    return res.json({
      success: true,
      data: {
        id: guard.id,
        guardId: guard.guardId,
        name: guard.name,
        surname: guard.surname,
        fullName: `${guard.name} ${guard.surname}`,
        phone: guard.phone,
        email: null,
        balance: guard.balance,
        totalEarnings: guard.lifetimeEarnings,
        status: guard.status,
        rating: guard.rating,
        qrCode: guard.qrCode,
        qrCodeUrl: guard.qrCodeUrl || null,
        location: guard.location || null,
        bankName: guard.bankName,
        accountNumber: guard.accountNumber,
        accountHolder: guard.accountHolder,
        branchCode: guard.branchCode,
        accountType: guard.accountType,
      }
    })
  } catch (error) {
    console.error('❌ Error fetching guard profile:', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch profile' })
  }
})

/**
 * GET /api/mobile/me/transactions
 * Get the logged-in guard's transactions
 */
router.get('/mobile/me/transactions', mobileAuth, async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0', type } = req.query
    const guardId = req.guard!.guardId

    const where: any = { guardId }
    if (type) where.type = String(type).toUpperCase()

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    })

    return res.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          status: t.status || 'COMPLETED',
          reference: t.reference,
          balance: t.balance,
          date: t.createdAt.toISOString().split('T')[0],
          time: t.createdAt.toISOString().split('T')[1].split('.')[0],
          createdAt: t.createdAt.toISOString(),
        }))
      }
    })
  } catch (error) {
    console.error('❌ Error fetching transactions:', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch transactions' })
  }
})

/**
 * GET /api/mobile/me/payouts
 * Get the logged-in guard's payout requests
 */
router.get('/mobile/me/payouts', mobileAuth, async (req: Request, res: Response) => {
  try {
    const { status, limit = '50' } = req.query
    const guardId = req.guard!.guardId

    const where: any = { guardId }
    if (status && status !== 'all') where.status = String(status).toUpperCase()

    const payouts = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    })

    return res.json({
      success: true,
      data: payouts.map(p => ({
        id: p.id,
        payoutId: p.payoutId || `PAY-${p.id.slice(-8).toUpperCase()}`,
        amount: p.amount,
        status: p.status,
        method: p.method,
        requestedAt: p.createdAt.toISOString(),
        approvedAt: p.approvedAt?.toISOString() || null,
        processedAt: p.processedAt?.toISOString() || null,
        completedAt: p.completedAt?.toISOString() || null,
        notes: p.notes,
        adminNotes: p.adminNotes,
        rejectionReason: p.rejectionReason,
      }))
    })
  } catch (error) {
    console.error('❌ Error fetching payouts:', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch payouts' })
  }
})

/**
 * POST /api/mobile/me/payout/request
 * Submit a new payout request
 */
router.post('/mobile/me/payout/request', mobileAuth, async (req: Request, res: Response) => {
  try {
    const { amount, notes } = req.body
    const guardId = req.guard!.guardId

    if (!amount) return res.status(400).json({ success: false, error: 'Amount is required' })
    if (amount < 10) return res.status(400).json({ success: false, error: 'Minimum payout amount is R10' })
    if (amount % 10 !== 0) return res.status(400).json({ success: false, error: 'Payout amount must be a multiple of R10' })

    const guard = await prisma.carGuard.findUnique({ where: { id: guardId } })
    if (!guard) return res.status(404).json({ success: false, error: 'Guard not found' })
    if (guard.status !== 'ACTIVE') return res.status(400).json({ success: false, error: 'Guard account is not active' })
    if (guard.balance < amount) return res.status(400).json({ success: false, error: 'Insufficient balance', currentBalance: guard.balance })

    const existing = await prisma.payout.findFirst({ where: { guardId, status: 'PENDING' } })
    if (existing) return res.status(400).json({ success: false, error: 'You already have a pending payout request. Please wait for it to be processed.' })

    const payoutId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const payout = await prisma.payout.create({
      data: { payoutId, guardId, amount, status: 'PENDING', notes: notes || null }
    })

    return res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        payoutId: payout.payoutId,
        amount: payout.amount,
        status: payout.status,
        requestedAt: payout.createdAt.toISOString(),
        currentBalance: guard.balance,
        note: 'Your request is pending admin approval. Balance will be deducted upon approval.'
      }
    })
  } catch (error) {
    console.error('❌ Error creating payout request:', error)
    return res.status(500).json({ success: false, error: 'Failed to create payout request' })
  }
})

/**
 * PUT /api/mobile/me/profile
 * Update the logged-in guard's profile
 */
router.put('/mobile/me/profile', mobileAuth, async (req: Request, res: Response) => {
  try {
    const guardId = req.guard!.guardId
    const { name, surname, phone, bankName, accountNumber, accountHolder, branchCode, accountType } = req.body

    const updated = await prisma.carGuard.update({
      where: { id: guardId },
      data: {
        ...(name && { name }),
        ...(surname && { surname }),
        ...(phone && { phone }),
        ...(bankName !== undefined && { bankName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(accountHolder !== undefined && { accountHolder }),
        ...(branchCode !== undefined && { branchCode }),
        ...(accountType !== undefined && { accountType }),
      }
    })

    return res.json({
      success: true,
      data: {
        id: updated.id,
        guardId: updated.guardId,
        name: updated.name,
        surname: updated.surname,
        fullName: `${updated.name} ${updated.surname}`,
        phone: updated.phone,
        balance: updated.balance,
        bankName: updated.bankName,
        accountNumber: updated.accountNumber,
        accountHolder: updated.accountHolder,
        branchCode: updated.branchCode,
        accountType: updated.accountType,
      }
    })
  } catch (error) {
    console.error('❌ Error updating profile:', error)
    return res.status(500).json({ success: false, error: 'Failed to update profile' })
  }
})

/**
 * GET /api/mobile/me/auto-payout-settings
 * Returns the effective auto-payout settings for the logged-in guard.
 * Reads global settings from Settings collection, then checks per-guard override on CarGuard.
 */
router.get('/mobile/me/auto-payout-settings', mobileAuth, async (req: Request, res: Response) => {
  try {
    const guardId = req.guard!.guardId

    const guard = await prisma.carGuard.findUnique({
      where: { id: guardId },
      select: {
        balance: true,
        autoPayoutEnabled: true,
        autoPayoutThreshold: true,
      }
    })

    if (!guard) return res.status(404).json({ success: false, error: 'Guard not found' })

    // Load global settings
    const [enabledSetting, thresholdSetting, modeSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: 'auto_payout_enabled' } }),
      prisma.settings.findUnique({ where: { key: 'auto_payout_threshold' } }),
      prisma.settings.findUnique({ where: { key: 'auto_payout_mode' } }),
    ])

    const globalEnabled = enabledSetting?.value === 'true'
    const globalThreshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 500
    const mode = modeSetting?.value || 'SEMI_AUTO'

    // Per-guard override takes precedence if set
    const isCustom = guard.autoPayoutEnabled !== null || guard.autoPayoutThreshold !== null
    const effectiveEnabled = guard.autoPayoutEnabled !== null ? guard.autoPayoutEnabled : globalEnabled
    const effectiveThreshold = guard.autoPayoutThreshold !== null && guard.autoPayoutThreshold !== undefined
      ? guard.autoPayoutThreshold
      : globalThreshold

    const amountUntilAutoPayout = Math.max(0, effectiveThreshold - guard.balance)

    return res.json({
      success: true,
      data: {
        enabled: effectiveEnabled,
        threshold: effectiveThreshold,
        mode,
        isCustom,
        currentBalance: guard.balance,
        amountUntilAutoPayout,
      }
    })
  } catch (error) {
    console.error('❌ Error fetching auto-payout settings:', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch auto-payout settings' })
  }
})

export default router
