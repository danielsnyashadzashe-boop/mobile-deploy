import express, { Request, Response, Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router: Router = express.Router()
const prisma = new PrismaClient()

// Helper function to get default description for transaction types
function getDefaultDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'TIP': 'Tip received',
    'PAYOUT': 'Payout',
    'AIRTIME': 'Airtime purchase',
    'ELECTRICITY': 'Electricity purchase',
    'COMMISSION': 'Commission deducted',
    'OTHER': 'Transaction'
  }
  return descriptions[type] || 'Transaction'
}

/**
 * GET /api/transactions/guard/:guardId
 * Get all transactions for a specific guard
 */
router.get('/transactions/guard/:guardId', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    const { limit = '50', offset = '0', type } = req.query

    console.log('🔍 Fetching transactions for guard:', guardId)

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

    // Build where clause
    const where: any = { guardId: guard.id }
    if (type && typeof type === 'string') {
      where.type = type.toUpperCase()
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    })

    // Get total count
    const totalCount = await prisma.transaction.count({ where })

    // Calculate totals
    const tips = transactions.filter(t => t.type === 'TIP')
    const payouts = transactions.filter(t => t.type === 'PAYOUT')
    const airtime = transactions.filter(t => t.type === 'AIRTIME')
    const electricity = transactions.filter(t => t.type === 'ELECTRICITY')

    const totalTips = tips.reduce((sum, t) => sum + t.amount, 0)
    const totalPayouts = payouts.reduce((sum, t) => sum + t.amount, 0)
    const totalAirtime = airtime.reduce((sum, t) => sum + t.amount, 0)
    const totalElectricity = electricity.reduce((sum, t) => sum + t.amount, 0)

    // Format transactions for mobile app
    const formattedTransactions = transactions.map(t => {
      const date = new Date(t.createdAt)
      return {
        id: t.id,
        guardId: guard.guardId,
        guardName: `${guard.name} ${guard.surname}`,
        type: t.type.toLowerCase() as any,
        amount: t.amount,
        balance: t.balance || guard.balance,
        description: t.description || getDefaultDescription(t.type),
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().slice(0, 5),
        status: (t.status?.toLowerCase() || 'completed') as any,
        reference: t.reference,
        metadata: t.metadata as any
      }
    })

    console.log(`✅ Found ${transactions.length} transactions for guard:`, guardId)

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        summary: {
          totalCount,
          totalTips,
          totalPayouts,
          totalAirtime,
          totalElectricity,
          netBalance: totalTips - totalPayouts - totalAirtime - totalElectricity
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
 * GET /api/transactions/:id
 * Get a specific transaction by ID
 */
router.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const transaction = await prisma.transaction.findUnique({
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

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      })
    }

    res.json({
      success: true,
      data: transaction
    })
  } catch (error) {
    console.error('❌ Error fetching transaction:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction'
    })
  }
})

/**
 * POST /api/transactions
 * Create a new transaction (for airtime, electricity, etc.)
 */
router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const {
      guardId,
      type,
      amount,
      description,
      reference,
      metadata
    } = req.body

    console.log('💳 Creating transaction:', { guardId, type, amount })

    // Validate required fields
    if (!guardId || !type || !amount) {
      return res.status(400).json({
        success: false,
        error: 'guardId, type, and amount are required'
      })
    }

    // Validate transaction type
    const validTypes = ['TIP', 'PAYOUT', 'AIRTIME', 'ELECTRICITY', 'COMMISSION', 'OTHER']
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
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

    const transactionType = type.toUpperCase()
    let newBalance = guard.balance

    // For airtime and electricity, check balance and deduct
    if (transactionType === 'AIRTIME' || transactionType === 'ELECTRICITY') {
      if (guard.balance < amount) {
        return res.status(400).json({
          success: false,
          error: `Insufficient balance. Current balance: R${guard.balance.toFixed(2)}`
        })
      }

      // Deduct from balance
      await prisma.carGuard.update({
        where: { id: guard.id },
        data: {
          balance: {
            decrement: amount
          }
        }
      })
      newBalance = guard.balance - amount
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        guardId: guard.id,
        type: transactionType,
        amount,
        status: 'COMPLETED',
        description,
        reference,
        metadata,
        balance: newBalance
      }
    })

    console.log('✅ Transaction created:', transaction.id)

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        id: transaction.id,
        type: transaction.type.toLowerCase(),
        amount: transaction.amount,
        status: transaction.status.toLowerCase(),
        newBalance
      }
    })
  } catch (error) {
    console.error('❌ Error creating transaction:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction'
    })
  }
})

export default router
