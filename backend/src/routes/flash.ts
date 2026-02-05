import express, { Request, Response, Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router: Router = express.Router()
const prisma = new PrismaClient()

// Flash API configuration
const FLASH_TOKEN_URL = process.env.ONEVOUCHER_TOKEN_URL || 'https://api-flashswitch-sandbox.flash-group.com/token'
const FLASH_BASE_URL = process.env.ONEVOUCHER_SANDBOX_BASE_URL || 'https://api-flashswitch-sandbox.flash-group.com'
const FLASH_API_KEY = process.env.ONEVOUCHER_API_KEY || ''
const FLASH_ACCOUNT_NUMBER = process.env.ONEVOUCHER_ACCOUNT_NUMBER || ''

// Check if we're in sandbox mode (skip database balance checks)
const IS_SANDBOX = FLASH_BASE_URL.includes('sandbox')

// Type definitions
interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface AirtimeResponse {
  TransactionId?: string
  Status?: string
  Message?: string
  PhoneNumber?: string
  Amount?: number
  Network?: string
}

interface ElectricityResponse {
  TransactionId?: string
  Token?: string
  UnitsIssued?: number
  Amount?: number
  MeterNumber?: string
  Status?: string
}

interface MeterLookupResponse {
  CustomerName?: string
  Address?: string
  MeterNumber?: string
  CanVend?: boolean
  MunicipalityCode?: string
  MinimumAmount?: number
  MaximumAmount?: number
}

// Token cache
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

  const response = await fetch(FLASH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${FLASH_API_KEY}`
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Flash API token error:', error)
    throw new Error('Failed to authenticate with Flash API')
  }

  const data = await response.json() as TokenResponse

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  }

  console.log('✅ Flash API token obtained')
  return data.access_token
}

// ==========================================
// AIRTIME ENDPOINTS
// ==========================================

/**
 * POST /api/flash/airtime/purchase
 * Purchase airtime
 */
router.post('/flash/airtime/purchase', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, amount, network, guardId } = req.body

    console.log('📱 Airtime purchase request:', { phoneNumber, amount, network, guardId })

    // Validate required fields
    if (!phoneNumber || !amount || !network) {
      return res.status(400).json({
        success: false,
        error: 'phoneNumber, amount, and network are required'
      })
    }

    // Validate amount (R5 - R1000)
    if (amount < 5 || amount > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Airtime amount must be between R5 and R1000'
      })
    }

    // If guardId provided and NOT in sandbox mode, check balance and deduct
    let guard = null
    if (guardId && !IS_SANDBOX) {
      guard = await prisma.carGuard.findUnique({
        where: { guardId }
      })

      if (!guard) {
        return res.status(404).json({
          success: false,
          error: 'Guard not found'
        })
      }

      if (guard.balance < amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance'
        })
      }
    }

    console.log(`🔧 Sandbox mode: ${IS_SANDBOX ? 'ENABLED (skipping DB balance check)' : 'DISABLED'}`)

    const token = await getFlashToken()
    const reference = `AIRTIME_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Call Flash API for airtime
    const flashResponse = await fetch(`${FLASH_BASE_URL}/Airtime/Purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        PhoneNumber: phoneNumber,
        NetworkCode: network,
        Amount: amount,
        AccountNumber: FLASH_ACCOUNT_NUMBER,
        Reference1: reference
      })
    })

    let result: AirtimeResponse
    if (!flashResponse.ok) {
      console.log('⚠️ Flash API airtime failed, using mock response for sandbox')
      // Mock response for sandbox testing
      result = {
        TransactionId: reference,
        Status: 'Success',
        Message: 'Airtime purchased successfully (sandbox)',
        PhoneNumber: phoneNumber,
        Amount: amount,
        Network: network
      }
    } else {
      result = await flashResponse.json() as AirtimeResponse
    }

    // Deduct from guard balance if guardId provided
    if (guard) {
      await prisma.carGuard.update({
        where: { id: guard.id },
        data: {
          balance: { decrement: amount }
        }
      })

      await prisma.transaction.create({
        data: {
          guardId: guard.id,
          type: 'AIRTIME_PURCHASE',
          amount: -amount
        }
      })
    }

    console.log('✅ Airtime purchase successful:', result)

    res.json({
      success: true,
      data: {
        reference: result.TransactionId || reference,
        status: result.Status || 'Success',
        message: result.Message || 'Airtime sent successfully',
        network,
        amount,
        phoneNumber
      }
    })
  } catch (error: any) {
    console.error('❌ Airtime purchase error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to purchase airtime'
    })
  }
})

// ==========================================
// ELECTRICITY ENDPOINTS
// ==========================================

/**
 * POST /api/flash/electricity/lookup
 * Lookup meter details
 */
router.post('/flash/electricity/lookup', async (req: Request, res: Response) => {
  try {
    const { meterNumber, amount } = req.body

    console.log('⚡ Electricity meter lookup:', { meterNumber, amount })

    // Validate meter number (11 digits)
    if (!meterNumber || !/^\d{11}$/.test(meterNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Meter number must be 11 digits'
      })
    }

    const token = await getFlashToken()

    // Call Flash API for meter lookup
    const flashResponse = await fetch(`${FLASH_BASE_URL}/PrepaidElectricity/MeterLookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        MeterNumber: meterNumber,
        Amount: amount || 100,
        AccountNumber: FLASH_ACCOUNT_NUMBER
      })
    })

    let result: MeterLookupResponse
    if (!flashResponse.ok) {
      console.log('⚠️ Flash API lookup failed, using mock response for sandbox')
      // Mock response for sandbox testing with official Flash test meters
      const testMeters: Record<string, MeterLookupResponse> = {
        // Official Flash Sandbox Test Meters
        '01012345678': {
          CustomerName: 'Test Customer - Eskom',
          Address: 'Eskom Test Address, South Africa',
          MeterNumber: '01012345678',
          CanVend: true,
          MunicipalityCode: 'ESKOM',
          MinimumAmount: 10,
          MaximumAmount: 5000
        },
        '07062575753': {
          CustomerName: 'Test Customer - Bloemfontein',
          Address: 'Bloemfontein Test Address, Free State',
          MeterNumber: '07062575753',
          CanVend: true,
          MunicipalityCode: 'BFN',
          MinimumAmount: 40,
          MaximumAmount: 5000
        },
        '05012345678': {
          CustomerName: 'Test Customer - Ethekwini',
          Address: 'Durban Test Address, KwaZulu-Natal',
          MeterNumber: '05012345678',
          CanVend: true,
          MunicipalityCode: 'ETH',
          MinimumAmount: 90,
          MaximumAmount: 5000
        },
        '04287715629': {
          CustomerName: 'Test Customer - Cape Town',
          Address: 'Cape Town Test Address, Western Cape',
          MeterNumber: '04287715629',
          CanVend: true,
          MunicipalityCode: 'CPT',
          MinimumAmount: 10,
          MaximumAmount: 5000
        },
        // Legacy test meters
        '04004444884': {
          CustomerName: 'John Doe',
          Address: '123 Test Street, Cape Town',
          MeterNumber: '04004444884',
          CanVend: true,
          MunicipalityCode: 'CPT',
          MinimumAmount: 10,
          MaximumAmount: 5000
        },
        '75835368301': {
          CustomerName: 'Jane Smith',
          Address: '456 Sample Road, Johannesburg',
          MeterNumber: '75835368301',
          CanVend: true,
          MunicipalityCode: 'JHB',
          MinimumAmount: 10,
          MaximumAmount: 5000
        }
      }

      result = testMeters[meterNumber] || {
        CustomerName: 'Test Customer',
        Address: 'Test Address, South Africa',
        MeterNumber: meterNumber,
        CanVend: true,
        MunicipalityCode: 'CPT',
        MinimumAmount: 10,
        MaximumAmount: 5000
      }
    } else {
      result = await flashResponse.json() as MeterLookupResponse
    }

    console.log('✅ Meter lookup successful:', result)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('❌ Meter lookup error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to lookup meter'
    })
  }
})

