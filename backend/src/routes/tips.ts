import express, { Request, Response, Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { getNetcashServiceKey } from '../lib/settings'
import { notifyGuard } from '../lib/notifications'

const router: Router = express.Router()
const prisma = new PrismaClient()

// ==================== PROCESS TIP WITH COMMISSION ====================
router.post('/tips', async (req: Request, res: Response) => {
  try {
    const {
      guardId,
      customerId,
      locationId,
      amount,
      paymentMethod = 'card',
      customerName,
      reference
    } = req.body

    // Validate required fields
    if (!guardId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'guardId and amount are required'
      })
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      })
    }

    // Get guard details
    const guard = await prisma.carGuard.findUnique({
      where: { guardId }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Get active commission setting
    const commissionSetting = await prisma.commissionSetting.findFirst({
      where: {
        isActive: true,
        OR: [
          { appliesTo: 'TIPS' },
          { appliesTo: 'ALL' }
        ]
      }
    })

    const commissionRate = commissionSetting ? commissionSetting.percentage : 0
    const commissionAmount = amount * (commissionRate / 100)
    const guardReceivesAmount = amount - commissionAmount

    console.log('💰 Processing tip:', {
      original: amount,
      commission: commissionAmount,
      guardReceives: guardReceivesAmount,
      rate: commissionRate + '%'
    })

    // Create tip record
    const tip = await prisma.tip.create({
      data: {
        guardId: guard.id,
        customerId: customerId || 'anonymous',
        locationId: locationId || guard.locationId,
        amount: guardReceivesAmount // Store the net amount guard receives
      }
    })

    // Update guard balance first so we can capture the new balance in the transaction
    const updatedGuard = await prisma.carGuard.update({
      where: { id: guard.id },
      data: {
        balance: {
          increment: guardReceivesAmount
        },
        lifetimeEarnings: {
          increment: guardReceivesAmount
        }
      }
    })

    // Create transaction record with full fields
    const transaction = await prisma.transaction.create({
      data: {
        guardId: guard.id,
        type: 'TIP',
        amount: guardReceivesAmount,
        status: 'COMPLETED',
        description: customerName
          ? `Tip received from ${customerName}`
          : 'Tip received',
        reference: reference || null,
        balance: updatedGuard.balance,
      }
    })

    // Record commission if applicable
    if (commissionAmount > 0) {
      await prisma.commission.create({
        data: {
          guardId: guard.id,
          transactionId: transaction.id,
          amount: commissionAmount,
          rate: commissionRate,
          originalAmount: amount,
          guardReceives: guardReceivesAmount,
          type: 'TIP'
        }
      })
    }

    // Notify guard of tip received (non-blocking — notifyGuard handles errors internally)
    notifyGuard(
      guard.id,
      'TIP_RECEIVED',
      'You received a tip!',
      `R${guardReceivesAmount.toFixed(2)} has been added to your balance.`,
      { amount: guardReceivesAmount, newBalance: updatedGuard.balance }
    )

    res.status(201).json({
      success: true,
      message: 'Tip processed successfully',
      data: {
        tipId: tip.id,
        transactionId: transaction.id,
        originalAmount: amount,
        commissionRate: commissionRate,
        commissionAmount: parseFloat(commissionAmount.toFixed(2)),
        guardReceivesAmount: parseFloat(guardReceivesAmount.toFixed(2)),
        newBalance: updatedGuard.balance,
        metadata: {
          originalAmount: amount,
          commissionRate: commissionRate,
          commissionAmount: parseFloat(commissionAmount.toFixed(2)),
          guardReceivesAmount: parseFloat(guardReceivesAmount.toFixed(2))
        }
      }
    })

  } catch (error) {
    console.error('Error processing tip:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process tip'
    })
  }
})

// ==================== GET TIP BY ID ====================
router.get('/tips/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const tip = await prisma.tip.findUnique({
      where: { id },
      include: {
        location: {
          select: {
            name: true,
            city: true
          }
        }
      }
    })

    if (!tip) {
      return res.status(404).json({
        success: false,
        error: 'Tip not found'
      })
    }

    // Get commission for this tip if exists
    const commission = await prisma.commission.findFirst({
      where: {
        guardId: tip.guardId,
        type: 'TIP'
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: {
        ...tip,
        commission: commission || null
      }
    })

  } catch (error) {
    console.error('Error fetching tip:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tip'
    })
  }
})

