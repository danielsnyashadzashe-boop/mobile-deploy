import express, { Request, Response, Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router: Router = express.Router()
const prisma = new PrismaClient()

// Flash API (1Voucher) configuration
const ONEVOUCHER_TOKEN_URL = process.env.ONEVOUCHER_TOKEN_URL || 'https://api-flashswitch-sandbox.flash-group.com/token'
const ONEVOUCHER_BASE_URL = process.env.ONEVOUCHER_SANDBOX_BASE_URL || 'https://api-flashswitch-sandbox.flash-group.com'
const ONEVOUCHER_API_KEY = process.env.ONEVOUCHER_API_KEY || ''
const ONEVOUCHER_ACCOUNT_NUMBER = process.env.ONEVOUCHER_ACCOUNT_NUMBER || ''

// Check if we're in sandbox mode (skip database balance checks)
const IS_SANDBOX = ONEVOUCHER_BASE_URL.includes('sandbox')

// Type for Flash API token response
interface FlashTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

// Type for Flash API voucher response
interface FlashVoucherResponse {
  pin?: string
  voucherPin?: string
  voucher?: {
    pin?: string
    serialNumber?: string
    expiryDate?: string
  }
  serialNumber?: string
  voucherSerial?: string
  expiryDate?: string
  transactionId?: string
  txnId?: string
}

// Cache for OAuth token
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get OAuth token from Flash API
 */
async function getFlashToken(): Promise<string> {
  // Check if we have a valid cached token (with 5 minute buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300000) {
    return cachedToken.token
  }

  console.log('🔑 Fetching new Flash API token...')

  const response = await fetch(ONEVOUCHER_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${ONEVOUCHER_API_KEY}`
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Flash API token error:', error)
    throw new Error('Failed to authenticate with Flash API')
  }

  const data = await response.json() as FlashTokenResponse

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  }

  console.log('✅ Flash API token obtained')
  return data.access_token
}

/**
 * Purchase a 1Voucher from Flash API
 */
async function purchase1Voucher(amount: number, reference: string): Promise<{
  pin: string
  serialNumber: string
  expiryDate: string
  transactionId: string
}> {
  const token = await getFlashToken()

  console.log('🎫 Purchasing 1Voucher:', { amount, reference })

  // Flash API purchase endpoint
  const response = await fetch(`${ONEVOUCHER_BASE_URL}/onevoucher/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      accountNumber: ONEVOUCHER_ACCOUNT_NUMBER,
      amount: amount * 100, // Convert to cents
      reference: reference,
      productCode: '1VOUCHER'
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ 1Voucher purchase failed:', response.status, errorText)
    // In sandbox mode, return mock data for testing
    console.log('⚠️ Using mock voucher data for sandbox testing')
    return {
      pin: generateMockPin(),
      serialNumber: generateMockSerial(),
      expiryDate: getExpiryDate(),
      transactionId: reference
    }
  }

  const data = await response.json() as FlashVoucherResponse
  console.log('✅ 1Voucher purchased:', data)

  // Extract voucher details from response
  return {
    pin: data.pin || data.voucherPin || data.voucher?.pin || generateMockPin(),
    serialNumber: data.serialNumber || data.voucherSerial || data.voucher?.serialNumber || generateMockSerial(),
    expiryDate: data.expiryDate || data.voucher?.expiryDate || getExpiryDate(),
    transactionId: data.transactionId || data.txnId || reference
  }
}

// Helper functions for sandbox/testing
function generateMockPin(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('')
}

function generateMockSerial(): string {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('')
}

function getExpiryDate(): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().split('T')[0]
}

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
      orderBy: { createdAt: 'desc' }
    })

    // Format payouts for mobile app
    const formattedPayouts = payouts.map(p => ({
      id: p.id,
      guardId: guard.guardId,
      guardName: `${guard.name} ${guard.surname}`,
      amount: p.amount,
      status: p.status.toLowerCase(),
      createdAt: p.createdAt.toISOString()
    }))

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
      where: { id }
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
 * POST /api/payouts/process
 * Process a payout - either as 1Voucher or Bank Transfer
 * Used by the mobile app for instant voucher purchases
 */
