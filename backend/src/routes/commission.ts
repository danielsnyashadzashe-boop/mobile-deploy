import express, { Request, Response, Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router: Router = express.Router()
const prisma = new PrismaClient()

// ==================== GET ALL COMMISSION SETTINGS ====================
router.get('/commission-settings', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.commissionSetting.findMany({
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error fetching commission settings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commission settings'
    })
  }
})

// ==================== GET ACTIVE COMMISSION SETTING ====================
router.get('/commission-settings/active', async (req: Request, res: Response) => {
  try {
    const activeSetting = await prisma.commissionSetting.findFirst({
      where: {
        isActive: true,
        OR: [
          { appliesTo: 'TIPS' },
          { appliesTo: 'ALL' }
        ]
      },
      orderBy: { effectiveFrom: 'desc' }
    })

    res.json({
      success: true,
      data: activeSetting
    })
  } catch (error) {
    console.error('Error fetching active commission setting:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active commission setting'
    })
  }
})

// ==================== CREATE COMMISSION SETTING ====================
router.post('/commission-settings', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      percentage,
      appliesTo = 'TIPS',
      setByAdminName,
      setByAdminEmail,
      effectiveFrom,
      isActive = false
    } = req.body

    // Validate required fields
    if (!name || percentage === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name and percentage are required'
      })
    }

    // Validate percentage
    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Percentage must be between 0 and 100'
      })
    }

    // If setting this as active, deactivate all other settings
    if (isActive) {
      await prisma.commissionSetting.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      })
    }

    // Generate unique settingId
    const settingId = `CS-${Date.now()}`

    const setting = await prisma.commissionSetting.create({
      data: {
        settingId,
        name,
        description,
        percentage,
        appliesTo,
        setByAdminName,
        setByAdminEmail,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        isActive
      }
    })

    res.status(201).json({
      success: true,
      message: 'Commission setting created successfully',
      data: setting
    })
  } catch (error) {
    console.error('Error creating commission setting:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create commission setting'
    })
  }
})

// ==================== UPDATE COMMISSION SETTING ====================
router.put('/commission-settings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      name,
      description,
      percentage,
      appliesTo,
      isActive,
      effectiveUntil
    } = req.body

    // Validate percentage if provided
    if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Percentage must be between 0 and 100'
      })
    }

    // If setting this as active, deactivate all other settings
    if (isActive === true) {
      await prisma.commissionSetting.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      })
    }

    const setting = await prisma.commissionSetting.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(percentage !== undefined && { percentage }),
        ...(appliesTo && { appliesTo }),
        ...(isActive !== undefined && { isActive }),
        ...(effectiveUntil && { effectiveUntil: new Date(effectiveUntil) })
      }
    })

    res.json({
      success: true,
      message: 'Commission setting updated successfully',
      data: setting
    })
  } catch (error) {
    console.error('Error updating commission setting:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update commission setting'
    })
  }
})

// ==================== DELETE COMMISSION SETTING ====================
router.delete('/commission-settings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.commissionSetting.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Commission setting deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting commission setting:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete commission setting'
    })
  }
})

// ==================== GET GUARD COMMISSIONS ====================
router.get('/commissions/guard/:guardId', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params

    const commissions = await prisma.commission.findMany({
      where: { guardId },
      orderBy: { createdAt: 'desc' }
    })

    const total = commissions.reduce((sum, c) => sum + c.amount, 0)

    res.json({
      success: true,
      data: {
        commissions,
        total,
        count: commissions.length
      }
    })
  } catch (error) {
    console.error('Error fetching guard commissions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guard commissions'
    })
  }
})

// ==================== CALCULATE COMMISSION ====================
router.post('/commission/calculate', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      })
    }

    // Get active commission setting
    const activeSetting = await prisma.commissionSetting.findFirst({
      where: {
        isActive: true,
        OR: [
          { appliesTo: 'TIPS' },
          { appliesTo: 'ALL' }
        ]
      }
    })

    const rate = activeSetting ? activeSetting.percentage : 0
    const commissionAmount = amount * (rate / 100)
    const guardReceives = amount - commissionAmount

    res.json({
      success: true,
      data: {
        originalAmount: amount,
        commissionRate: rate,
        commissionAmount: parseFloat(commissionAmount.toFixed(2)),
        guardReceivesAmount: parseFloat(guardReceives.toFixed(2))
      }
    })
  } catch (error) {
    console.error('Error calculating commission:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to calculate commission'
    })
  }
})

export default router
