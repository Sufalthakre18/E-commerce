import { prisma } from "../lib/prisma";

export const AdminUserService = {
  list: async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: true,
        
      },
      orderBy: { createdAt: "desc" },
    });
  },

  getUserOrders: async (userId: string) => {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  
};
