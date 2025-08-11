
import { Request, Response } from 'express';
import { z } from 'zod';
import { addressService } from '../services/address.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  altPhone: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  isDefault: z.boolean().default(false),
});

export const AddressController= {
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const data = addressSchema.parse(req.body);
      const address = await addressService.create(userId, data);
      res.json({ success: true, address });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: err.message });
      }
      console.error('Create address error:', err);
      res.status(500).json({ message: 'Failed to save address' });
    }
  }
,
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const addresses = await addressService.getAll(userId);
      res.json(addresses);
    } catch (err) {
      console.error('Get addresses error:', err);
      res.status(500).json({ message: 'Failed to fetch addresses' });
    }
  }
,
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const addressId = req.params.addressId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const data = addressSchema.parse(req.body);
      const address = await addressService.update(userId, addressId, data);
      res.json({ success: true, address });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: err.message });
      }
      console.error('Update address error:', err);
      res.status(500).json({ message: 'Failed to update address' });
    }
  }
,
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const addressId = req.params.addressId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      await addressService.delete(userId, addressId);
      res.json({ success: true });
    } catch (err) {
      console.error('Delete address error:', err);
      res.status(500).json({ message: 'Failed to delete address' });
    }
  }
}
