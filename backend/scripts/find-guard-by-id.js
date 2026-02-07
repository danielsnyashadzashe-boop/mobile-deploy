// Script to find CarGuard by guardId
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findGuardById(guardId) {
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

    // Find CarGuard
    const guard = await db.collection('CarGuard').findOne({ guardId });

    if (!guard) {
      console.error(`❌ No CarGuard found for guardId: ${guardId}`);
      process.exit(1);
    }

    console.log('\n✓ CarGuard found:');
    console.log('  Guard ID:', guard.guardId);
    console.log('  Name:', guard.name, guard.surname);
    console.log('  Phone:', guard.phone);
    console.log('  ID Number:', guard.idNumber);
    console.log('  QR Code:', guard.qrCode);
    console.log('  NFC Tag:', guard.nfcTag);
    console.log('  Balance:', guard.balance);
    console.log('  Status:', guard.status);
    console.log('  User ID:', guard.userId.toString());

    // Find user
    const user = await db.collection('User').findOne({ _id: guard.userId });

    if (user) {
      console.log('\n✓ Associated user:');
      console.log('  Email:', user.email);
      console.log('  Username:', user.username);
      console.log('  Role:', user.role);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Get guardId from command line
const guardId = process.argv[2];

if (!guardId) {
  console.error('Usage: node find-guard-by-id.js <guardId>');
  console.error('Example: node find-guard-by-id.js GRD17594907659222C2N');
  process.exit(1);
}

findGuardById(guardId);
