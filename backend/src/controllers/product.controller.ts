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
      type,
    } = req.query;

    const filters = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      categoryId: categoryId as string,
      search: search as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      
      type:type as string,
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
    const allImageData = successes.map((u) => ({
      url: u.secure_url,
      publicId: u.public_id,
    }));

    let processedData = { ...req.body };
    
    if (req.body.variants) {
      const variants = typeof req.body.variants === 'string' 
        ? JSON.parse(req.body.variants) 
        : req.body.variants;
      
      const processedVariants = variants.map((variant: any) => ({
        ...variant,
        images: variant.imageIndices 
          ? variant.imageIndices.map((index: number) => allImageData[index])
          : []
      }));
      
      processedData.variants = processedVariants;
    }

    const usedImageIndices = new Set();
    if (processedData.variants) {
      processedData.variants.forEach((v: any) => {
        if (v.imageIndices) {
          v.imageIndices.forEach((index: number) => usedImageIndices.add(index));
        }
      });
    }
    
    const generalImages = allImageData.filter((_, index) => !usedImageIndices.has(index));
    processedData.images = generalImages;

    const product = await productService.create(processedData);
    res.status(201).json(product);
    
  } catch (err) {
    console.error("product creation failed:", err);
    res.status(500).json({ error: "failed to create product" });
  }
}
  ,
  async update(req: Request, res: Response) {
  const { id } = req.params;

  const filesByField = req.files as {
    [field: string]: Express.Multer.File[];
  };

  const productFiles = filesByField["images"] || [];
  const variantFiles = filesByField["variantImages"] || [];

  const { imagesToDelete, variants: rawVariants, ...rest } = req.body;
  const variants = typeof rawVariants === "string"
    ? JSON.parse(rawVariants)
    : rawVariants;

  try {
    const productUploads = await Promise.all(
      productFiles.map((f) => uploadOnCloudinary(f.path))
    );
    const newImages = productUploads
      .filter((u): u is UploadApiResponse => !!u)
      .map((u) => ({ url: u.secure_url, publicId: u.public_id }));

    const variantIndexes = Array.isArray(req.body.variantImageIndexes)
      ? req.body.variantImageIndexes.map((s: string) => parseInt(s, 10))
      : req.body.variantImageIndexes 
        ? [parseInt(req.body.variantImageIndexes, 10)]
        : [];

    const variantUploads = await Promise.all(
      variantFiles.map((f) => uploadOnCloudinary(f.path))
    );

    const variantImagesMap: Record<number, { url: string; publicId: string }[]> = {};
    variantUploads.forEach((u, idx) => {
      if (!u) return;
      const vi = variantIndexes[idx];
      if (vi !== undefined) {
        variantImagesMap[vi] = variantImagesMap[vi] || [];
        variantImagesMap[vi].push({
          url: u.secure_url,
          publicId: u.public_id,
        });
      }
    });

    let imagesToDeleteArray: string[] = [];
    if (typeof imagesToDelete === "string") {
      imagesToDeleteArray = [imagesToDelete];
    } else if (Array.isArray(imagesToDelete)) {
      imagesToDeleteArray = imagesToDelete;
    }

    const processedVariants = variants.map((v: any, idx: number) => ({
      ...v,
      existingImages: (v.existingImages || []).filter((img: any) => 
        !v.imagesToDelete?.includes(img.id)
      ),
      newImages: variantImagesMap[idx] || [],
    }));


    const updatedProduct = await productService.update(id, {
      ...rest,
      images: newImages,
      imagesToDelete: imagesToDeleteArray,
      variants: processedVariants,
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error("product update error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
}
 ,

  async delete(req: Request, res: Response) {
  try {
    const result = await productService.delete(req.params.id);
    res.status(200).json(result); 
  } catch (err) {
    console.error("Product delete error:", err);
    
    if (err instanceof Error && err.message === "Product not found") {
      res.status(404).json({ error: "Product not found" });
    } else {
      res.status(500).json({ 
        error: err instanceof Error ? err.message : "Failed to delete product" 
      });
    }
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