import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

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
