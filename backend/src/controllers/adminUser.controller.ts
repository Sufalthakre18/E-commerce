import { Request, Response } from "express";
import { AdminUserService } from "../services/adminUser.service";

export const AdminUserController = {
  list: async (_req: Request, res: Response) => {
    const users = await AdminUserService.list();
    res.json(users);
  },

  getUserOrders: async (req: Request, res: Response) => {
    const { userId } = req.params;
    const orders = await AdminUserService.getUserOrders(userId);
    res.json(orders);
  },

  
};
