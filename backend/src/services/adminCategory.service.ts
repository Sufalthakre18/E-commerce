import { prisma } from '../lib/prisma';

export const AdminCategoryService = {
  create: async (name: string, parentId?: string) => {
    return prisma.category.create({ data: { name, parentId } });
  },

  update: async (id: string, name: string, parentId?: string) => {
    return prisma.category.update({ where: { id }, data: { name, parentId } });
  },

  delete: async (id: string) => {
    await prisma.category.delete({ where: { id } });
    return true;
  },

  list: async () => {
    return prisma.category.findMany({
      where: { parentId: null }, // Only top-level categories
      include: {
        subcategories: {
          include: {
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
    });
  },
};
