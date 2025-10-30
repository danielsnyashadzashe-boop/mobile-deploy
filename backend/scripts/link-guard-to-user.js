// Script to link existing CarGuard to correct user
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function linkGuardToUser(email) {
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

    // Find current user
    const user = await db.collection('User').findOne({ email });

    if (!user) {
      console.error(`❌ No user found for email: ${email}`);
      process.exit(1);
    }

    console.log('\n✓ Current user:');
    console.log('  User ID:', user._id.toString());
    console.log('  Email:', user.email);

    // Find registration
    const registration = await db.collection('Registration').findOne({ email });

    if (!registration) {
      console.error(`❌ No registration found for email: ${email}`);
      process.exit(1);
    }

    console.log('\n✓ Registration:');
    console.log('  ID Number:', registration.idNumber);
    console.log('  Passport Number:', registration.passportNumber);

    // Find CarGuard by idNumber or passport
    const searchCriteria = registration.idNumber
      ? { idNumber: registration.idNumber }
      : { idNumber: `PASSPORT-${registration.passportNumber}` };

    const guard = await db.collection('CarGuard').findOne(searchCriteria);

    if (!guard) {
      console.error(`❌ No CarGuard found with search criteria:`, searchCriteria);
      process.exit(1);
    }

    console.log('\n✓ Found existing CarGuard:');
    console.log('  Guard ID:', guard.guardId);
    console.log('  Current User ID:', guard.userId.toString());
    console.log('  Name:', guard.name, guard.surname);

    // Check if it's already linked to the correct user
    if (guard.userId.toString() === user._id.toString()) {
      console.log('\n✓ CarGuard already linked to correct user!');
      console.log('\nGuard Details:');
      console.log('  Guard ID:', guard.guardId);
      console.log('  QR Code:', guard.qrCode);
      console.log('  NFC Tag:', guard.nfcTag);
      console.log('  Balance:', guard.balance);
      return;
    }

    // Update CarGuard to link to correct user
    await db.collection('CarGuard').updateOne(
      { _id: guard._id },
      { $set: { userId: user._id, updatedAt: new Date() } }
    );

    console.log('\n✅ CarGuard successfully linked to correct user!');
    console.log('\nGuard Details:');
    console.log('  Guard ID:', guard.guardId);
    console.log('  Name:', guard.name, guard.surname);
    console.log('  Email:', email);
    console.log('  QR Code:', guard.qrCode);
    console.log('  NFC Tag:', guard.nfcTag);
    console.log('  Balance:', guard.balance);
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
  console.error('Usage: node link-guard-to-user.js <email>');
  console.error('Example: node link-guard-to-user.js user@example.com');
  process.exit(1);
}

linkGuardToUser(email);
