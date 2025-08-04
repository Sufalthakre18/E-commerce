import { prisma } from "../lib/prisma";
import { deleteFromCloudinary, uploadOnCloudinary } from "../lib/cloudinary";


export const productService = {
  // Used by admin to create a product
  async create(data: any) {
    const { name, description, price, stock, category, categoryId, images, sizes, variants, type } = data;

    let connectedCategory;

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

    let parsedSizes: { size: string; stock: number }[] = [];
    if (sizes) {
      try {
        parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      } catch (err) {
        console.warn("failed to parse sizes:", err);
      }
    }

    let parsedVariants: { color: string; colorCode?: string; stock: number; price?: number; images: any[] }[] = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (err) {
        console.warn("failed to parse variants:", err);
      }
    }

    return prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        type,
        category: {
          connect: { id: connectedCategory.id },
        },
        images: {
          create: imageObjects,
        },
        sizes: parsedSizes.length ? {
          create: parsedSizes.map((s) => ({
            size: s.size,
            stock: s.stock,
          })),
        } : undefined,
        variants: parsedVariants.length ? {
          create: parsedVariants.map((v) => ({
            color: v.color,
            colorCode: v.colorCode,
            //   stock: v.stock,
            price: v.price,
            images: v.images?.length ? {
              create: v.images.map((img: any) => ({
                url: img.url,
                publicId: img.publicId,
              })),
            } : undefined,
          })),
        } : undefined,
      },
      include: {
        category: true,
        images: true,
        sizes: true,
        variants: {
          include: {
            images: true,
          },
        },
      },
    });


  },
  async getAllPaginated(filters: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    mainCategory?: string;
    subCategory?: string;
    type?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      search,
      minPrice,
      maxPrice,
      mainCategory,
      subCategory,
      type
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {
      ...(type ? { type } : {}),
      category: {
        name: subCategory,
        parent: {
          name: mainCategory,
        },
      },
    };

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
        include: { images: true, category: { include: { parent: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    if (type) {
      where.type = type;
    }
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
        variants: {
          include: {
            images: true
          }
        }
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
    type,
    images,
    imagesToDelete,
    sizes,
    variants,
  } = data;

  return prisma.$transaction(async (tx: any) => {

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

    if (imagesToDelete?.length) {
      const toDelete = await tx.productImage.findMany({
        where: { id: { in: imagesToDelete }, productId: id },
      });

      await Promise.all(
        toDelete
          .filter((img: any) => img.publicId)
          .map((img: any) => deleteFromCloudinary(img.publicId!))
      );

      await tx.productImage.deleteMany({
        where: { id: { in: imagesToDelete }, productId: id },
      });
    }

    if (images?.length) {
      await tx.productImage.createMany({
        data: images.map(({ url, publicId }: any) => ({
          url,
          publicId,
          productId: id,
        })),
      });
    }

    let parsedSizes = null;
    if (sizes) {
      try {
        parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
     
        if (!Array.isArray(parsedSizes)) {
          parsedSizes = null;
        }
      } catch (err) {
        console.warn("failed to parse sizes:", err);
        parsedSizes = null;
      }
    }

    if (parsedSizes?.length) {
      await tx.productSize.deleteMany({ where: { productId: id } });
      await tx.productSize.createMany({
        data: parsedSizes.map((s: any) => ({
          size: s.size,
          stock: s.stock,
          productId: id,
        })),
      });
    }

    if (variants?.length) {
      for (const variant of variants) {
        if (variant.id) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              color: variant.color,
              colorCode: variant.colorCode,
              price: variant.price ?? null,
            },
          });

          if (variant.imagesToDelete?.length) {
            const imagesToDelete = await tx.productVariantImage.findMany({
              where: { 
                id: { in: variant.imagesToDelete },
                variantId: variant.id 
              },
            });

            await Promise.all(
              imagesToDelete.map((img: any) =>
                img.publicId ? deleteFromCloudinary(img.publicId) : null
              )
            );

            await tx.productVariantImage.deleteMany({
              where: { 
                id: { in: variant.imagesToDelete },
                variantId: variant.id 
              },
            });
          }

          if (variant.newImages?.length) {
            await tx.productVariantImage.createMany({
              data: variant.newImages.map((img: any) => ({
                url: img.url,
                publicId: img.publicId,
                variantId: variant.id,
              })),
            });
          }
        } else {
          const created = await tx.productVariant.create({
            data: {
              color: variant.color,
              colorCode: variant.colorCode,
              price: variant.price ?? null,
              productId: id,
            },
          });

          if (variant.newImages?.length) {
            await tx.productVariantImage.createMany({
              data: variant.newImages.map((img: any) => ({
                url: img.url,
                publicId: img.publicId,
                variantId: created.id,
              })),
            });
          }
        }
      }

      const variantIds = variants.filter((v: any) => v.id).map((v: any) => v.id);
      if (variantIds.length > 0) {
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: id },
          include: { images: true },
        });

        const variantsToDelete = existingVariants.filter(
          (existing: any) => !variantIds.includes(existing.id)
        );

        if (variantsToDelete.length > 0) {
          await Promise.all(
            variantsToDelete.flatMap((variant: any) =>
              variant.images.map((img: any) =>
                img.publicId ? deleteFromCloudinary(img.publicId) : null
              )
            )
          );

          await tx.productVariantImage.deleteMany({
            where: { variantId: { in: variantsToDelete.map((v: any) => v.id) } },
          });

          await tx.productVariant.deleteMany({
            where: { id: { in: variantsToDelete.map((v: any) => v.id) } },
          });
        }
      }
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (price !== undefined) dataToUpdate.price = parseFloat(price);
    if (stock !== undefined) dataToUpdate.stock = parseInt(stock);
    if (type !== undefined) dataToUpdate.type = type;
    if (categoryConnect) dataToUpdate.category = categoryConnect;
    
    return tx.product.update({
      where: { id },
      data: dataToUpdate,
      include: {
        category: true,
        images: true,
        sizes: true,
        variants: {
          include: { images: true },
        },
      },
    });
  });
}
  , // used by admin to update a product by ID

  async delete(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: {
          include: {
            images: true
          }
        }
      }
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const productImagePublicIds = product.images
      .filter(img => img.publicId)
      .map(img => img.publicId!);

    const variantImagePublicIds = product.variants
      .flatMap(variant => variant.images)
      .filter(img => img.publicId)
      .map(img => img.publicId!);

    const allPublicIds = [...productImagePublicIds, ...variantImagePublicIds];

    await prisma.$transaction(async (tx: any) => {



      await tx.productVariantImage.deleteMany({
        where: {
          variantId: {
            in: product.variants.map(v => v.id)
          }
        }
      });


      await tx.orderItem.deleteMany({
        where: {
          variantId: {
            in: product.variants.map(v => v.id)
          }
        }
      });


      await tx.productVariant.deleteMany({ where: { productId: id } });

      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productSize.deleteMany({ where: { productId: id } });
      await tx.cartItem.deleteMany({ where: { productId: id } });


      await tx.orderItem.deleteMany({ where: { productId: id } });
      await tx.review.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });
    if (allPublicIds.length > 0) {
      await Promise.allSettled(
        allPublicIds.map(publicId => deleteFromCloudinary(publicId))
      );
    }

    return { message: "Product and all related data deleted successfully" };
  }
  , // used by admin to delete a product by ID
  async deleteProductsByCategory(categoryId: string) {

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

      await prisma.productImage.deleteMany({
        where: { productId: product.id },
      });
    }

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
      include: { category: true, images: true, sizes: true },
      orderBy: { createdAt: "desc" },
    });
  } // Used by user/admin to get all products with filters
};