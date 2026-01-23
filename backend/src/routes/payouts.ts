import express, { Request, Response, Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router: Router = express.Router()
const prisma = new PrismaClient()

/**
 * GET /api/payouts/guard/:guardId
 * Get all payouts for a specific guard
 */
router.get('/payouts/guard/:guardId', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    console.log('🔍 Fetching payouts for guard:', guardId)

    // Find guard by guardId to get internal ID
    const guard = await prisma.carGuard.findUnique({
      where: { guardId }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    const payouts = await prisma.payout.findMany({
      where: { guardId: guard.id },
      orderBy: { requestDate: 'desc' }
    })

    // Format payouts for mobile app
    const formattedPayouts = payouts.map(p => {
      const requestDate = new Date(p.requestDate)
      const processDate = p.processDate ? new Date(p.processDate) : null

      return {
        id: p.id,
        voucherNumber: p.voucherNumber || `PN-${p.id.slice(-8).toUpperCase()}`,
        guardId: guard.guardId,
        guardName: `${guard.name} ${guard.surname}`,
        amount: p.amount,
        type: p.type.toLowerCase().replace('_', '-') as any,
        status: p.status.toLowerCase() as any,
        requestDate: requestDate.toISOString().split('T')[0],
        processDate: processDate ? processDate.toISOString().split('T')[0] : undefined,
        reference: p.reference,
        bankDetails: p.bankName && p.accountNumber ? {
          bankName: p.bankName,
          accountNumber: p.accountNumber
        } : undefined,
        utilityDetails: p.meterNumber || p.phoneNumber ? {
          meterNumber: p.meterNumber || undefined,
          phoneNumber: p.phoneNumber || undefined,
          provider: p.provider || undefined
        } : undefined
      }
    })

    console.log(`✅ Found ${payouts.length} payouts for guard:`, guardId)

    res.json({
      success: true,
      data: formattedPayouts
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
 * GET /api/payouts/:id
 * Get a specific payout by ID
 */
router.get('/payouts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        guard: {
          select: {
            guardId: true,
            name: true,
            surname: true
          }
        }
      }
    })

    if (!payout) {
      return res.status(404).json({
        success: false,
        error: 'Payout not found'
      })
    }

    res.json({
      success: true,
      data: payout
    })
  } catch (error) {
    console.error('❌ Error fetching payout:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payout'
    })
  }
})

/**
 * POST /api/payouts
 * Create a new payout request
 */
router.post('/payouts', async (req: Request, res: Response) => {
  try {
    const {
      guardId,
      amount,
      type = 'bank_transfer',
      bankName,
      accountNumber,
      accountHolder,
      branchCode,
      meterNumber,
      phoneNumber,
      provider,
      reference
    } = req.body

    console.log('💸 Creating payout request:', { guardId, amount, type })

    // Validate required fields
    if (!guardId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'guardId and amount are required'
      })
    }

    // Find guard
    const guard = await prisma.carGuard.findUnique({
      where: { guardId }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Check if guard has sufficient balance
    if (guard.balance < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Current balance: R${guard.balance.toFixed(2)}`
      })
    }

    // Generate voucher number
    const voucherNumber = `PN-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`

    // Create payout
    const payout = await prisma.payout.create({
      data: {
        guardId: guard.id,
        amount,
        type: type.toUpperCase().replace('-', '_'),
        status: 'PENDING',
        voucherNumber,
        bankName,
        accountNumber,
        meterNumber,
        phoneNumber,
        provider,
        reference
      }
    })

    // Deduct from guard balance
    await prisma.carGuard.update({
      where: { id: guard.id },
      data: {
        balance: {
          decrement: amount
        }
      }
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        guardId: guard.id,
        type: 'PAYOUT',
        amount,
        status: 'PENDING',
        description: `Payout request ${voucherNumber}`,
        reference: voucherNumber,
        balance: guard.balance - amount
      }
    })

    console.log('✅ Payout created:', payout.id)

    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        id: payout.id,
        voucherNumber: payout.voucherNumber,
        amount: payout.amount,
        type: payout.type.toLowerCase().replace('_', '-'),
        status: payout.status.toLowerCase(),
        requestDate: payout.requestDate,
        newBalance: guard.balance - amount
      }
    })
  } catch (error) {
    console.error('❌ Error creating payout:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create payout request'
    })
  }
})

/**
 * PATCH /api/payouts/:id/status
 * Update payout status (for admin)
 */
router.patch('/payouts/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'status is required'
      })
    }

    const payout = await prisma.payout.findUnique({
      where: { id }
    })

    if (!payout) {
      return res.status(404).json({
        success: false,
        error: 'Payout not found'
      })
    }

    // If status is being changed to failed, refund the balance
    if (status.toUpperCase() === 'FAILED' && payout.status !== 'FAILED') {
      await prisma.carGuard.update({
        where: { id: payout.guardId },
        data: {
          balance: {
            increment: payout.amount
          }
        }
      })
    }

    const updatedPayout = await prisma.payout.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        processDate: status.toUpperCase() === 'COMPLETED' ? new Date() : null
      }
    })

    // Update corresponding transaction status
    await prisma.transaction.updateMany({
      where: {
        guardId: payout.guardId,
        type: 'PAYOUT',
        createdAt: payout.createdAt
      },
      data: { status: status.toUpperCase() }
    })

    console.log('✅ Payout status updated:', id, status)

    res.json({
      success: true,
      message: 'Payout status updated',
      data: updatedPayout
    })
  } catch (error) {
    console.error('❌ Error updating payout status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update payout status'
    })
  }
})

export default router
