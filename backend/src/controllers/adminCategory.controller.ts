// adminCategory.controller.ts
import { Request, Response } from "express";
import { AdminCategoryService } from "../services/adminCategory.service";
import { prisma } from "../lib/prisma";

export const AdminCategoryController = {
  create: async (req: Request, res: Response) => {
    const { name, parentId } = req.body;
    const category = await AdminCategoryService.create(name, parentId);
    res.status(201).json(category);
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, parentId } = req.body;
    const category = await AdminCategoryService.update(id, name, parentId);
    res.json(category);
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await AdminCategoryService.delete(id);
    res.json({ success: deleted });
  },

  list: async (_req: Request, res: Response) => {
    const categories = await AdminCategoryService.list();
    res.json(categories);
  },
  subcategories: async (req: Request, res: Response) => {
  const { id } = req.params;
  const subcats = await prisma.category.findMany({
    where: { parentId: id },
    include: { _count: { select: { products: true } } },
  });
  res.json(subcats);
}

};
