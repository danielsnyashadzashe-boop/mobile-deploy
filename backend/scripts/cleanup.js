// Quick script to clean up collections before schema push
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function cleanup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('nogada');

    // Drop CarGuard collection to remove duplicate null userId entries
    try {
      await db.collection('CarGuard').drop();
      console.log('✓ Dropped CarGuard collection');
    } catch (err) {
      console.log('CarGuard collection does not exist or already dropped');
    }

    console.log('\nYou can now run: npx prisma db push');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanup();
