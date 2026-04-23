import express, { Request, Response, Router } from 'express'
import prisma from '../lib/prisma'
import { signToken, verifyToken } from '../lib/jwt'
import { mobileAuth } from '../middleware/mobileAuth'

const router: Router = express.Router()

// Generate all possible formats for a phone number to match any storage format
function phoneVariants(raw: string): string[] {
  let p = raw.replace(/[\s\-()]/g, '').replace(/[^\d+]/g, '')
  // Normalise to digits only first
  let digits = p.replace(/^\+/, '')
  if (digits.startsWith('27') && digits.length === 11) digits = digits.slice(2)
  if (digits.startsWith('0') && digits.length === 10) digits = digits.slice(1)
  // digits is now 9-digit local number e.g. 693533693
  return [
    `0${digits}`,          // 0693533693
    `+27${digits}`,        // +27693533693
    `27${digits}`,         // 27693533693
    digits,                // 693533693
  ]
}

// ==================== LOGIN ====================
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, accessCode } = req.body

    if (!phoneNumber || !accessCode) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and access code are required'
      })
    }

    const variants = phoneVariants(String(phoneNumber))
    console.log('🔍 Phone variants to try:', variants)

    // Try all phone number formats — guards may be stored in any format
    const guard = await prisma.carGuard.findFirst({
      where: { phone: { in: variants } },
      include: {
        location: { select: { id: true, name: true, address: true } }
      }
    })

    if (!guard) {
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or access code'
      })
    }

    // Check access code exists
    if (!guard.accessCode) {
      return res.status(401).json({
        success: false,
        error: 'No access code set. Please ask your manager to generate one for you.'
      })
    }

    // Check access code matches
    if (guard.accessCode !== String(accessCode).trim()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid phone number or access code'
      })
    }

    // Check expiry
    if (guard.accessCodeExpiry && new Date() > guard.accessCodeExpiry) {
      return res.status(401).json({
        success: false,
        error: 'Access code has expired. Please ask your manager to generate a new one.'
      })
    }

    // Check guard is active
    if (guard.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: `Your account is ${guard.status.toLowerCase()}. Please contact your manager.`
      })
    }

    // Clear the access code so it can't be reused
    await prisma.carGuard.update({
      where: { id: guard.id },
      data: {
        accessCode: null,
        accessCodeExpiry: null,
        lastActiveAt: new Date()
      }
    })

    // Sign JWT
    const token = signToken({
      guardId: guard.id,
      guardPublicId: guard.guardId,
      phone: guard.phone
    })

    console.log(`✅ Guard logged in: ${guard.guardId} (${guard.name} ${guard.surname})`)

    return res.json({
      success: true,
      token,
      guard: {
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
        location: guard.location
          ? { id: guard.location.id, name: guard.location.name, address: guard.location.address }
          : null
      }
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    return res.status(500).json({ success: false, error: 'Login failed. Please try again.' })
  }
})

// ==================== REFRESH ====================
router.post('/auth/refresh', mobileAuth, async (req: Request, res: Response) => {
  try {
    const guard = req.guard!

    // Verify the guard still exists and is active
    const dbGuard = await prisma.carGuard.findUnique({
      where: { id: guard.guardId }
    })

    if (!dbGuard || dbGuard.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, error: 'Account is no longer active' })
    }

    const newToken = signToken({
      guardId: dbGuard.id,
      guardPublicId: dbGuard.guardId,
      phone: dbGuard.phone
    })

    return res.json({ success: true, token: newToken })
  } catch (error) {
    console.error('❌ Token refresh error:', error)
    return res.status(500).json({ success: false, error: 'Failed to refresh token' })
  }
})

// ==================== LOGOUT ====================
router.post('/auth/logout', mobileAuth, (_req: Request, res: Response) => {
  // JWT is stateless — client clears the token. This endpoint is for completeness.
  return res.json({ success: true, message: 'Logged out successfully' })
})

export default router
