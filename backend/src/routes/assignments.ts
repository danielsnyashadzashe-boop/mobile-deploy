import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

// ==================== GUARD ASSIGNMENT ROUTES ====================

/**
 * GET /api/guards/:guardId/assignment
 * Get guard's current assignment (location and manager)
 */
router.get('/guards/:guardId/assignment', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params

    // Find by guardId (human-readable) or database id (UUID)
    const guard = await prisma.carGuard.findFirst({
      where: {
        OR: [
          { guardId },
          { id: guardId }
        ]
      },
      include: {
        location: true
      }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Manually fetch supervising manager to avoid circular reference
    let supervisingManagerData = null
    if (guard.supervisingManagerId) {
      supervisingManagerData = await prisma.carGuard.findUnique({
        where: { id: guard.supervisingManagerId },
        select: {
          id: true,
          guardId: true,
          name: true,
          surname: true,
          phone: true
        }
      })
    }

    return res.json({
      success: true,
      data: {
        location: guard.location ? {
          id: guard.location.id,
          locationId: guard.location.locationId,
          name: guard.location.name,
          address: guard.location.address,
          city: guard.location.city,
          province: guard.location.province,
          operatingHours: guard.location.operatingHours,
          assignedAt: guard.locationAssignedAt
        } : null,
        manager: supervisingManagerData ? {
          id: supervisingManagerData.id,
          guardId: supervisingManagerData.guardId,
          name: `${supervisingManagerData.name} ${supervisingManagerData.surname}`,
          phone: supervisingManagerData.phone,
          email: null,
          assignedAt: guard.managerAssignedAt
        } : null
      }
    })
  } catch (error) {
    console.error('Error fetching guard assignment:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch guard assignment'
    })
  }
})

/**
 * POST /api/guards/:guardId/assign-location
 * Assign guard to a location
 */
router.post('/guards/:guardId/assign-location', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    const { locationId, reason, changedBy } = req.body

    if (!locationId || !changedBy) {
      return res.status(400).json({
        success: false,
        error: 'locationId and changedBy are required'
      })
    }

    // Find guard
    const guard = await prisma.carGuard.findFirst({
      where: {
        OR: [{ guardId }, { id: guardId }]
      }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId }
    })

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      })
    }

    // If guard was previously assigned to a location, close that history record
    if (guard.locationId) {
      await prisma.locationHistory.updateMany({
        where: {
          guardId: guard.id,
          removedAt: null
        },
        data: {
          removedAt: new Date(),
          reason: reason || 'Reassigned to new location'
        }
      })
    }

    // Create new location history record
    await prisma.locationHistory.create({
      data: {
        guardId: guard.id,
        locationId,
        assignedAt: new Date(),
        reason: reason || 'Location assignment',
        changedBy
      }
    })

    // Update guard's current location
    const updatedGuard = await prisma.carGuard.update({
      where: { id: guard.id },
      data: {
        locationId,
        locationAssignedAt: new Date()
      },
      include: {
        location: true
      }
    })

    return res.json({
      success: true,
      message: 'Guard assigned to location successfully',
      data: {
        guardId: updatedGuard.guardId,
        locationId: updatedGuard.location.locationId,
        locationName: updatedGuard.location.name,
        assignedAt: updatedGuard.locationAssignedAt
      }
    })
  } catch (error) {
    console.error('Error assigning guard to location:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to assign guard to location'
    })
  }
})

/**
 * POST /api/guards/:guardId/assign-manager
 * Assign guard to a manager (who is also a guard with isManager=true)
 */
