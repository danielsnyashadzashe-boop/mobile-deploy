import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

/**
 * POST /api/registration/check
 * Check if user has completed registration and can access app
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { userId, email } = req.body
    console.log('📋 Registration check request:', { userId, email })

    if (!email) {
      console.log('❌ No email provided in request')
      return res.status(400).json({ error: 'Email is required' })
    }

    // Check for existing registration
    console.log('🔍 Searching for registration with email:', email)
    const existingRegistration = await prisma.registration.findFirst({
      where: { email },
      orderBy: { submittedAt: 'desc' }
    })

    if (existingRegistration) {
      console.log('✅ Found registration:', {
        registrationId: existingRegistration.registrationId,
        status: existingRegistration.status,
        email: existingRegistration.email
      })
    } else {
      console.log('❌ No registration found for email:', email)
    }

    // Check for approved CarGuard profile
    const existingCarGuard = await prisma.carGuard.findFirst({
      where: {
        user: { email },
        status: 'ACTIVE'
      }
    })

    const hasCompletedRegistration = existingRegistration !== null

    // User can access app if they have an ACTIVE CarGuard OR if their registration is APPROVED
    const canAccessApp = existingCarGuard !== null ||
                         (existingRegistration?.status === 'APPROVED')

    let currentStatus = 'needs_registration'
    if (hasCompletedRegistration) {
      if (existingRegistration!.status === 'APPROVED') {
        currentStatus = 'approved'
      } else if (existingRegistration!.status === 'REJECTED') {
        currentStatus = 'rejected'
      } else {
        currentStatus = 'pending_approval'
      }
    }

    return res.json({
      hasCompletedRegistration,
      canAccessApp,
      currentStatus,
      registrationStatus: existingRegistration?.status || null,
      guardId: existingCarGuard?.guardId || null,
      registrationId: existingRegistration?.registrationId || null
    })
  } catch (error) {
    console.error('❌ Registration check error:', error)
    console.error('Request body:', req.body)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * POST /api/registration/complete
 * Submit complete registration with optional documents
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const data = req.body

    // Validate required fields
    const requiredFields = [
      'name', 'surname', 'email', 'phone',
      'dateOfBirth', 'gender', 'nationality',
      'addressLine1', 'suburb', 'city', 'province', 'postalCode',
      'languages', 'emergencyName', 'emergencyRelation', 'emergencyPhone'
    ]

    for (const field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({ error: `${field} is required` })
      }
    }

    // Either ID or Passport required
    if (!data.idNumber && !data.passportNumber) {
      return res.status(400).json({
        error: 'Either ID number or passport number is required'
      })
    }

    // Check for duplicate registration
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone },
          ...(data.idNumber ? [{ idNumber: data.idNumber }] : []),
          ...(data.passportNumber ? [{ passportNumber: data.passportNumber }] : [])
        ]
      }
    })

    if (existingRegistration) {
      let message = 'You have already submitted a registration.'

      if (existingRegistration.status === 'PENDING') {
        message = 'Your registration is currently being reviewed. Please wait for admin approval.'
      } else if (existingRegistration.status === 'APPROVED') {
        message = 'Your registration has been approved! Please sign in to access the app.'
      } else if (existingRegistration.status === 'REJECTED') {
        message = 'Your previous registration was rejected. Please contact support for assistance.'
      }

      return res.status(400).json({
        error: message,
        alreadyRegistered: true,
        registrationId: existingRegistration.registrationId,
        status: existingRegistration.status
      })
    }

    // Get or create default location (you need to create this in your DB)
    const defaultLocationId = process.env.DEFAULT_LOCATION_ID
    if (!defaultLocationId) {
      return res.status(500).json({
        error: 'Server configuration error: Default location not set'
      })
    }

    // Generate unique registration ID
    const registrationId = `REG${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create registration record
    const registration = await prisma.registration.create({
      data: {
        registrationId,
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone || null,
        idNumber: data.idNumber || null,
        passportNumber: data.passportNumber || null,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        nationality: data.nationality,

        // Address
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        suburb: data.suburb,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,

        // Work Details
        locationId: defaultLocationId,
        languages: data.languages,

        // Banking (optional)
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        accountHolder: data.accountHolder || null,
        branchCode: data.branchCode || null,

        // Emergency Contact
        emergencyName: data.emergencyName,
        emergencyRelation: data.emergencyRelation,
        emergencyPhone: data.emergencyPhone,

        // Status
        status: 'PENDING',
        stage: 'SUBMITTED',
        submittedAt: new Date(),
        source: data.source || 'mobile_app',
        preferredZones: []
      }
    })

    // Create User record if it doesn't exist
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: data.email,
          username: data.email,
          password: 'clerk_managed',
          role: 'GUARD',
          isVerified: true,
          emailVerified: true
        }
      })
    }

    // Create Document records if URLs provided
    const documentPromises = []

    const documentTypes = [
      { url: data.idDocumentUrl, type: 'ID_DOCUMENT', suffix: 'ID' },
      { url: data.passportPhotoUrl, type: 'PHOTO', suffix: 'PHOTO' },
      { url: data.proofOfResidenceUrl, type: 'PROOF_OF_ADDRESS', suffix: 'PROOF' },
      { url: data.bankStatementUrl, type: 'BANK_STATEMENT', suffix: 'BANK' },
      { url: data.criminalRecordUrl, type: 'POLICE_CLEARANCE', suffix: 'POLICE' },
      { url: data.referenceLetterUrl, type: 'OTHER', suffix: 'REF' }
    ]

    for (const doc of documentTypes) {
      if (doc.url && doc.url.trim() !== '') {
        documentPromises.push(
          prisma.document.create({
            data: {
              documentId: `DOC${Date.now()}_${doc.suffix}`,
              registrationId: registration.id,
              type: doc.type as any,
              category: 'REGISTRATION',
              fileName: `${doc.type.toLowerCase()}_${registrationId}`,
              fileUrl: doc.url,
              status: 'PENDING'
            }
          })
        )
      }
    }

    await Promise.all(documentPromises)

    return res.status(201).json({
      success: true,
      registrationId: registration.registrationId,
      message: 'Registration submitted successfully'
    })

  } catch (error) {
    console.error('❌ Registration complete error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    console.error('Request data received:', {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      hasIdNumber: !!req.body.idNumber,
      hasPassport: !!req.body.passportNumber,
      languages: req.body.languages
    })
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
