// Script to get registration database ID by email
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function getRegistrationId(email) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new MongoClient(url);

  try {
    await client.connect();

    const db = client.db('nogada');
    const registration = await db.collection('Registration').findOne({ email });

    if (!registration) {
      console.error(`❌ No registration found for: ${email}`);
      process.exit(1);
    }

    console.log('Registration found:');
    console.log('  Database ID:', registration._id.toString());
    console.log('  Registration ID:', registration.registrationId);
    console.log('  Name:', registration.name, registration.surname);
    console.log('  Status:', registration.status);
    console.log('\nAPI URL to approve:');
    console.log(`  POST http://localhost:3001/api/admin/registration/${registration._id.toString()}/approve`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node get-registration-id.js <email>');
  process.exit(1);
}

getRegistrationId(email);
