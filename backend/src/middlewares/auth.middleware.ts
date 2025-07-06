import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyUser = async (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Unauthorized User so it have no token' });

  try {
    const decode = verifyToken(token); // id email 

    const user = await prisma.user.findUnique({
      where: { id: decode.id },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.name, 
    };

    next();
  } catch (err) {
    res.status(401).json({ message: 'token is not valid' });
  }
};
// This interface extends the Express Request object to include user information
interface AuthenticateReq extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

// Middleware to check if the user is authenticated
export function isAdmin(req: AuthenticateReq, res: Response, next: NextFunction) {
  console.log("User info in admin middleware:", req.user);

  const adminemail = process.env.ADMIN_EMAIL;
  if (!adminemail) {
    throw new Error("ADMIN_EMAIL not set ");
  }

  if (!req.user || req.user.role !== "ADMIN" || req.user.email !== adminemail) {
    return res.status(403).json({ message: "Admins access only" });
  }

  next();
}