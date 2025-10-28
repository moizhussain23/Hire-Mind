import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { User } from '../models/User';

// Clerk webhook handler to sync users to MongoDB
export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      throw new Error('CLERK_WEBHOOK_SECRET is not set');
    }

    // Get the headers and body
    const headers = req.headers;
    const payload = req.body;

    // Get the Svix headers for verification
    const svix_id = headers['svix-id'] as string;
    const svix_timestamp = headers['svix-timestamp'] as string;
    const svix_signature = headers['svix-signature'] as string;

    // If there are no Svix headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      res.status(400).json({ error: 'Missing svix headers' });
      return;
    }

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: any;

    // Verify the webhook
    try {
      evt = wh.verify(JSON.stringify(payload), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // Handle the webhook
    const eventType = evt.type;
    console.log('Webhook event type:', eventType);

    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url, unsafe_metadata, primary_email_address_id } = evt.data;

      const email = email_addresses[0]?.email_address || '';
      
      // Skip if no email (test events might not have email)
      if (!email) {
        console.log('⚠️  Skipping user creation - no email address');
        res.status(200).json({ message: 'Skipped - no email' });
        return;
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ clerkId: id });
      if (existingUser) {
        console.log('⚠️  User already exists:', email);
        res.status(200).json({ message: 'User already exists' });
        return;
      }
      
      // Create user in MongoDB
      const newUser = new User({
        clerkId: id,
        email: email,
        firstName: first_name || email.split('@')[0] || 'User',
        lastName: last_name || 'User', // Default to 'User' if no lastName
        role: unsafe_metadata?.role || 'candidate', // Get role from metadata or default to candidate
        profileImage: image_url || '',
      });

      await newUser.save();
      console.log('✅ User created in MongoDB:', newUser.email, '- Role:', newUser.role);
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url, unsafe_metadata } = evt.data;

      const email = email_addresses[0]?.email_address || '';
      
      // Skip if no email (test events might not have email)
      if (!email) {
        console.log('⚠️  Skipping user update - no email address');
        res.status(200).json({ message: 'Skipped - no email' });
        return;
      }
      
      // Update user in MongoDB
      const updatedUser = await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: email,
          firstName: first_name || email.split('@')[0] || 'User',
          lastName: last_name || 'User', // Default to 'User' if no lastName
          role: unsafe_metadata?.role || 'candidate',
          profileImage: image_url || '',
        },
        { new: true }
      );
      
      if (updatedUser) {
        console.log('✅ User updated in MongoDB:', updatedUser.email, '- Role:', updatedUser.role);
      } else {
        console.log('⚠️  User not found in MongoDB, creating new user');
        // If user doesn't exist, create them
        const newUser = new User({
          clerkId: id,
          email: email,
          firstName: first_name || email.split('@')[0] || 'User',
          lastName: last_name || 'User',
          role: unsafe_metadata?.role || 'candidate',
          profileImage: image_url || '',
        });
        await newUser.save();
        console.log('✅ User created in MongoDB:', newUser.email);
      }
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;

      // Delete user from MongoDB
      await User.findOneAndDelete({ clerkId: id });
      console.log('✅ User deleted from MongoDB');
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
