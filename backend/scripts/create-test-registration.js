// Script to create a test registration for testing approval flow
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function createTestRegistration() {
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

    const testEmail = `test${Date.now()}@example.com`;
    const registrationId = `REG${Date.now()}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

    // Create test registration
    const registration = await db.collection('Registration').insertOne({
      registrationId,
      name: 'Test',
      surname: 'User',
      email: testEmail,
      phone: `067${Math.floor(Math.random() * 10000000)}`,
      idNumber: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Male',
      nationality: 'South African',
      addressLine1: '123 Test Street',
      suburb: 'Test Suburb',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2000',
      locationId: new ObjectId(process.env.DEFAULT_LOCATION_ID),
      languages: ['English'],
      emergencyName: 'Emergency Contact',
      emergencyRelation: 'Friend',
      emergencyPhone: '0671234567',
      status: 'PENDING',
      stage: 'SUBMITTED',
      submittedAt: new Date(),
      source: 'test_script',
      preferredZones: []
    });

    // Create test user
    await db.collection('User').insertOne({
      email: testEmail,
      username: testEmail,
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

    console.log('\n✅ Test registration created successfully!');
    console.log('\nDetails:');
    console.log('  Database ID:', registration.insertedId.toString());
    console.log('  Registration ID:', registrationId);
    console.log('  Email:', testEmail);
    console.log('  Status: PENDING');
    console.log('\nAPI URL to approve:');
    console.log(`  POST http://localhost:3001/api/admin/registration/${registration.insertedId.toString()}/approve`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createTestRegistration();
