import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const verifyUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });
    if (!user) return res.status(401).json({ message: 'User not found' });

    if (!user.emailVerified && user.role.name !== 'ADMIN') {
      return res.status(403).json({ message: 'Email not verified. Please verify with OTP.' });
    }

    req.user = { id: user.id, email: user.email, role: user.role.name };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export function isAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL not set');
  }

  if (!req.user || req.user.role !== 'ADMIN' || req.user.email !== adminEmail) {
    return res.status(403).json({ message: 'Admins only' });
  }

  next();
}