import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import registrationRoutes from './routes/registration'
import uploadRoutes from './routes/upload'
import guardsRoutes from './routes/guards'
import qrRoutes from './routes/qr'
import adminRoutes from './routes/admin'
import commissionRoutes from './routes/commission'
import tipsRoutes from './routes/tips'

// Load environment variables
dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3001

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
app.use('/api/registration', registrationRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/guards', guardsRoutes)
app.use('/api/qr', qrRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', commissionRoutes)
app.use('/api', tipsRoutes)

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`)
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'}`)
})

export default app
