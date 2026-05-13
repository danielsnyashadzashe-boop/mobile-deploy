import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import prisma from './lib/prisma'
import registrationRoutes from './routes/registration'
import uploadRoutes from './routes/upload'
import guardsRoutes from './routes/guards'
import qrRoutes from './routes/qr'
import adminRoutes from './routes/admin'
import commissionRoutes from './routes/commission'
import tipsRoutes from './routes/tips'
import mobileRoutes from './routes/mobile'
import payoutsRoutes from './routes/payouts'
import flashRoutes from './routes/flash'
import clerkWebhookRoutes from './routes/clerk-webhook'
import authRoutes from './routes/auth'
import communicationsRoutes from './routes/communications'

// Load environment variables
dotenv.config()

const app: Express = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// Middleware
app.use(cors({
  origin: '*', // In production, restrict this to your mobile app domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api', authRoutes)           // Mobile JWT auth (login, refresh, logout)
app.use('/api/registration', registrationRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/guards', guardsRoutes)
app.use('/api/qr', qrRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', commissionRoutes)
app.use('/api', tipsRoutes)
app.use('/api', mobileRoutes)         // Mobile app endpoints
app.use('/api', payoutsRoutes)        // 1Voucher and payout endpoints
app.use('/api', flashRoutes)          // Flash API endpoints (airtime, electricity)
app.use('/api/webhooks', clerkWebhookRoutes) // Clerk webhooks for user sync
app.use('/api/communications', communicationsRoutes) // Admin-to-guard messaging

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`)
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'}`)
  console.log(`📱 Mobile: Android emulator can connect via http://10.0.2.2:${PORT}`)

  // Seed Netcash service key into Settings if not already there
  if (process.env.NETCASH_SERVICE_KEY) {
    try {
      await prisma.settings.upsert({
        where: { key: 'netcash_service_key' },
        update: {},  // never overwrite once set
        create: {
          key: 'netcash_service_key',
          value: process.env.NETCASH_SERVICE_KEY,
          type: 'STRING',
          category: 'PAYMENT',
          description: 'Netcash service key for webhook verification',
          isPublic: false,
        },
      })
      console.log(`🔑 Netcash service key: seeded`)
    } catch (err) {
      console.error('⚠️  Failed to seed Netcash service key:', err)
    }
  }
})

export default app
