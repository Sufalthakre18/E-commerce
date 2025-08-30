import { Request, Response } from "express";
import { productService } from "../services/product.service";
import { uploadOnCloudinary, UploadResult } from "../lib/cloudinary";
import { prisma } from "../lib/prisma";
import path from "path";
import { UploadApiResponse } from "cloudinary";

// Define AuthRequest interface
interface AuthRequest extends Request {
  user: { id: string; role: string };
}

export const ProductController = {
  async getAll(req: Request, res: Response) {
    const { page, limit, categoryId, search, minPrice, maxPrice, type, productType } = req.query;

    const filters = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      categoryId: categoryId as string,
      search: search as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      type: type as string,
      productType: productType as string,
    };

    try {
      const result = await productService.getAllPaginated(filters);
      const securedProducts = {
        ...result,
        products: result.products.map(product => ({
          ...product,
          digitalFiles: [],
        })),
      };
      res.json(securedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description, details, price, stock, categoryId, productType, sizes, variants } = req.body;
      const files = req.files as { images?: Express.Multer.File[]; digitalFiles?: Express.Multer.File[] };

      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only admins can create products" });
      }

      // Parse variants if provided as string
      let parsedVariants = [];
      if (variants) {
        try {
          parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
        } catch (err) {
          console.warn("Failed to parse variants:", err);
        }
      }

      // Handle image uploads for product
      const imageUploads = files.images
        ? await Promise.all(
            files.images.map(async (file) => {
              console.log(`Uploading image to Cloudinary: ${file.filename}`);
              const result = await uploadOnCloudinary(file.path, {
                resource_type: "image",
                folder: "ecommerce-products",
                upload_preset: "product_images",
              });
              if (!result) {
                throw new Error(`Failed to upload image: ${file.filename}`);
              }
              return {
                url: result.secure_url,
                publicId: result.publicId,
              };
            })
          )
        : [];

      // Handle digital file uploads
      const digitalFileUploads = files.digitalFiles
        ? await Promise.all(
            files.digitalFiles.map(async (file) => {
              const extension = path.extname(file.originalname).toLowerCase();
              let resourceType: "image" | "video" | "raw" = "raw";
              if (extension === ".pdf") resourceType = "image";
              if (extension === ".mp4") resourceType = "video";
              console.log(`Uploading digital file to Cloudinary: ${file.filename}, resource_type: ${resourceType}`);
              const result = await uploadOnCloudinary(file.path, {
                resource_type: resourceType,
                folder: "digital-files",
                upload_preset: "digital_files",
              });
              if (!result) {
                throw new Error(`Failed to upload digital file: ${file.filename}`);
              }
              return {
                url: result.secure_url,
                publicId: result.publicId,
                fileName: file.originalname,
              };
            })
          )
        : [];

      // Process variants and map imageIndices to product images
      const processedVariants = parsedVariants.map((variant: any) => {
        let imageIndices: number[] = [];
        if (variant.imageIndices) {
          try {
            imageIndices = typeof variant.imageIndices === "string"
              ? JSON.parse(variant.imageIndices)
              : variant.imageIndices;
          } catch (err) {
            console.warn(`Failed to parse imageIndices for variant ${variant.color}:`, err);
          }
        }

        // Map imageIndices to the uploaded product images
        const variantImages = imageIndices
          .filter((index: number) => index >= 0 && index < imageUploads.length)
          .map((index: number) => ({
            url: imageUploads[index].url,
            publicId: imageUploads[index].publicId,
          }));

        return {
          color: variant.color,
          colorCode: variant.colorCode,
          price: variant.price ? parseFloat(variant.price) : undefined,
          images: variantImages,
        };
      });

      const product = await prisma.product.create({
        data: {
          name,
          description,
          details,
          price: parseFloat(price),
          stock: parseInt(stock),
          categoryId,
          productType,
          images: {
            create: imageUploads.map((img) => ({
              url: img.url,
              publicId: img.publicId,
            })),
          },
          digitalFiles: {
            create: digitalFileUploads.map((file) => ({
              url: file.url,
              publicId: file.publicId,
              fileName: file.fileName,
            })),
          },
          sizes: sizes
            ? {
                create: (typeof sizes === "string" ? JSON.parse(sizes) : sizes).map((s: any) => ({
                  size: s.size,
                  stock: s.stock,
                })),
              }
            : undefined,
          variants: processedVariants.length
            ? {
                create: processedVariants.map((v: any) => ({
                  color: v.color,
                  colorCode: v.colorCode,
                  price: v.price,
                  images: v.images.length
                    ? {
                        create: v.images.map((img: any) => ({
                          url: img.url,
                          publicId: img.publicId,
                        })),
                      }
                    : undefined,
                })),
              }
            : undefined,
        },
        include: {
          images: true,
          digitalFiles: true,
          sizes: true,
          variants: { include: { images: true } },
        },
      });

      res.json({ success: true, product });
    } catch (err: any) {
      console.error("Product creation error:", err);
      res.status(500).json({ error: `Failed to create product: ${err.message}` });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, details, price, stock, categoryId, productType, type, sizes, variants, imagesToDelete, digitalFilesToDelete } = req.body;
      const files = req.files as { images?: Express.Multer.File[]; variantImages?: Express.Multer.File[]; digitalFiles?: Express.Multer.File[] };

      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Only admins can update products" });
      }

      // Parse deletions and arrays
      let parsedImagesToDelete: string[] = [];
      if (imagesToDelete) {
        parsedImagesToDelete = typeof imagesToDelete === "string" ? JSON.parse(imagesToDelete) : imagesToDelete;
      }

      let parsedDigitalFilesToDelete: string[] = [];
      if (digitalFilesToDelete) {
        parsedDigitalFilesToDelete = typeof digitalFilesToDelete === "string" ? JSON.parse(digitalFilesToDelete) : digitalFilesToDelete;
      }

      let parsedSizes = [];
      if (sizes) {
        parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      }

      let parsedVariants = [];
      if (variants) {
        parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
      }

      // Handle new product image uploads
      const newImageUploads = files.images
        ? await Promise.all(
            files.images.map(async (file) => {
              console.log(`Uploading image to Cloudinary: ${file.filename}`);
              const result = await uploadOnCloudinary(file.path, {
                resource_type: "image",
                folder: "ecommerce-products",
                upload_preset: "product_images",
              });
              if (!result) {
                throw new Error(`Failed to upload image: ${file.filename}`);
              }
              return {
                url: result.secure_url,
                publicId: result.publicId,
              };
            })
          )
        : [];

      // Handle new variant image uploads
      const newVariantImageUploads = files.variantImages
        ? await Promise.all(
            files.variantImages.map(async (file) => {
              console.log(`Uploading variant image to Cloudinary: ${file.filename}`);
              const result = await uploadOnCloudinary(file.path, {
                resource_type: "image",
                folder: "ecommerce-products",
                upload_preset: "product_images",
              });
              if (!result) {
                throw new Error(`Failed to upload variant image: ${file.filename}`);
              }
              return {
                url: result.secure_url,
                publicId: result.publicId,
              };
            })
          )
        : [];

      // Handle new digital file uploads
      const newDigitalUploads = files.digitalFiles
        ? await Promise.all(
            files.digitalFiles.map(async (file) => {
              const extension = path.extname(file.originalname).toLowerCase();
              let resourceType: "image" | "video" | "raw" = "raw";
              if (extension === ".pdf") resourceType = "image";
              if (extension === ".mp4") resourceType = "video";
              console.log(`Uploading digital file to Cloudinary: ${file.filename}, resource_type: ${resourceType}`);
              const result = await uploadOnCloudinary(file.path, {
                resource_type: resourceType,
                folder: "digital-files",
                upload_preset: "digital_files",
              });
              if (!result) {
                throw new Error(`Failed to upload digital file: ${file.filename}`);
              }
              return {
                url: result.secure_url,
                publicId: result.publicId,
                fileName: file.originalname,
              };
            })
          )
        : [];

      // Process variants and map newImageIndices to newVariantImageUploads
      const processedVariants = parsedVariants.map((variant: any) => {
        let parsedImagesToDelete: string[] = [];
        if (variant.imagesToDelete) {
          parsedImagesToDelete = typeof variant.imagesToDelete === "string" ? JSON.parse(variant.imagesToDelete) : variant.imagesToDelete;
        }

        let newImageIndices: number[] = [];
        if (variant.newImageIndices) {
          newImageIndices = typeof variant.newImageIndices === "string" ? JSON.parse(variant.newImageIndices) : variant.newImageIndices;
        }

        const newImages = newImageIndices
          .filter((index: number) => index >= 0 && index < newVariantImageUploads.length)
          .map((index: number) => newVariantImageUploads[index]);

        return {
          id: variant.id,
          color: variant.color,
          colorCode: variant.colorCode,
          price: variant.price ? parseFloat(variant.price) : undefined,
          imagesToDelete: parsedImagesToDelete,
          newImages,
        };
      });

      // Prepare data for service
      const updateData = {
        name,
        description,
        details,
        price: parseFloat(price),
        stock: parseInt(stock),
        categoryId,
        productType,
        type,
        images: newImageUploads,
        imagesToDelete: parsedImagesToDelete,
        digitalFiles: newDigitalUploads,
        digitalFilesToDelete: parsedDigitalFilesToDelete,
        sizes: parsedSizes,
        variants: processedVariants,
      };

      const updatedProduct = await productService.update(id, updateData);

      res.json({ success: true, product: updatedProduct });
    } catch (err: any) {
      console.error("Product update error:", err);
      res.status(500).json({ error: `Failed to update product: ${err.message}` });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const result = await productService.delete(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error("Product delete error:", err);
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Failed to delete product"
      });
    }
  },

  async deleteByCategory(req: Request, res: Response) {
    const { categoryId } = req.params;
    try {
      const result = await productService.deleteProductsByCategory(categoryId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error("Delete by category failed:", err);
      res.status(500).json({ success: false, message: "Failed to delete products by category" });
    }
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const product = await productService.getById(id);
      const securedProduct = {
        ...product,
        digitalFiles: [],
      };
      res.json({ success: true, data: securedProduct });
    } catch (err) {
      console.error("Error fetching product:", err);
      res.status(500).json({ success: false, message: err instanceof Error ? err.message : "Failed to fetch product" });
    }
  },

  async getAllProducts(req: Request, res: Response) {
    const { search, categoryId, inStockOnly } = req.query;
    try {
      const products = await productService.getFilteredProducts({
        search: search?.toString(),
        categoryId: categoryId?.toString(),
        inStockOnly: inStockOnly === "true",
      });
      const securedProducts = products.map(product => ({
        ...product,
        digitalFiles: [],
      }));
      res.json({ success: true, data: securedProducts });
    } catch (err) {
      console.error("Error fetching filtered products:", err);
      res.status(500).json({ success: false, message: "Failed to fetch filtered products" });
    }
  },

  async checkDigital(req: Request, res: Response): Promise<void> {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Items array is required and must not be empty' });
      return;
    }

    try {
      const productIds = items.map((item: { productId: string }) => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { productType: true },
      });

      if (products.length !== productIds.length) {
        res.status(400).json({ error: 'Some products were not found' });
        return;
      }

      const isAllDigital = products.every(p => p.productType === 'digital');
      res.json({ isAllDigital });
    } catch (err) {
      console.error('Error checking digital products:', err);
      res.status(500).json({ error: 'Failed to check product types' });
    }
  }
};