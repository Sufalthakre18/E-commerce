import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.registerUser(data);
      res.status(201).json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async registerAdminHandler(req: Request, res: Response){
    try {
      const { email, password, name } = req.body;
      const result = await authService.registerAdmin({ email, password, name });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
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
};