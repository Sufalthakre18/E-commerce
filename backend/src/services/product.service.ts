import { prisma } from "../lib/prisma";
import { deleteFromCloudinary, uploadOnCloudinary } from "../lib/cloudinary";


export const productService = {
    // Used by admin to create a product
    async create(data: any) {
  const { name, description, price, stock, category, categoryId, images, sizes } = data;

  let connectedCategory;

  // Try by categoryId (preferred)
  if (categoryId) {
    connectedCategory = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!connectedCategory) {
        throw new Error(`category id "${categoryId}" not found`);
    }
  } else if (category) {
    connectedCategory = await prisma.category.findUnique({ where: { name: category } });
    if (!connectedCategory) throw new Error(`category "${category}" not found`);
  } else {
    throw new Error("category name is required");
  }

  const imageObjects = images?.map(({ url, publicId }: any) => ({
    url,
    publicId,
  }));

  // Parse sizes JSON safely
  let parsedSizes: { size: string; stock: number }[] = [];
  if (sizes) {
    try {
      parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
    } catch (err) {
      console.warn("failed to parse sizes:", err);
    }
  }

  return prisma.product.create({
    data: {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category: {
        connect: { id: connectedCategory.id },
      },
      images: {
        create: imageObjects,
      },
      sizes: parsedSizes.length
        ? {
            create: parsedSizes.map((s) => ({
              size: s.size,
              stock: s.stock,
            })),
          }
        : undefined,
    },
    include: {
      category: true,
      images: true,
      sizes: true,
    },
  });
},

    // (used in get all controller) categoryId, search, minPrice, maxPrice
    async getAllPaginated(filters: {
        page?: number;
        limit?: number;
        categoryId?: string;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
    }) {
        const {
            page = 1,
            limit = 10,
            categoryId,
            search,
            minPrice,
            maxPrice,
        } = filters;

        const skip = (page - 1) * limit;
        const where: any = {};

        if (categoryId) where.categoryId = categoryId;
        if (search) {
            where.name = {
                contains: search,
                mode: "insensitive",
            };
        }
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = minPrice;
            if (maxPrice) where.price.lte = maxPrice;
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: { category: true, images: true }, 
                orderBy: { createdAt: "desc" },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            products,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },
    // filter by category name instead of ID
    async getAll({
        page = 1,
        limit = 10,
        category,
    }: {
        page?: number;
        limit?: number;
        category?: string;
    }) {
        const skip = (page - 1) * limit;
        const where = category ? { category: { name: category } } : {};

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    images: true,
                    category: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            data: products,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
            },
        };
    },

    async getById(id: string) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                images: true,
                category: true,
                sizes: true, 
            },
        });

        if (!product) throw new Error("Product not found");

        return product;
    }, // Used by user to get product by ID

    async update(id: string, data: any) {
        const {
            name,
            description,
            price,
            stock,
            category,
            images,
            imagesToDelete,
            sizes,
        } = data;

        return prisma.$transaction(async (tx:any) => {
            
            let categoryConnect = undefined;

            if (category) {
                const existingCategory = await tx.category.findUnique({
                    where: { name: category },
                });

                if (!existingCategory) {
                    throw new Error(`Category "${category}" does not exist`);
                }

                categoryConnect = { connect: { name: category } };
            }

            // ✅ 2. Delete selected images (DB + Cloudinary)
            if (imagesToDelete?.length) {
                const toDelete = await tx.productImage.findMany({
                    where: { id: { in: imagesToDelete }, productId: id },
                });

                await Promise.all(
                    toDelete
                        .filter((img:any) => img.publicId)
                        .map((img:any) => deleteFromCloudinary(img.publicId!))
                );

                await tx.productImage.deleteMany({
                    where: { id: { in: imagesToDelete }, productId: id },
                });
            }

            // upload new images to DB
            if (images?.length) {
                await tx.productImage.createMany({
                    data: images.map(({ url, publicId }: any) => ({
                        url,
                        publicId,
                        productId: id,
                    })),
                });
            }

            // build `dataToUpdate` only with defined fields
            const dataToUpdate: any = {};
            if (name !== undefined) dataToUpdate.name = name;
            if (description !== undefined) dataToUpdate.description = description;
            if (price !== undefined) dataToUpdate.price = parseFloat(price);
            if (stock !== undefined) dataToUpdate.stock = parseInt(stock);
            if (sizes) {
                // parse sizes if passed as stringified JSON
                try {
                    dataToUpdate.sizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
                } catch (err) {
                    console.warn("failed to parse sizes:", err);
                }
            }
            if (categoryConnect) dataToUpdate.category = categoryConnect;

            return tx.product.update({
                where: { id },
                data: dataToUpdate,
                include: {
                    category: true,
                    images: true,
                },
            });
        });
    }

    , // used by admin to update a product by ID

    async delete(id: string) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw new Error("Product not found");
        }

        // Get associated images (for Cloudinary cleanup)
        const images = await prisma.productImage.findMany({
            where: { productId: id },
        });

        // Start transaction to ensure atomic deletion
        await prisma.$transaction(async (tx:any) => {
            // delete images from Cloudinary
            await Promise.all(
                images
                    .filter((img:any) => img.publicId)
                    .map((img:any) => deleteFromCloudinary(img.publicId!))
            );

            // delete from DB: images, cart items, order items
            await tx.productSize.deleteMany({ where: { productId: id } });
            await tx.productImage.deleteMany({ where: { productId: id } });
            await tx.cartItem.deleteMany({ where: { productId: id } });
            await tx.orderItem.deleteMany({ where: { productId: id } });

            // delete the product
            await tx.product.delete({ where: { id } });
        });

        return { message: "product and its related data deleted successfully" };
    }
    , // used by admin to delete a product by ID
    async deleteProductsByCategory(categoryId: string) {
        // get all products in the category
        const products = await prisma.product.findMany({
            where: { categoryId },
            include: { images: true },
        });

        if (products.length === 0) {
            throw new Error("No products found for this category");
        }

        // delete all related images from Cloudinary
        for (const product of products) {
            for (const image of product.images) {
                if (image.publicId) {
                    await deleteFromCloudinary(image.publicId);
                }
            }

            // delete image records from DB
            await prisma.productImage.deleteMany({
                where: { productId: product.id },
            });
        }

        // delete products
        await prisma.product.deleteMany({
            where: { categoryId },
        });

        return { message: `Deleted ${products.length} products from category ` };
    }, // Used by admin to delete all products in a category 
    async getFilteredProducts({
        search,
        categoryId,
        inStockOnly,
    }: {
        search?: string;
        categoryId?: string;
        inStockOnly?: boolean;
    }) {
        return await prisma.product.findMany({
            where: {
                name: search ? { contains: search, mode: "insensitive" } : undefined,
                categoryId: categoryId || undefined,
                stock: inStockOnly ? { gt: 0 } : undefined,
            },
            include: { category: true, images: true,sizes: true},
            orderBy: { createdAt: "desc" },
        });
    } // Used by user/admin to get all products with filters
};