import { Request, Response } from "express";
import { productService} from "../services/product.service";
import { uploadOnCloudinary } from "../lib/cloudinary";
import { UploadApiResponse } from "cloudinary";


export const ProductController = {
  async getAll(req: Request, res: Response) {
    const {
      page,
      limit,
      categoryId,
      search,
      minPrice,
      maxPrice,
    } = req.query;

    const filters = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      categoryId: categoryId as string,
      search: search as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    };

    const result = await productService.getAllPaginated(filters);
    res.json(result);
  },  // used by user to get all products,
  async create(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      const uploads = await Promise.all(
        files.map((f) => uploadOnCloudinary(f.path))
      );

      const successes = uploads.filter((u): u is UploadApiResponse => !!u);
      const imageData = successes.map((u) => ({
        url: u.secure_url,
        publicId: u.public_id,
      }));

      const product = await productService.create({
        ...req.body,
        images: imageData,
      });

      res.status(201).json(product);
    } catch (err) {
      console.error("product creation failed:", err);
      res.status(500).json({ error: "failed to create product" });
    }
  }
  ,
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    
    const { imagesToDelete, ...rest } = req.body;

    try {
 
      let newImages: { url: string; publicId: string }[] = [];

      if (files && files.length) {
        const uploads = await Promise.all(
          files.map((f) => uploadOnCloudinary(f.path))
        );

        const successes = uploads.filter(
          (u): u is UploadApiResponse => !!u
        );

        newImages = successes.map((u) => ({
          url: u.secure_url,
          publicId: u.public_id,
        }));
      }

   
      let imagesToDeleteArray: string[] = [];
      if (typeof imagesToDelete === "string") {
        imagesToDeleteArray = [imagesToDelete];
      } else if (Array.isArray(imagesToDelete)) {
        imagesToDeleteArray = imagesToDelete;
      }


      const updatedProduct = await productService.update(id, {
        ...rest,
        images: newImages,
        imagesToDelete: imagesToDeleteArray,
      });

      res.json(updatedProduct);
    } catch (err) {
      console.error("product update error:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  },

  async delete(req: Request, res: Response) {
  try {
    await productService.delete(req.params.id);
    res.status(204).send(); // No content
  } catch (err) {
    console.error("product delete error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to delete product" });
  }
}
, // used by admin to delete a 
  async deleteByCategory(req: Request, res: Response) {
    const { categoryId } = req.params;
    try {
      const result = await productService.deleteProductsByCategory(categoryId);
      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Delete by category failed:", error);
      res.status(500).json({ error });
    }
  }, // used by admin to delete all products in a category
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const product = await productService.getById(id);
    res.json(product);
  }, // used by user to get product by id
  async getAllProducts(req: Request, res: Response) {
    const { search, categoryId, inStockOnly } = req.query;
    const products = await productService.getFilteredProducts({
      search: search?.toString(),
      categoryId: categoryId?.toString(),
      inStockOnly: inStockOnly === "true",
    });
    res.json(products);
  } // used by user/admin to get all products with filters

};
