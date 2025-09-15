import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken } from '../lib/auth';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

export const authService = {
 async registerUser(data: { email: string; password: string; name: string }) {
  const { email, password, name } = data;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('Email already exists');

  // Check for existing active OTP
  const existingOtp = await prisma.oTP.findFirst({
    where: { identifier: email, expiresAt: { gte: new Date() } },
  });
  if (existingOtp) {
    await prisma.oTP.delete({ where: { id: existingOtp.id } });
  }

  const hashed = await bcrypt.hash(password, 10);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.oTP.create({
    data: {
      identifier: email,
      code: otpCode,
      expiresAt,
      name,
      password: hashed,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Your OTP for E-commerce Registration',
    text: `Your OTP is ${otpCode}. It is valid for 10 minutes. Verify to complete registration.`,
  };

  await transporter.sendMail(mailOptions);
  return { message: 'OTP sent. Verify to complete registration.' };
},

  async registerAdmin(data: { email: string; password: string; name: string }) {
    const { email, password, name } = data;

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw new Error('Invalid admin credentials');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: {
          connect: { name: 'ADMIN' },
        },
        emailVerified: true,
      },
    });

    const token = signToken({ id: user.id, email: user.email, role: 'ADMIN' });
    return { token, user };
  },

  async login(data: { email: string; password: string }) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) throw new Error('User not found');

    const valid = await bcrypt.compare(password, user.password!);
    if (!valid) throw new Error('Invalid credentials');

    const isAdminLogin =
      email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;

    if (isAdminLogin && user.role.name !== 'ADMIN') {
      throw new Error('Unauthorized admin login attempt');
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role.name });
    return { token, user };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) throw new Error('User not found');
    return user;
  },

  async sendOtp(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await prisma.oTP.create({
      data: {
        identifier: email,
        code: otpCode,
        expiresAt,
        user: { connect: { id: user.id } },
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your OTP for E-commerce Login',
      text: `Your OTP is ${otpCode}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    return { message: 'OTP sent successfully' };
  },

  async verifyOtp(email: string, otp: string) {
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      identifier: email,
      code: otp,
      expiresAt: { gte: new Date() },
    },
    include: { user: true },
  });

  if (!otpRecord) throw new Error('Invalid or expired OTP');

  let user;
  let role = 'CUSTOMER';
  if (otpRecord.user) {
    // Login flow
    user = otpRecord.user;
    role = user.roleId; // Assuming roleId is the role name, adjust if needed
  } else {
    // Registration flow
    if (!otpRecord.name || !otpRecord.password) {
      throw new Error('Invalid OTP record for registration');
    }
    user = await prisma.user.create({
      data: {
        email: otpRecord.identifier,
        name: otpRecord.name,
        password: otpRecord.password,
        role: { connect: { name: 'CUSTOMER' } },
        emailVerified: true,
      },
    });
  }

  await prisma.oTP.delete({ where: { id: otpRecord.id } });

  const token = signToken({ id: user.id, email: user.email, role });
  return { token, user };
},

  async googleAuthCallback(userData: { email: string; name: string; googleId: string }) {
    const { email, name, googleId } = userData;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: { connect: { name: 'CUSTOMER' } },
          emailVerified: true,
          accounts: {
            create: {
              type: 'oauth',
              provider: 'google',
              providerAccountId: googleId,
            },
          },
        },
      });
    } else {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider: 'google', providerAccountId: googleId } },
      });

      if (!account) {
        await prisma.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: googleId,
          },
        });
      }
    }

    const token = signToken({ id: user.id, email: user.email, role: user.roleId });
    return { token, user };
  },
  async list() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      role: true,
      _count: {
        select: {
          orders: true
        }
      },
      orders: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1, // Get only the most recent order
        select: {
          id: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}
  
};