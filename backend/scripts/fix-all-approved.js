// Script to create CarGuard profiles for all approved registrations
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function fixAllApproved() {
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

    // Find all APPROVED registrations
    const approvedRegistrations = await db.collection('Registration').find({
      status: 'APPROVED'
    }).toArray();

    console.log(`\n📋 Found ${approvedRegistrations.length} approved registrations\n`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const registration of approvedRegistrations) {
      try {
        console.log(`\n--- Processing: ${registration.name} ${registration.surname} (${registration.email})`);

        // Find user
        const user = await db.collection('User').findOne({
          email: registration.email
        });

        if (!user) {
          console.log(`   ⚠️  Skipping: No user found`);
          skipped++;
          continue;
        }

        // Check if CarGuard exists
        const existingGuard = await db.collection('CarGuard').findOne({
          userId: user._id
        });

        if (existingGuard) {
          console.log(`   ✓ Skipping: CarGuard already exists (${existingGuard.guardId})`);
          skipped++;
          continue;
        }

        // Check for duplicate idNumber from other guards
        if (registration.idNumber) {
          const duplicateGuard = await db.collection('CarGuard').findOne({
            idNumber: registration.idNumber
          });

          if (duplicateGuard) {
            // Link the existing guard to this user
            await db.collection('CarGuard').updateOne(
              { _id: duplicateGuard._id },
              { $set: { userId: user._id, updatedAt: new Date() } }
            );
            console.log(`   ✓ Linked existing CarGuard (${duplicateGuard.guardId}) to user`);
            fixed++;
            continue;
          }
        }

        // Generate unique identifiers
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
        console.log(`   ✅ Created CarGuard: ${guardId}`);
        fixed++;

        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10));

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
      }
    }

    console.log('\n\n=== Summary ===');
    console.log(`✅ Created/Fixed: ${fixed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${approvedRegistrations.length}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixAllApproved();
