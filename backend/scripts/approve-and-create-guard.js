// Script to manually approve registration and create CarGuard
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function approveAndCreateGuard(email) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db('nogada');

    // Find registration
    const registration = await db.collection('Registration').findOne({ email });

    if (!registration) {
      console.error(`❌ No registration found for email: ${email}`);
      process.exit(1);
    }

    console.log('Found registration:', {
      registrationId: registration.registrationId,
      name: registration.name,
      surname: registration.surname,
      status: registration.status
    });

    // Find or create user
    let user = await db.collection('User').findOne({ email });

    if (!user) {
      console.log('Creating new user...');
      const userResult = await db.collection('User').insertOne({
        email: email,
        username: email,
        password: 'clerk_managed',
        role: 'GUARD',
        isActive: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: false,
        loginAttempts: 0,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      user = { _id: userResult.insertedId, email };
      console.log('✓ User created:', user._id.toString());
    } else {
      console.log('✓ User exists:', user._id.toString());
    }

    // Check if CarGuard already exists
    const existingGuard = await db.collection('CarGuard').findOne({
      userId: user._id
    });

    if (existingGuard) {
      console.log('✓ CarGuard already exists:', existingGuard.guardId);
      console.log('\nGuard Details:');
      console.log('  Guard ID:', existingGuard.guardId);
      console.log('  Name:', existingGuard.name, existingGuard.surname);
      console.log('  QR Code:', existingGuard.qrCode);
      console.log('  Balance:', existingGuard.balance);
      return;
    }

    // Generate unique guardId
    const guardId = `GRD${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const qrCode = `QR${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const nfcTag = `NFC${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create CarGuard record
    const guardData = {
      userId: user._id,
      guardId: guardId,
      name: registration.name,
      surname: registration.surname,
      phone: registration.phone,
      alternatePhone: registration.alternatePhone || null,
      idNumber: registration.idNumber || `PASSPORT-${registration.passportNumber}`,
      passportNumber: registration.passportNumber || null,
      balance: 0,
      lifetimeEarnings: 0,
      qrCode: qrCode,
      nfcTag: nfcTag,
      locationId: new ObjectId(registration.locationId),
      managerId: registration.managerId ? new ObjectId(registration.managerId) : null,
      status: 'ACTIVE',
      verificationLevel: 'BASIC',
      rating: 0,
      totalRatings: 0,
      badges: [],
      preferredLanguage: 'en',
      onboardingStatus: 'COMPLETED',
      bankName: registration.bankName || null,
      accountNumber: registration.accountNumber || null,
      accountHolder: registration.accountHolder || null,
      branchCode: registration.branchCode || null,
      emergencyContact: registration.emergencyName || null,
      emergencyPhone: registration.emergencyPhone || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('CarGuard').insertOne(guardData);
    console.log('✓ CarGuard created:', guardId);

    // Update registration
    await db.collection('Registration').updateOne(
      { _id: registration._id },
      {
        $set: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: 'script',
          guardId: guardId,
          guardCreatedAt: new Date()
        }
      }
    );

    console.log('\n✅ Registration approved and CarGuard created successfully!');
    console.log('\nGuard Details:');
    console.log('  Guard ID:', guardId);
    console.log('  Name:', registration.name, registration.surname);
    console.log('  Email:', email);
    console.log('  QR Code:', qrCode);
    console.log('  NFC Tag:', nfcTag);
    console.log('  Balance: R 0.00');
    console.log('\nYou can now sign in to the mobile app!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('Usage: node approve-and-create-guard.js <email>');
  console.error('Example: node approve-and-create-guard.js user@example.com');
  process.exit(1);
}

approveAndCreateGuard(email);
