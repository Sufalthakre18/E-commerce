import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error('JWT_SECRET is missing from environment variables');
}

export const JWT_SECRET: string = secret;