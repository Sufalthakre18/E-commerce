import { Request, Response } from 'express';
import {
  getAllPromotions,
  createPromotion,
  deletePromotion,
  getPromotionByCode,
} from '../services/promotion.service';

// ADMIN: Get all
export const fetchPromotions = async (req: Request, res: Response) => {
  const promos = await getAllPromotions();
  res.json(promos);
};

// ADMIN: Create
export const addPromotion = async (req: Request, res: Response) => {
  try {
    const { code, description, discount, type, startsAt, endsAt } = req.body;

    const promo = await createPromotion({
      code,
      description,
      discount,
      type,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    });

    res.status(201).json(promo);
  } catch (err) {
    res.status(400).json({ message: 'Error creating promo', error: err });
  }
};

// ADMIN: Delete
export const removePromotion = async (req: Request, res: Response) => {
  try {
    await deletePromotion(req.params.id);
    res.json({ message: 'Promotion deleted' });
  } catch {
    res.status(404).json({ message: 'Promotion not found' });
  }
};

// USER: Validate code
export const validatePromoCode = async (req: Request, res: Response) => {
  const { code } = req.query;

  const promo = await getPromotionByCode(String(code));
  const now = new Date();

  if (
    !promo ||
    !promo.isActive ||
    new Date(promo.startsAt) > now ||
    new Date(promo.endsAt) < now
  ) {
    return res.status(400).json({ valid: false, message: 'Invalid or expired promo code' });
  }

  res.json({
    valid: true,
    discount: promo.discount,
    type: promo.type,
    message: 'Promo code applied',
  });
};
