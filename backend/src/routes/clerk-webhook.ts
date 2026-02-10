import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import prisma from '../lib/prisma';

const router = Router();

/**
 * POST /api/webhooks/clerk
 * Clerk webhook handler for user events
 * Automatically syncs Clerk users to backend database
 */
router.post('/clerk', async (req: Request, res: Response) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error('❌ CLERK_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get Svix headers for verification
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    // If no headers, reject
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Missing Svix headers');
      return res.status(400).json({ error: 'Missing Svix headers' });
    }

    // Get the raw body as string
    const payload = JSON.stringify(req.body);

    // Create Svix instance
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: any;

    // Verify the webhook signature
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('❌ Webhook verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle the webhook event
    const eventType = evt.type;
    console.log(`📥 Clerk webhook received: ${eventType}`);

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;

      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${eventType}`);
    }

    return res.status(200).json({ success: true, eventType });

  } catch (error) {
    console.error('❌ Clerk webhook error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Handle user.created event
 * Creates a User record in the database when a new user signs up via Clerk
 */
async function handleUserCreated(data: any) {
  try {
    const { id: clerkUserId, email_addresses, username, first_name, last_name } = data;

    const primaryEmail = email_addresses?.find((e: any) => e.id === data.primary_email_address_id);
    const email = primaryEmail?.email_address;

    if (!email) {
      console.error('❌ No email found in user.created event');
      return;
    }

    console.log('👤 Creating user in database:', { email, username, clerkUserId });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('ℹ️  User already exists, updating Clerk ID');
      // Update with Clerk ID if not set
      if (!existingUser.clerkUserId) {
        await prisma.user.update({
          where: { email },
          data: { clerkUserId }
        });
      }
      return;
    }

    // Create new user
    await prisma.user.create({
      data: {
        email,
        username: username || email.split('@')[0],
        password: 'clerk_managed', // Password managed by Clerk
        role: 'GUARD',
        clerkUserId,
        firstName: first_name || null,
        lastName: last_name || null,
        isVerified: true,
        emailVerified: true
      }
    });

    console.log('✅ User created successfully in database');

  } catch (error) {
    console.error('❌ Error handling user.created:', error);
    throw error;
  }
}

/**
 * Handle user.updated event
 * Updates User record when user info changes in Clerk
 */
async function handleUserUpdated(data: any) {
  try {
    const { id: clerkUserId, email_addresses, username, first_name, last_name } = data;

    const primaryEmail = email_addresses?.find((e: any) => e.id === data.primary_email_address_id);
    const email = primaryEmail?.email_address;

    if (!email) {
      console.error('❌ No email found in user.updated event');
      return;
    }

    console.log('🔄 Updating user in database:', { email, clerkUserId });

    // Find user by Clerk ID or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkUserId },
          { email }
        ]
      }
    });

    if (!user) {
      console.log('⚠️  User not found, creating new user');
      await handleUserCreated(data);
      return;
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        username: username || user.username,
        firstName: first_name || user.firstName,
        lastName: last_name || user.lastName,
        clerkUserId
      }
    });

    console.log('✅ User updated successfully in database');

  } catch (error) {
    console.error('❌ Error handling user.updated:', error);
    throw error;
  }
}

/**
 * Handle user.deleted event
 * Soft deletes or marks user as inactive when deleted from Clerk
 */
async function handleUserDeleted(data: any) {
  try {
    const { id: clerkUserId } = data;

    console.log('🗑️  Handling user deletion:', { clerkUserId });

    const user = await prisma.user.findFirst({
      where: { clerkUserId }
    });

    if (!user) {
      console.log('⚠️  User not found for deletion');
      return;
    }

    // Soft delete by marking as inactive
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: false,
        // Add a deletedAt field if you have one in your schema
      }
    });

    console.log('✅ User marked as deleted in database');

  } catch (error) {
    console.error('❌ Error handling user.deleted:', error);
    throw error;
  }
}

export default router;
