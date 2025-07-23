// lib/validators/checkout.ts
import { z } from 'zod';

export const checkoutSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  paymentMethod: z.enum(['razorpay', 'COD']),
});

export type CheckoutFormType = z.infer<typeof checkoutSchema>;