router.post('/guards/:guardId/assign-manager', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    const { managerId, reason, changedBy } = req.body

    if (!managerId || !changedBy) {
      return res.status(400).json({
        success: false,
        error: 'managerId and changedBy are required'
      })
    }

    // Find guard
    const guard = await prisma.carGuard.findFirst({
      where: {
        OR: [{ guardId }, { id: guardId }]
      }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    // Verify manager exists and is actually a manager
    const manager = await prisma.carGuard.findFirst({
      where: {
        OR: [{ guardId: managerId }, { id: managerId }],
        isManager: true
      }
    })

    if (!manager) {
      return res.status(404).json({
        success: false,
        error: 'Manager not found or guard is not a manager'
      })
    }

    // Prevent circular assignment (guard cannot manage themselves)
    if (guard.id === manager.id) {
      return res.status(400).json({
        success: false,
        error: 'Guard cannot be assigned to themselves as manager'
      })
    }

    // If guard was previously assigned to a manager, close that history record
    if (guard.supervisingManagerId) {
      await prisma.managerHistory.updateMany({
        where: {
          guardId: guard.id,
          removedAt: null
        },
        data: {
          removedAt: new Date(),
          reason: reason || 'Reassigned to new manager'
        }
      })
    }

    // Create new manager history record
    await prisma.managerHistory.create({
      data: {
        guardId: guard.id,
        managerId: manager.id,
        assignedAt: new Date(),
        reason: reason || 'Manager assignment',
        changedBy
      }
    })

    // Update guard's current manager
    const updatedGuard = await prisma.carGuard.update({
      where: { id: guard.id },
      data: {
        supervisingManagerId: manager.id,
        managerAssignedAt: new Date()
      }
    })

    return res.json({
      success: true,
      message: 'Guard assigned to manager successfully',
      data: {
        guardId: updatedGuard.guardId,
        managerId: manager.guardId,
        managerName: `${manager.name} ${manager.surname}`,
        assignedAt: updatedGuard.managerAssignedAt
      }
    })
  } catch (error) {
    console.error('Error assigning guard to manager:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to assign guard to manager'
    })
  }
})

/**
 * POST /api/guards/:guardId/remove-location
 * Remove guard from their current location
 */
router.post('/guards/:guardId/remove-location', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    const { reason, changedBy } = req.body

    if (!changedBy) {
      return res.status(400).json({
        success: false,
        error: 'changedBy is required'
      })
    }

    // Find guard
    const guard = await prisma.carGuard.findFirst({
      where: {
        OR: [{ guardId }, { id: guardId }]
      }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    if (!guard.locationId) {
      return res.status(400).json({
        success: false,
        error: 'Guard is not assigned to any location'
      })
    }

    // Close current location history
    await prisma.locationHistory.updateMany({
      where: {
        guardId: guard.id,
        removedAt: null
      },
      data: {
        removedAt: new Date(),
        reason: reason || 'Location removed'
      }
    })

    return res.json({
      success: true,
      message: 'Guard removed from location successfully'
    })
  } catch (error) {
    console.error('Error removing guard from location:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to remove guard from location'
    })
  }
})

/**
 * POST /api/guards/:guardId/remove-manager
 * Remove guard from their current manager
 */
router.post('/guards/:guardId/remove-manager', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    const { reason, changedBy } = req.body

    if (!changedBy) {
      return res.status(400).json({
        success: false,
        error: 'changedBy is required'
      })
    }

    // Find guard
    const guard = await prisma.carGuard.findFirst({
      where: {
        OR: [{ guardId }, { id: guardId }]
      }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    if (!guard.supervisingManagerId) {
      return res.status(400).json({
        success: false,
        error: 'Guard is not assigned to any manager'
      })
    }

    // Close current manager history
    await prisma.managerHistory.updateMany({
      where: {
        guardId: guard.id,
        removedAt: null
      },
      data: {
        removedAt: new Date(),
        reason: reason || 'Manager removed'
      }
    })

    // Remove manager assignment
    await prisma.carGuard.update({
      where: { id: guard.id },
      data: {
        supervisingManagerId: null,
        managerAssignedAt: null
      }
    })

    return res.json({
      success: true,
      message: 'Guard removed from manager successfully'
    })
  } catch (error) {
    console.error('Error removing guard from manager:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to remove guard from manager'
    })
  }
})

// ==================== HISTORY ROUTES ====================

/**
 * GET /api/guards/:guardId/location-history
 * Get guard's location assignment history
 */
