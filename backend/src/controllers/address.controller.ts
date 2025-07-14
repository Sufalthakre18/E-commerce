import { Request, Response } from "express";
import { AddressService } from "../services/address.service";
import { addressSchema } from "../schemas/address.schema";
import { z } from "zod";

interface AuthRequest extends Request {
  user: { id: string };
}

export const AddressController = {
  async create(req: Request, res: Response) {
    const { id: userId } = (req as AuthRequest).user;

    try {
      const validatedData = addressSchema.parse(req.body);
      const address = await AddressService.create(userId, validatedData);
      res.status(201).json(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create address" });
    }
  },

  async getAll(req: Request, res: Response) {
    const { id: userId } = (req as AuthRequest).user;
    const addresses = await AddressService.getAll(userId);
    res.json(addresses);
  },

  async update(req: Request, res: Response) {
    const { id: userId } = (req as AuthRequest).user;
    const { addressId } = req.params;

    try {
      const validatedData = addressSchema.partial().parse(req.body);
      const updated = await AddressService.update(addressId, userId, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update address" });
    }
  },

  async delete(req: Request, res: Response) {
    const { id: userId } = (req as AuthRequest).user;
    const { addressId } = req.params;

    try {
      await AddressService.delete(addressId, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete address" });
    }
  },
};
