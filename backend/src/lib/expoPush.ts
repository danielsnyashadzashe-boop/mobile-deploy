const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
  priority?: 'default' | 'normal' | 'high'
}

interface PushResult {
  success: boolean
  error?: string
}

export async function sendExpoPush(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<PushResult> {
  if (!token || !token.startsWith('ExponentPushToken[')) {
    return { success: false, error: 'Invalid push token' }
  }

  const message: PushMessage = {
    to: token,
    title,
    body,
    sound: 'default',
    priority: 'high',
    data: data || {},
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json() as { data?: { status?: string; message?: string } }

    if (result.data?.status === 'error') {
      console.error('❌ Expo push error:', result.data.message)
      return { success: false, error: result.data.message }
    }

    console.log('📱 Push notification sent:', title)
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to send push notification:', error)
    return { success: false, error: 'Failed to send push notification' }
  }
}
