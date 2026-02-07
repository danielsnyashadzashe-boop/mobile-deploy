// Script to find CarGuard by email
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findGuard(email) {
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

    // Find user
    const user = await db.collection('User').findOne({ email });

    if (!user) {
      console.error(`❌ No user found for email: ${email}`);
      process.exit(1);
    }

    console.log('\n✓ User found:');
    console.log('  User ID:', user._id.toString());
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);

    // Find CarGuard by userId
    const guard = await db.collection('CarGuard').findOne({ userId: user._id });

    if (!guard) {
      console.log('\n❌ No CarGuard found for this user');

      // Check registration
      const registration = await db.collection('Registration').findOne({ email });
      if (registration) {
        console.log('\n✓ Registration found:');
        console.log('  Registration ID:', registration.registrationId);
        console.log('  Status:', registration.status);
        console.log('  Name:', registration.name, registration.surname);
      }
    } else {
      console.log('\n✓ CarGuard found:');
      console.log('  Guard ID:', guard.guardId);
      console.log('  Name:', guard.name, guard.surname);
      console.log('  Phone:', guard.phone);
      console.log('  ID Number:', guard.idNumber);
      console.log('  QR Code:', guard.qrCode);
      console.log('  NFC Tag:', guard.nfcTag);
      console.log('  Balance:', guard.balance);
      console.log('  Status:', guard.status);
      console.log('  Location ID:', guard.locationId?.toString());
    }

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
  console.error('Usage: node find-guard.js <email>');
  console.error('Example: node find-guard.js user@example.com');
  process.exit(1);
}

findGuard(email);
