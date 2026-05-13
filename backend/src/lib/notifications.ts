import prisma from './prisma'
import { sendExpoPush } from './expoPush'

export async function notifyGuard(
  guardInternalId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  const guard = await prisma.carGuard.findUnique({
    where: { id: guardInternalId },
    select: { userId: true, pushToken: true },
  })
  if (!guard) return

  const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  await prisma.notification.create({
    data: {
      userId: guard.userId,
      guardId: guardInternalId,
      notificationId,
      type,
      channel: 'PUSH',
      title,
      message,
      status: 'SENT',
      metadata: metadata ? (metadata as any) : null,
    },
  })

  if (guard.pushToken) {
    await sendExpoPush(guard.pushToken, title, message, { type, ...metadata })
  }
}
