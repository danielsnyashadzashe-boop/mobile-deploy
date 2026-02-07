// Script to list all registrations needing CarGuard creation
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function listPendingApprovals() {
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

    console.log(`\n📋 Found ${approvedRegistrations.length} approved registrations`);

    // Check each one for CarGuard existence
    for (const registration of approvedRegistrations) {
      const user = await db.collection('User').findOne({
        email: registration.email
      });

      if (!user) {
        console.log(`\n⚠️  Registration without user:`);
        console.log(`   Email: ${registration.email}`);
        console.log(`   Registration ID: ${registration.registrationId}`);
        continue;
      }

      const guard = await db.collection('CarGuard').findOne({
        userId: user._id
      });

      if (!guard) {
        console.log(`\n❌ APPROVED but NO CarGuard:`);
        console.log(`   Name: ${registration.name} ${registration.surname}`);
        console.log(`   Email: ${registration.email}`);
        console.log(`   Registration ID: ${registration.registrationId}`);
        console.log(`   User ID: ${user._id.toString()}`);
      } else {
        console.log(`\n✓ Has CarGuard:`);
        console.log(`   Name: ${registration.name} ${registration.surname}`);
        console.log(`   Email: ${registration.email}`);
        console.log(`   Guard ID: ${guard.guardId}`);
      }
    }

    // Find all PENDING registrations
    const pendingRegistrations = await db.collection('Registration').find({
      status: 'PENDING'
    }).toArray();

    console.log(`\n\n📋 Found ${pendingRegistrations.length} pending registrations awaiting approval:`);

    for (const registration of pendingRegistrations) {
      console.log(`\n⏳ Pending approval:`);
      console.log(`   Name: ${registration.name} ${registration.surname}`);
      console.log(`   Email: ${registration.email}`);
      console.log(`   Registration ID: ${registration.registrationId}`);
      console.log(`   Submitted: ${registration.submittedAt}`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

listPendingApprovals();
