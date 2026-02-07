// Script to check for duplicate idNumber
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDuplicate(email) {
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

    console.log('\n✓ Registration found:');
    console.log('  ID Number:', registration.idNumber);
    console.log('  Passport:', registration.passportNumber);

    // Check if this idNumber exists in CarGuard collection
    const existingGuard = await db.collection('CarGuard').findOne({
      idNumber: registration.idNumber
    });

    if (existingGuard) {
      console.log('\n❌ CarGuard with this ID number already exists:');
      console.log('  Guard ID:', existingGuard.guardId);
      console.log('  Name:', existingGuard.name, existingGuard.surname);
      console.log('  Email: Need to look up user...');

      const guardUser = await db.collection('User').findOne({ _id: existingGuard.userId });
      if (guardUser) {
        console.log('  Email:', guardUser.email);
      }
    } else {
      console.log('\n✓ No duplicate idNumber found - safe to create CarGuard');
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
  console.error('Usage: node check-duplicate-id.js <email>');
  console.error('Example: node check-duplicate-id.js user@example.com');
  process.exit(1);
}

checkDuplicate(email);
