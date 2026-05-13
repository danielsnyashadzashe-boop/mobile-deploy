import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { notifyGuard } from '../lib/notifications'

const router = Router()

/**
 * POST /api/communications/notifications/send
 * Send a push notification from admin to one guard or all guards
 * Body: { guardId?, all?, title, message, type? }
 */
router.post('/notifications/send', async (req: Request, res: Response) => {
  try {
    const { guardId, all, title, message, type = 'ADMIN_MESSAGE' } = req.body

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'title and message are required' })
    }

    if (all) {
      // Broadcast to all active guards with a push token
      const guards = await prisma.carGuard.findMany({
        where: { status: 'ACTIVE', pushToken: { not: null } },
        select: { id: true },
      })

      await Promise.allSettled(
        guards.map(g => notifyGuard(g.id, type, title, message))
      )

      console.log(`📢 Admin broadcast sent to ${guards.length} guards`)
      return res.json({ success: true, sent: guards.length })
    }

    if (guardId) {
      // Find guard by guardId field or internal id
      const guard = await prisma.carGuard.findFirst({
        where: {
          OR: [
            { guardId },
            { id: guardId },
          ],
        },
        select: { id: true },
      })

      if (!guard) return res.status(404).json({ success: false, error: 'Guard not found' })

      await notifyGuard(guard.id, type, title, message)
      return res.json({ success: true, sent: 1 })
    }

    return res.status(400).json({ success: false, error: 'Provide guardId or set all: true' })
  } catch (error) {
    console.error('❌ Error sending notification:', error)
    return res.status(500).json({ success: false, error: 'Failed to send notification' })
  }
})

/**
 * GET /api/communications/notifications
 * Fetch recent notifications (for admin history view)
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { limit = '50' } = req.query

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    })

    return res.json({ success: true, data: notifications })
  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications' })
  }
})

export default router