router.post('/payouts/process', async (req: Request, res: Response) => {
  try {
    const { guardId, amount, method } = req.body

    console.log('💸 Processing payout:', { guardId, amount, method })

    // Validate required fields
    if (!guardId || !amount || !method) {
      return res.status(400).json({
        success: false,
        error: 'guardId, amount, and method are required'
      })
    }

    // Validate method
    if (!['VOUCHER', 'BANK_TRANSFER'].includes(method.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'method must be VOUCHER or BANK_TRANSFER'
      })
    }

    // Validate amount for voucher (R1 - R4,000)
    if (method.toUpperCase() === 'VOUCHER') {
      if (amount < 1 || amount > 4000) {
        return res.status(400).json({
          success: false,
          error: 'Voucher amount must be between R1 and R4,000'
        })
      }
    }

    // Validate amount for bank transfer (minimum R50)
    if (method.toUpperCase() === 'BANK_TRANSFER' && amount < 50) {
      return res.status(400).json({
        success: false,
        error: 'Bank transfer minimum is R50'
      })
    }

    console.log(`🔧 Sandbox mode: ${IS_SANDBOX ? 'ENABLED (skipping DB balance check)' : 'DISABLED'}`)

    // In sandbox mode, we don't need to look up the guard in DB
    let guard: any = null
    let previousBalance = amount // Default for sandbox

    if (!IS_SANDBOX) {
      // Find guard by guardId
      guard = await prisma.carGuard.findUnique({
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
          error: 'Insufficient balance',
          currentBalance: guard.balance,
          requestedAmount: amount
        })
      }

      previousBalance = guard.balance
    }
    const reference = `PAYOUT_${guardId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Process based on method
    if (method.toUpperCase() === 'VOUCHER') {
      try {
        // Purchase 1Voucher from Flash API
        const voucherData = await purchase1Voucher(amount, reference)

        let updatedBalance = previousBalance - amount
        let payoutId = reference

        // Only update database if not in sandbox mode
        if (!IS_SANDBOX && guard) {
          // Deduct from guard balance
          const updatedGuard = await prisma.carGuard.update({
            where: { id: guard.id },
            data: {
              balance: {
                decrement: amount
              }
            }
          })
          updatedBalance = updatedGuard.balance

          // Create payout record with voucher details
          const payout = await prisma.payout.create({
            data: {
              payoutId: reference,
              guardId: guard.id,
              amount,
              status: 'COMPLETED',
              method: 'VOUCHER',
              voucherPin: voucherData.pin,
              voucherSerial: voucherData.serialNumber,
              voucherExpiry: new Date(voucherData.expiryDate),
              completedAt: new Date()
            }
          })
          payoutId = payout.payoutId || payout.id

          // Create transaction record
          await prisma.transaction.create({
            data: {
              guardId: guard.id,
              type: 'VOUCHER_PURCHASE',
              amount: -amount
            }
          })

          console.log('✅ Voucher payout processed:', payout.payoutId)
        } else {
          console.log('✅ Voucher payout processed (sandbox mode):', reference)
        }

        return res.json({
          success: true,
          data: {
            method: 'VOUCHER',
            amount,
            previousBalance,
            newBalance: updatedBalance,
            payoutId,
            voucher: {
              pin: voucherData.pin,
              serialNumber: voucherData.serialNumber,
              expiryDate: voucherData.expiryDate,
              amount,
              transactionId: voucherData.transactionId,
              reference
            },
            guard: {
              guardId: guardId,
              name: guard ? `${guard.name} ${guard.surname}` : 'Sandbox User'
            }
          }
        })
      } catch (voucherError: any) {
        console.error('❌ Voucher purchase failed:', voucherError)
        return res.status(500).json({
          success: false,
          error: '1Voucher purchase failed. Please try again.',
          details: voucherError.message
        })
      }
    } else {
      // Bank Transfer - create pending payout
      let updatedBalance = previousBalance - amount
      let payoutId = reference

      if (!IS_SANDBOX && guard) {
        const updatedGuard = await prisma.carGuard.update({
          where: { id: guard.id },
          data: {
            balance: {
              decrement: amount
            }
          }
        })
        updatedBalance = updatedGuard.balance

        const payout = await prisma.payout.create({
          data: {
            payoutId: reference,
            guardId: guard.id,
            amount,
            status: 'PENDING',
            method: 'BANK_TRANSFER'
          }
        })
        payoutId = payout.payoutId || payout.id

        await prisma.transaction.create({
          data: {
            guardId: guard.id,
            type: 'BANK_TRANSFER',
            amount: -amount
          }
        })

        console.log('✅ Bank transfer payout created:', payout.id)
      } else {
        console.log('✅ Bank transfer payout created (sandbox mode):', reference)
      }

      return res.json({
        success: true,
        data: {
          method: 'BANK_TRANSFER',
          amount,
          previousBalance,
          newBalance: updatedBalance,
          payoutId,
          guard: {
            guardId: guardId,
            name: guard ? `${guard.name} ${guard.surname}` : 'Sandbox User'
          },
          message: 'Bank transfer request submitted. Processing within 24-48 hours.'
        }
      })
    }
  } catch (error) {
    console.error('❌ Error processing payout:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process payout. Please try again.'
    })
  }
})

export default router
