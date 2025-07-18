import { prisma } from "../lib/prisma";

export const ReviewService = {
  async create(userId: string, productId: string, rating: number, comment?: string) {
    return prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
    });
  },

  async update(reviewId: string, rating: number, comment?: string) {
    return prisma.review.update({
      where: { id: reviewId },
      data: { rating, comment },
    });
  },

  async getByProduct(productId: string) {
    return prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async delete(reviewId: string) {
    return prisma.review.delete({ where: { id: reviewId } });
  },

  async getUserReview(userId: string, productId: string) {
    return prisma.review.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });
  },

  async getAverageRating(productId: string) {
    const result = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });
    return result;
  },
  async getAllAdmin({
  search,
  productId,
  userId,
}: {
  search?: string;
  productId?: string;
  userId?: string;
}) {
  return prisma.review.findMany({
    where: {
      productId: productId || undefined,
      userId: userId || undefined,
      comment: search
        ? { contains: search, mode: "insensitive" }
        : undefined,
    },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

};