// ==================== GET TIPS BY GUARD ====================
router.get('/tips/guard/:guardId', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params

    const guard = await prisma.carGuard.findUnique({
      where: { guardId }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    const tips = await prisma.tip.findMany({
      where: { guardId: guard.id },
      orderBy: { createdAt: 'desc' },
      include: {
        location: {
          select: {
            name: true,
            city: true
          }
        }
      }
    })

    // Get commissions for these tips
    const commissions = await prisma.commission.findMany({
      where: {
        guardId: guard.id,
        type: 'TIP'
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalTips = tips.reduce((sum, tip) => sum + tip.amount, 0)
    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0)

    res.json({
      success: true,
      data: {
        tips,
        commissions,
        summary: {
          totalTips,
          totalCommissions,
          netReceived: totalTips,
          tipCount: tips.length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching guard tips:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guard tips'
    })
  }
})

// ==================== NETCASH WEBHOOK ====================
// Netcash PayNow calls this URL (m6) server-to-server after a successful payment.
// Field mapping (Netcash PayNow POST body):
//   m1  = service key
//   p2  = merchant reference  (we set: TIP_<guardId>_<timestamp>_QR)
//   p3  = description
//   p4  = amount (string, e.g. "20.00")
//   p5  = Netcash transaction ID
// This endpoint is ONLY called on success — there is no status field to check.
router.post('/webhooks/netcash', async (req: Request, res: Response) => {
  try {
    console.log('📥 Netcash webhook received:', JSON.stringify(req.body))

    // Verify service key — Netcash sends it as m1
    const expectedKey = await getNetcashServiceKey()
    const receivedKey = (req.body.m1 || req.headers['x-netcash-service-key']) as string | undefined
    if (expectedKey && (!receivedKey || receivedKey !== expectedKey)) {
      console.warn('⚠️ Netcash webhook rejected: service key mismatch', { received: receivedKey })
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Extract fields using correct Netcash PayNow field names
    const reference   = (req.body.p2 || '') as string   // e.g. TIP_GRD001_1718000000000_QR
    const amountRaw   = (req.body.p4 || '0') as string  // e.g. "20.00"
    const netcashTxId = (req.body.p5 || '') as string

    const amount = parseFloat(amountRaw)
    if (!reference || isNaN(amount) || amount <= 0) {
      console.warn('⚠️ Netcash webhook: missing or invalid p2/p4', req.body)
      return res.status(400).json({ success: false, error: 'Missing reference or amount' })
    }

    // Parse guard public ID from reference — format: TIP_<guardId>_<timestamp>_QR
    const parts   = reference.split('_')
    const guardId = parts.length >= 2 ? parts[1] : reference

    console.log('💳 Netcash payment:', { reference, guardId, amount, netcashTxId })

    // Idempotency — skip if we already processed this Netcash transaction
    if (netcashTxId) {
      const existing = await prisma.transaction.findFirst({
        where: { reference: netcashTxId }
      })
      if (existing) {
        console.log('ℹ️ Netcash webhook: already processed', netcashTxId)
        return res.json({ success: true, message: 'Already processed' })
      }
    }

    // Process the tip
    const tipResult = await processTipInternal({
      guardId,
      amount,
      paymentMethod: 'card',
      reference: netcashTxId || reference,
    })

    console.log('✅ Netcash tip processed:', tipResult)
    return res.json({
      success: true,
      message: 'Payment processed',
      data: tipResult
    })

  } catch (error) {
    console.error('❌ Error processing Netcash webhook:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    })
  }
})

// Internal helper function
async function processTipInternal(data: any) {
  const { guardId, amount, paymentMethod, reference, customerEmail } = data

  const guard = await prisma.carGuard.findUnique({
    where: { guardId }
  })

  if (!guard) {
    throw new Error('Guard not found')
  }

  const commissionSetting = await prisma.commissionSetting.findFirst({
    where: {
      isActive: true,
      OR: [{ appliesTo: 'TIPS' }, { appliesTo: 'ALL' }]
    }
  })

  const commissionRate = commissionSetting ? commissionSetting.percentage : 0
  const commissionAmount = amount * (commissionRate / 100)
  const guardReceivesAmount = amount - commissionAmount

  const tip = await prisma.tip.create({
    data: {
      guardId: guard.id,
      customerId: customerEmail || 'anonymous',
      locationId: guard.locationId,
      amount: guardReceivesAmount
    }
  })

  const updatedGuard = await prisma.carGuard.update({
    where: { id: guard.id },
    data: {
      balance: { increment: guardReceivesAmount },
      lifetimeEarnings: { increment: guardReceivesAmount }
    }
  })

  const transaction = await prisma.transaction.create({
    data: {
      guardId: guard.id,
      type: 'TIP',
      amount: guardReceivesAmount,
      status: 'COMPLETED',
      description: customerEmail
        ? `Tip received from ${customerEmail}`
        : 'Tip received',
      reference: reference || null,
      balance: updatedGuard.balance,
    }
  })

  if (commissionAmount > 0) {
    await prisma.commission.create({
      data: {
        guardId: guard.id,
        transactionId: transaction.id,
        amount: commissionAmount,
        rate: commissionRate,
        originalAmount: amount,
        guardReceives: guardReceivesAmount,
        type: 'TIP'
      }
    })
  }

  notifyGuard(
    guard.id,
    'TIP_RECEIVED',
    'You received a tip!',
    `R${guardReceivesAmount.toFixed(2)} has been added to your balance.`,
    { amount: guardReceivesAmount, newBalance: updatedGuard.balance }
  )

  return {
    tipId: tip.id,
    originalAmount: amount,
    commissionAmount,
    guardReceivesAmount
  }
}

export default router
