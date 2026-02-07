import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

/**
 * GET /api/qr/:guardId
 * Generate Netcash PayNow QR code URL for a guard
 */
router.get('/:guardId', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    console.log('📱 Generating QR code for guard:', guardId)

    // Find guard by guardId
    const guard = await prisma.carGuard.findUnique({
      where: { guardId },
      select: {
        id: true,
        guardId: true,
        name: true,
        surname: true,
        qrCode: true,
        balance: true,
        status: true,
        locationId: true
      }
    })

    if (!guard) {
      console.log('❌ Guard not found:', guardId)
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Generate Netcash PayNow QR code URL
    const directPaymentRef = `TIP_${guard.guardId}_${Date.now()}_QR`
    const baseQRUrl = process.env.NETCASH_BASE_URL || 'https://paynow.netcash.co.za/site/paynow.aspx'

    const serviceKey = process.env.NETCASH_SERVICE_KEY || '015a9dea-edc2-46b1-ad77-da3e05e640f6'
    const vendorKey = process.env.NETCASH_VENDOR_KEY || '24ade73c-98cf-47b3-99be-cc7b867b3080'
    const testMode = process.env.NETCASH_TEST_MODE || 'yes'

    const paymentData = {
      m1: serviceKey,
      m2: vendorKey,
      p2: directPaymentRef,
      p3: `Tip for ${guard.name} ${guard.surname}`,
      p4: '20.00', // Default R20 tip
      m4: '',
      m5: `${process.env.BASE_URL || 'http://localhost:3001'}/api/payments/return`,
      m6: `${process.env.BASE_URL || 'http://localhost:3001'}/api/payments/notify`,
      m10: testMode,
      Budget: 'Y'
    }

    const urlParams = new URLSearchParams(paymentData)
    const qrCodeValue = `${baseQRUrl}?${urlParams.toString()}`

    console.log('✅ Generated QR code URL for:', guard.guardId)

    return res.json({
      success: true,
      data: {
        guardId: guard.guardId,
        guardName: `${guard.name} ${guard.surname}`,
        qrCode: qrCodeValue,
        balance: guard.balance || 0,
        status: guard.status,
        qrData: {
          type: 'tip',
          guardId: guard.guardId,
          reference: directPaymentRef,
          createdAt: new Date().toISOString(),
          paymentUrl: qrCodeValue
        }
      }
    })
  } catch (error) {
    console.error('❌ Error generating QR code:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
