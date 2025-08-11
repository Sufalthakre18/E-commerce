import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { z } from 'zod';

const otpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.registerUser(data);
      res.status(201).json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async registerAdminHandler(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.registerAdmin(data);
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async me(req: any, res: Response) {
    try {
      const userId = req.user.id;
      const user = await authService.me(userId);
      res.status(200).json({ success: true, user });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  },

  async sendOtp(req: Request, res: Response) {
    try {
      const { email } = otpSchema.parse(req.body);
      const result = await authService.sendOtp(email);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyOtp(email, otp);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async google(req: Request, res: Response) {
    try {
      const { email, name, googleId } = req.body;
      const result = await authService.googleAuthCallback({ email, name, googleId });
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};