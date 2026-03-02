import { registerAs } from '@nestjs/config';

export default registerAs('africastalking', () => ({
  username: process.env.AT_USERNAME || 'sandbox',
  apiKey: process.env.AT_API_KEY,
  senderId: process.env.AT_SENDER_ID, // Useful for custom sender IDs in production
}));