router.get('/guards/:guardId/location-history', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    const limit = parseInt(req.query.limit as string) || 10
    const offset = parseInt(req.query.offset as string) || 0

    // Find guard
    const guard = await prisma.carGuard.findFirst({
      where: {
        OR: [{ guardId }, { id: guardId }]
      }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    const history = await prisma.locationHistory.findMany({
      where: { guardId: guard.id },
      include: {
        location: {
          select: {
            id: true,
            locationId: true,
            name: true,
            address: true,
            city: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' },
      take: limit,
      skip: offset
    })

    const formattedHistory = history.map(h => ({
      id: h.id,
      location: {
        id: h.location.id,
        locationId: h.location.locationId,
        name: h.location.name,
        address: h.location.address,
        city: h.location.city
      },
      assignedAt: h.assignedAt,
      removedAt: h.removedAt,
      reason: h.reason,
      isCurrent: h.removedAt === null
    }))

    return res.json({
      success: true,
      data: formattedHistory
    })
  } catch (error) {
    console.error('Error fetching location history:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch location history'
    })
  }
})

/**
 * GET /api/guards/:guardId/manager-history
 * Get guard's manager assignment history
 */
router.get('/guards/:guardId/manager-history', async (req: Request, res: Response) => {
  try {
    const { guardId } = req.params
    const limit = parseInt(req.query.limit as string) || 10
    const offset = parseInt(req.query.offset as string) || 0

    // Find guard
    const guard = await prisma.carGuard.findFirst({
      where: {
        OR: [{ guardId }, { id: guardId }]
      }
    })

    if (!guard) {
      return res.status(404).json({
        success: false,
        error: 'Guard not found'
      })
    }

    const history = await prisma.managerHistory.findMany({
      where: { guardId: guard.id },
      orderBy: { assignedAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Manually fetch manager details for each history record
    const formattedHistory = await Promise.all(
      history.map(async (h) => {
        const manager = await prisma.carGuard.findUnique({
          where: { id: h.managerId },
          select: {
            id: true,
            guardId: true,
            name: true,
            surname: true,
            phone: true
          }
        })

        return {
          id: h.id,
          manager: manager ? {
            id: manager.id,
            guardId: manager.guardId,
            name: `${manager.name} ${manager.surname}`,
            phone: manager.phone,
            email: null
          } : null,
          assignedAt: h.assignedAt,
          removedAt: h.removedAt,
          reason: h.reason,
          isCurrent: h.removedAt === null
        }
      })
    )

    return res.json({
      success: true,
      data: formattedHistory
    })
  } catch (error) {
    console.error('Error fetching manager history:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch manager history'
    })
  }
})

// ==================== MANAGER TEAM ROUTES ====================

/**
 * GET /api/managers/:managerId/guards
 * Get all guards under a manager's supervision
 */
router.get('/managers/:managerId/guards', async (req: Request, res: Response) => {
  try {
    const { managerId } = req.params
    const status = req.query.status as string
    const joinDateFrom = req.query.joinDateFrom as string
    const joinDateTo = req.query.joinDateTo as string
    const sortBy = (req.query.sortBy as string) || 'joinDate'
    const sortOrder = (req.query.sortOrder as string) || 'desc'
    const limit = parseInt(req.query.limit as string) || 10
    const offset = parseInt(req.query.offset as string) || 0

    // Find manager
    const manager = await prisma.carGuard.findFirst({
      where: {
        OR: [{ guardId: managerId }, { id: managerId }],
        isManager: true
      }
    })

    if (!manager) {
      return res.status(404).json({
        success: false,
        error: 'Manager not found'
      })
    }

    // Build where clause
    const where: any = {
      supervisingManagerId: manager.id
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (joinDateFrom || joinDateTo) {
      where.managerAssignedAt = {}
      if (joinDateFrom) where.managerAssignedAt.gte = new Date(joinDateFrom)
      if (joinDateTo) where.managerAssignedAt.lte = new Date(joinDateTo)
    }

    // Build orderBy
    let orderBy: any = {}
    if (sortBy === 'name') {
      orderBy = { name: sortOrder }
    } else if (sortBy === 'joinDate') {
      orderBy = { managerAssignedAt: sortOrder }
    } else if (sortBy === 'earnings') {
      orderBy = { lifetimeEarnings: sortOrder }
    }

    // Fetch guards
    const guards = await prisma.carGuard.findMany({
      where,
      include: {
        location: {
          select: {
            name: true,
            address: true
          }
        }
      },
      orderBy,
      take: limit,
      skip: offset
    })

    // Calculate team stats
    const totalGuards = await prisma.carGuard.count({
      where: { supervisingManagerId: manager.id }
    })

    const activeGuards = await prisma.carGuard.count({
      where: {
        supervisingManagerId: manager.id,
        status: 'ACTIVE'
      }
    })

    // Calculate today's earnings for the team
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayTransactions = await prisma.transaction.findMany({
      where: {
        guard: {
          supervisingManagerId: manager.id
        },
        type: 'TIP',
        createdAt: {
          gte: today
        }
      },
      select: {
        amount: true
      }
    })

    const todayTeamEarnings = todayTransactions.reduce((sum, t) => sum + t.amount, 0)

    // Format guards data
    const formattedGuards = guards.map(g => ({
      id: g.id,
      guardId: g.guardId,
      name: g.name,
      surname: g.surname,
      fullName: `${g.name} ${g.surname}`,
      phone: g.phone,
      status: g.status,
      joinedTeamAt: g.managerAssignedAt,
      todayEarnings: 0, // Calculate separately if needed
      totalEarnings: g.lifetimeEarnings,
      rating: g.rating,
      location: g.location ? {
        name: g.location.name,
        address: g.location.address
      } : null
    }))

    return res.json({
      success: true,
      data: {
        guards: formattedGuards,
        stats: {
          totalGuards,
          activeGuards,
          inactiveGuards: totalGuards - activeGuards,
          todayTeamEarnings
        },
        pagination: {
          total: totalGuards,
          limit,
          offset,
          hasMore: offset + limit < totalGuards
        }
      }
    })
  } catch (error) {
    console.error('Error fetching manager guards:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch manager guards'
    })
  }
})

/**
 * GET /api/managers/:managerId/stats
 * Get manager's team statistics
 */
router.get('/managers/:managerId/stats', async (req: Request, res: Response) => {
  try {
    const { managerId } = req.params

    // Find manager
    const manager = await prisma.carGuard.findFirst({
      where: {
        OR: [{ guardId: managerId }, { id: managerId }],
        isManager: true
      }
    })

    if (!manager) {
      return res.status(404).json({
        success: false,
        error: 'Manager not found'
      })
    }

    // Get team size
    const teamSize = await prisma.carGuard.count({
      where: { supervisingManagerId: manager.id }
    })

    const activeGuards = await prisma.carGuard.count({
      where: {
        supervisingManagerId: manager.id,
        status: 'ACTIVE'
      }
    })

    // Calculate earnings
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)

    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    monthAgo.setHours(0, 0, 0, 0)

    const [todayTx, weekTx, monthTx] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          guard: { supervisingManagerId: manager.id },
          type: 'TIP',
          createdAt: { gte: today }
        },
        select: { amount: true }
      }),
      prisma.transaction.findMany({
        where: {
          guard: { supervisingManagerId: manager.id },
          type: 'TIP',
          createdAt: { gte: weekAgo }
        },
        select: { amount: true }
      }),
      prisma.transaction.findMany({
        where: {
          guard: { supervisingManagerId: manager.id },
          type: 'TIP',
          createdAt: { gte: monthAgo }
        },
        select: { amount: true }
      })
    ])

    const todayEarnings = todayTx.reduce((sum, t) => sum + t.amount, 0)
    const weekEarnings = weekTx.reduce((sum, t) => sum + t.amount, 0)
    const monthEarnings = monthTx.reduce((sum, t) => sum + t.amount, 0)

    // Get top performer
    const guards = await prisma.carGuard.findMany({
      where: { supervisingManagerId: manager.id },
      orderBy: { lifetimeEarnings: 'desc' },
      take: 1,
      select: {
        id: true,
        guardId: true,
        name: true,
        surname: true,
        lifetimeEarnings: true
      }
    })

    const topPerformer = guards[0] ? {
      id: guards[0].id,
      guardId: guards[0].guardId,
      name: `${guards[0].name} ${guards[0].surname}`,
      earnings: guards[0].lifetimeEarnings
    } : null

    // Get new joins
    const newJoinsThisWeek = await prisma.carGuard.count({
      where: {
        supervisingManagerId: manager.id,
        managerAssignedAt: { gte: weekAgo }
      }
    })

    const newJoinsThisMonth = await prisma.carGuard.count({
      where: {
        supervisingManagerId: manager.id,
        managerAssignedAt: { gte: monthAgo }
      }
    })

    return res.json({
      success: true,
      data: {
        teamSize,
        activeGuards,
        todayEarnings,
        weekEarnings,
        monthEarnings,
        topPerformer,
        newJoins: {
          thisWeek: newJoinsThisWeek,
          thisMonth: newJoinsThisMonth
        }
      }
    })
  } catch (error) {
    console.error('Error fetching manager stats:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch manager stats'
    })
  }
})

export default router
