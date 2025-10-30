// Script to create default location in MongoDB
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function createDefaultLocation() {
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
    const locations = db.collection('Location');

    // Check if default location already exists
    const existing = await locations.findOne({ locationId: 'LOC001' });

    let locationObjectId;

    if (existing) {
      console.log('✓ Default location already exists');
      locationObjectId = existing._id.toString();
      console.log('  Location _id:', locationObjectId);
    } else {
      // Create default location
      const defaultLocation = {
        locationId: 'LOC001',
        name: 'Head Office',
        address: '123 Main Street, Johannesburg',
        suburb: 'CBD',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        coordinates: {
          lat: -26.2041,
          lng: 28.0473
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await locations.insertOne(defaultLocation);
      locationObjectId = result.insertedId.toString();

      console.log('✓ Created default location');
      console.log('  Location _id:', locationObjectId);
      console.log('  Location ID:', defaultLocation.locationId);
      console.log('  Name:', defaultLocation.name);
    }

    // Update .env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace the default location ID
    envContent = envContent.replace(
      /DEFAULT_LOCATION_ID=.*/,
      `DEFAULT_LOCATION_ID=${locationObjectId}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log('\n✓ Updated .env file with DEFAULT_LOCATION_ID');
    console.log('\n🎉 Setup complete! Restart your backend server.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createDefaultLocation();