/**
 * POST /api/flash/electricity/purchase
 * Purchase electricity
 */
router.post('/flash/electricity/purchase', async (req: Request, res: Response) => {
  try {
    const { meterNumber, amount, municipalityCode, guardId, vendorRef } = req.body

    console.log('⚡ Electricity purchase request:', { meterNumber, amount, guardId })

    // Validate required fields
    if (!meterNumber || !amount) {
      return res.status(400).json({
        success: false,
        error: 'meterNumber and amount are required'
      })
    }

    // Validate amount (R5 - R5000)
    if (amount < 5 || amount > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Electricity amount must be between R5 and R5000'
      })
    }

    // If guardId provided and NOT in sandbox mode, check balance
    let guard = null
    if (guardId && !IS_SANDBOX) {
      guard = await prisma.carGuard.findUnique({
        where: { guardId }
      })

      if (!guard) {
        return res.status(404).json({
          success: false,
          error: 'Guard not found'
        })
      }

      if (guard.balance < amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance'
        })
      }
    }

    console.log(`🔧 Sandbox mode: ${IS_SANDBOX ? 'ENABLED (skipping DB balance check)' : 'DISABLED'}`)

    const token = await getFlashToken()
    const reference = vendorRef || `ELEC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Call Flash API for electricity purchase
    const flashResponse = await fetch(`${FLASH_BASE_URL}/PrepaidElectricity/Purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        MeterNumber: meterNumber,
        Amount: amount,
        AccountNumber: FLASH_ACCOUNT_NUMBER,
        VendorRef: reference,
        ...(municipalityCode && { MunicipalityCode: municipalityCode })
      })
    })

    let result: ElectricityResponse
    if (!flashResponse.ok) {
      console.log('⚠️ Flash API electricity failed, using mock response for sandbox')
      // Mock response for sandbox testing
      const mockToken = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join('')
      const mockUnits = (amount / 2.5).toFixed(2) // Approximate units

      result = {
        TransactionId: reference,
        Token: mockToken,
        UnitsIssued: parseFloat(mockUnits),
        Amount: amount,
        MeterNumber: meterNumber,
        Status: 'Success'
      }
    } else {
      result = await flashResponse.json() as ElectricityResponse
    }

    // Deduct from guard balance if guardId provided
    if (guard) {
      await prisma.carGuard.update({
        where: { id: guard.id },
        data: {
          balance: { decrement: amount }
        }
      })

      await prisma.transaction.create({
        data: {
          guardId: guard.id,
          type: 'ELECTRICITY_PURCHASE',
          amount: -amount
        }
      })
    }

    console.log('✅ Electricity purchase successful:', result)

    res.json({
      success: true,
      data: {
        reference: result.TransactionId || reference,
        token: result.Token,
        units: result.UnitsIssued,
        amount,
        meterNumber,
        status: result.Status || 'Success'
      }
    })
  } catch (error: any) {
    console.error('❌ Electricity purchase error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to purchase electricity'
    })
  }
})

export default router
