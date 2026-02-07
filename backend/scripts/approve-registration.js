// Script to approve a registration by email
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function approveRegistration(email) {
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
    const registrations = db.collection('Registration');

    // Find the registration
    const registration = await registrations.findOne({ email });

    if (!registration) {
      console.error(`❌ No registration found for email: ${email}`);
      process.exit(1);
    }

    console.log('Found registration:', {
      registrationId: registration.registrationId,
      name: registration.name,
      surname: registration.surname,
      email: registration.email,
      currentStatus: registration.status
    });

    // Update status to APPROVED
    const result = await registrations.updateOne(
      { email },
      {
        $set: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: 'admin_script'
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('\n✅ Registration APPROVED successfully!');
      console.log('The user can now sign in and access the app.');
    } else {
      console.log('❌ Failed to update registration');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node approve-registration.js <email>');
  console.error('Example: node approve-registration.js user@example.com');
  process.exit(1);
}

approveRegistration(email);
