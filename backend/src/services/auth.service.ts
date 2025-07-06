import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken } from '../lib/auth';

const prisma = new PrismaClient();

export const authService = {
  async registerUser(data: { email: string; password: string; name: string }) {
    const { email, password, name } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser){
        return { error: 'Email already exists' };
    } 

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: {
          connect: { name: 'CUSTOMER' },
        },
      },
    });

    const token = signToken({ id: user.id, email: user.email });
    return { token, user };
  },
  async registerAdmin(data: { email: string; password: string; name: string }) {
    const { email, password, name } = data;

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw new Error("invalid admin credentials");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return { error: 'Email already exists' };
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: {
          connect: { name: "ADMIN" },
        },
      },
    });

    const token = signToken({ id: user.id, email: user.email });
    return { token, user };
  },
  async login(data: { email: string; password: string }) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) throw new Error("User not found");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid){
        throw new Error("Invalid credentials");
    } 
    const isAdminLogin =
      email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;

    if (isAdminLogin && user.role.name !== "ADMIN") {
      throw new Error("Unauthorized admin login attempt");
    }

    const token = signToken({ id: user.id, email: user.email });
    return { token, user };
  },
  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    return user;
  },
};