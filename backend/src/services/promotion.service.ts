import { prisma } from "../lib/prisma";


export const getAllPromotions = () => {
  return prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
};

export const createPromotion = (data: {
  code: string;
  description?: string;
  discount: number;
  type: 'percentage' | 'fixed';
  startsAt: Date;
  endsAt: Date;
}) => {
  return prisma.promotion.create({ data });
};

export const deletePromotion = (id: string) => {
  return prisma.promotion.delete({ where: { id } });
};

export const getPromotionByCode = async (code: string) => {
  return prisma.promotion.findUnique({ where: { code: code.toUpperCase() } });
};
