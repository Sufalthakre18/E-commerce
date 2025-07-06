import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export function signToken(payload: object): string {
  const options: SignOptions = { expiresIn: '10d' as const }; // <- FIXED
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken<T extends object = JwtPayload>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}