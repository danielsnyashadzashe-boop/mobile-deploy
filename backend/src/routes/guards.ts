import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { notifyGuard } from '../lib/notifications'
import { adminAuth } from '../middleware/adminAuth'

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
        displayName: guard.displayName,
        email: user.email,
        phone: guard.phone,
        alternatePhone: guard.alternatePhone,
        balance: guard.balance || 0,
        lifetimeEarnings: guard.lifetimeEarnings || 0,
        status: guard.status,
        qrCode: guard.qrCode,
        locationId: guard.locationId,
        createdAt: guard.createdAt,
        location: guard.location,
        // Banking details (for payouts)
        bankName: guard.bankName,
        accountNumber: guard.accountNumber,
        accountHolder: guard.accountHolder,
        branchCode: guard.branchCode,
        accountType: guard.accountType
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
        displayName: guard.displayName,
        email: guard.user.email,
        phone: guard.phone,
        alternatePhone: guard.alternatePhone,
        balance: guard.balance || 0,
        lifetimeEarnings: guard.lifetimeEarnings || 0,
        status: guard.status,
        qrCode: guard.qrCode,
        locationId: guard.locationId,
        createdAt: guard.createdAt,
        location: guard.location,
        // Banking details
        bankName: guard.bankName,
        accountNumber: guard.accountNumber,
        accountHolder: guard.accountHolder,
        branchCode: guard.branchCode,
        accountType: guard.accountType
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

/**
 * PUT /api/guards/:guardId
 * Update guard profile
 */
router.put('/:guardId', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    const {
      name,
      surname,
      displayName,
      phone,
      alternatePhone,
      bankName,
      accountNumber,
      accountHolder,
      branchCode,
      accountType
    } = req.body

    console.log('🔄 Updating guard:', guardId)

    // Check if guard exists
    const existingGuard = await prisma.carGuard.findUnique({
      where: { guardId }
    })

    if (!existingGuard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Build update data with only provided fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (surname !== undefined) updateData.surname = surname
    if (displayName !== undefined) updateData.displayName = displayName
    if (phone !== undefined) updateData.phone = phone
    if (alternatePhone !== undefined) updateData.alternatePhone = alternatePhone
    if (bankName !== undefined) updateData.bankName = bankName
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber
    if (accountHolder !== undefined) updateData.accountHolder = accountHolder
    if (branchCode !== undefined) updateData.branchCode = branchCode
    if (accountType !== undefined) updateData.accountType = accountType

    const updatedGuard = await prisma.carGuard.update({
      where: { guardId },
      data: updateData,
      include: {
        location: true
      }
    })

    console.log('✅ Guard updated:', guardId)

    return res.json({
      success: true,
      message: 'Guard profile updated successfully',
      data: {
        id: updatedGuard.id,
        guardId: updatedGuard.guardId,
        name: updatedGuard.name,
        surname: updatedGuard.surname,
        displayName: updatedGuard.displayName,
        phone: updatedGuard.phone,
        alternatePhone: updatedGuard.alternatePhone,
        balance: updatedGuard.balance || 0,
        status: updatedGuard.status,
        bankName: updatedGuard.bankName,
        accountNumber: updatedGuard.accountNumber,
        accountHolder: updatedGuard.accountHolder,
        branchCode: updatedGuard.branchCode,
        accountType: updatedGuard.accountType
      }
    })
  } catch (error) {
    console.error('❌ Error updating guard:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * PATCH /api/guards/:guardId/balance
 * Update guard balance (for testing/admin)
 */
router.patch('/:guardId/balance', adminAuth, async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    const { amount, operation = 'set' } = req.body // operation: 'set', 'add', 'subtract'

    // Validate before any mutation. `amount` came straight off the body, so a
    // string made the += concatenate and the .toFixed(2) below throw, AFTER
    // the balance had already been written: the caller got a 500 on a change
    // that had already committed.
    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount)
    if (!Number.isFinite(parsedAmount)) {
      return res.status(400).json({ success: false, error: 'amount must be a number' })
    }
    if (!['set', 'add', 'subtract'].includes(operation)) {
      return res.status(400).json({ success: false, error: 'operation must be set, add or subtract' })
    }

    console.log('💰 Updating guard balance:', guardId, parsedAmount, operation)

    const guard = await prisma.carGuard.findUnique({
      where: { guardId }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    let newBalance = guard.balance || 0

    if (operation === 'add') {
      newBalance += parsedAmount
    } else if (operation === 'subtract') {
      newBalance -= parsedAmount
    } else {
      newBalance = parsedAmount
    }

    const updatedGuard = await prisma.carGuard.update({
      where: { guardId },
      data: { balance: Math.max(0, newBalance) }
    })

    console.log('✅ Balance updated:', guardId, updatedGuard.balance)

    // Notify guard when admin credits or adjusts their balance
    if (operation === 'add') {
      notifyGuard(
        guard.id,
        'TIP_RECEIVED',
        'Balance credited',
        `R${parsedAmount.toFixed(2)} has been added to your balance by the administrator.`,
        { amount: parsedAmount, newBalance: updatedGuard.balance, operation }
      )
    } else if (operation === 'set' && updatedGuard.balance > (guard.balance || 0)) {
      notifyGuard(
        guard.id,
        'TIP_RECEIVED',
        'Balance updated',
        `Your balance has been set to R${updatedGuard.balance.toFixed(2)} by the administrator.`,
        { newBalance: updatedGuard.balance, previousBalance: guard.balance, operation }
      )
    }

    return res.json({
      success: true,
      message: 'Balance updated successfully',
      data: {
        guardId: updatedGuard.guardId,
        balance: updatedGuard.balance,
        previousBalance: guard.balance
      }
    })
  } catch (error) {
    console.error('❌ Error updating balance:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
