import { Request, Response } from "express";
import { ReviewService } from "../services/review.service";

export const AdminReviewController = {
  async getAll(req: Request, res: Response) {
    const { search, productId, userId } = req.query;

    const reviews = await ReviewService.getAllAdmin({
      search: search as string,
      productId: productId as string,
      userId: userId as string,
    });

    res.json(reviews);
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    try {
      await ReviewService.delete(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Failed to delete review" });
    }
  },
  async getByProduct(req: Request, res: Response) {
  const { productId } = req.params;

  try {
    const reviews = await ReviewService.getByProduct(productId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product reviews" });
  }
}

};
