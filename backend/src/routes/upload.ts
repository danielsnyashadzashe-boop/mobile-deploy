import { Router, Request, Response } from 'express'
import multer from 'multer'
import cloudinary from '../lib/cloudinary'

const router = Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'))
    }
  }
})

/**
 * POST /api/upload/document
 * Upload document to Cloudinary
 */
router.post('/document', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const { documentType, userId } = req.body

    if (!documentType || !userId) {
      return res.status(400).json({ error: 'documentType and userId are required' })
    }

    // Upload to Cloudinary using buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'nogada-documents',
          resource_type: 'auto',
          public_id: `${userId}_${documentType}_${Date.now()}`,
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      uploadStream.end(req.file!.buffer)
    })

    const cloudinaryResult = result as any

    return res.json({
      success: true,
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id
    })

  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
