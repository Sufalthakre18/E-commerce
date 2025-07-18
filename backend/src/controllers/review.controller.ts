import { Request, Response } from "express";
import { ReviewService } from "../services/review.service";

export const ReviewController = {
  async create(req: Request, res: Response) {
  const userId = (req as any).user.id; // if using custom property
  const { productId, rating, comment } = req.body;

  try {
    const review = await ReviewService.create(userId, productId, rating, comment);
    res.status(201).json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
,

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const review = await ReviewService.update(id, rating, comment);
    res.json(review);
  },

  async getByProduct(req: Request, res: Response) {
    const { productId } = req.params;
    const reviews = await ReviewService.getByProduct(productId);
    const stats = await ReviewService.getAverageRating(productId);
    res.json({ reviews, averageRating: stats._avg.rating, total: stats._count });
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await ReviewService.delete(id);
    res.status(204).send();
  },
};
