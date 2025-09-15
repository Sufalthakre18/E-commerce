import { prisma } from "../lib/prisma";
import { deleteFromCloudinary, uploadOnCloudinary } from "../lib/cloudinary";
import { Prisma } from "@prisma/client";



export const productService = {
  // Used by admin to create a product
  async create(data: any) {
    const { name, description, price, stock, category, categoryId, images, sizes, variants, productType, type, details, digitalFiles } = data;

    let connectedCategory;
    if (categoryId) {
      connectedCategory = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!connectedCategory) throw new Error(`Category id "${categoryId}" not found`);
    } else if (category) {
      connectedCategory = await prisma.category.findUnique({ where: { name: category } });
      if (!connectedCategory) throw new Error(`Category "${category}" not found`);
    } else {
      throw new Error("Category name or ID is required");
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
        console.warn("Failed to parse sizes:", err);
      }
    }

    let parsedVariants: { color: string; colorCode?: string; stock?: number; price?: number; images: any[] }[] = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (err) {
        console.warn("Failed to parse variants:", err);
      }
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          description,
          details: details || null,
          price: parseFloat(price),
          stock: productType === 'digital' ? 9 : parseInt(stock), // Infinite for digital
          productType,
          type: type || null,
          category: { connect: { id: connectedCategory.id } },
          images: { create: imageObjects },
          sizes: parsedSizes.length ? {
            create: parsedSizes.map((s) => ({ size: s.size, stock: s.stock })),
          } : undefined,
          variants: parsedVariants.length ? {
            create: parsedVariants.map((v) => ({
              color: v.color,
              colorCode: v.colorCode,
              price: v.price,
              images: v.images?.length ? {
                create: v.images.map((img: any) => ({
                  url: img.url,
                  publicId: img.publicId,
                })),
              } : undefined,
            })),
          } : undefined,
          digitalFiles: productType === 'digital' && digitalFiles?.length ? {
            create: digitalFiles.map((f: any) => ({
              url: f.url,
              publicId: f.publicId,
              fileName: f.fileName,
            })),
          } : undefined,
        },
        include: {
          category: true,
          images: true,
          sizes: true,
          variants: { include: { images: true } },
          digitalFiles: true,
        },
      });
      return product;
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
    productType?: string;
    type?: string;
    fetchAll?: boolean;  // Add this parameter
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
      productType,
      type,
      fetchAll = false  // Default to false
    } = filters;
    
    // If fetchAll is true, we'll get all products without pagination
    const skip = fetchAll ? undefined : (page - 1) * limit;
    const take = fetchAll ? undefined : limit;
    
    const where: any = {
      ...(productType ? { productType } : {}),
      ...(type ? { type } : {}),
    };
    
    // Add category filtering if mainCategory or subCategory is provided
    if (mainCategory || subCategory) {
      where.category = {};
      if (subCategory) where.category.name = subCategory;
      if (mainCategory) {
        where.category.parent = { name: mainCategory };
      }
    }
    
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
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
        take,
        include: {
          images: true,
          category: { include: { parent: true } },
          variants: { include: { images: true } },
          digitalFiles: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);
    
    return {
      products,
      total,
      page: fetchAll ? 1 : page,
      totalPages: fetchAll ? 1 : Math.ceil(total / limit),
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
          digitalFiles: true, // Include for listings
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    };
  },

 async update(id: string, data: any) {
    const {
      name,
      description,
      details,
      price,
      stock,
      categoryId,
      productType,
      type,
      images,
      imagesToDelete,
      digitalFiles,
      digitalFilesToDelete,
      sizes,
      variants,
    } = data;

    return prisma.$transaction(async (tx) => {
      // Validate product existence
      const existingProduct = await tx.product.findUnique({
        where: { id },
        include: { images: true, digitalFiles: true, sizes: true, variants: { include: { images: true } } },
      });
      if (!existingProduct) throw new Error("Product not found");

      // Validate category
      if (categoryId) {
        const category = await tx.category.findUnique({ where: { id: categoryId } });
        if (!category) throw new Error(`Category id "${categoryId}" not found`);
      }

      // Handle image deletions
      if (imagesToDelete?.length) {
        const toDelete = await tx.productImage.findMany({
          where: { id: { in: imagesToDelete }, productId: id },
        });
        await Promise.all(
          toDelete
            .filter((img) => img.publicId)
            .map((img) => deleteFromCloudinary(img.publicId!, "image"))
        );
        await tx.productImage.deleteMany({
          where: { id: { in: imagesToDelete }, productId: id },
        });
      }

      // Handle digital file deletions
      if (digitalFilesToDelete?.length) {
        const toDelete = await tx.digitalFile.findMany({
          where: { id: { in: digitalFilesToDelete }, productId: id },
        });
        await Promise.all(
          toDelete
            .filter((file) => file.publicId)
            .map((file) => deleteFromCloudinary(file.publicId, file.url.endsWith(".mp4") ? "video" : "raw"))
        );
        await tx.digitalFile.deleteMany({
          where: { id: { in: digitalFilesToDelete }, productId: id },
        });
      }

      // Handle new images
      if (images?.length) {
        await tx.productImage.createMany({
          data: images.map(({ url, publicId }: any) => ({
            url,
            publicId,
            productId: id,
          })),
        });
      }

      // Handle new digital files
      if (digitalFiles?.length) {
        await tx.digitalFile.createMany({
          data: digitalFiles.map(({ url, publicId, fileName }: any) => ({
            url,
            publicId,
            fileName,
            productId: id,
          })),
        });
      }

      // Handle sizes
      if (sizes?.length) {
        await tx.productSize.deleteMany({ where: { productId: id } });
        await tx.productSize.createMany({
          data: sizes.map((s: any) => ({
            size: s.size,
            stock: s.stock,
            productId: id,
          })),
        });
      }

      // Handle variants
      if (variants?.length) {
        for (const variant of variants) {
          if (variant.id) {
            // Update existing variant
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                color: variant.color,
                colorCode: variant.colorCode,
                price: variant.price ?? null,
              },
            });

            // Delete variant images
            if (variant.imagesToDelete?.length) {
              const imagesToDelete = await tx.productVariantImage.findMany({
                where: { id: { in: variant.imagesToDelete }, variantId: variant.id },
              });
              await Promise.all(
                imagesToDelete
                  .filter((img) => img.publicId)
                  .map((img) => deleteFromCloudinary(img.publicId!, "image"))
              );
              await tx.productVariantImage.deleteMany({
                where: { id: { in: variant.imagesToDelete }, variantId: variant.id },
              });
            }

            // Add new variant images
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
            // Create new variant
            const createdVariant = await tx.productVariant.create({
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
                  variantId: createdVariant.id,
                })),
              });
            }
          }
        }

        // Delete variants not included in the update
        const variantIds = variants.filter((v: any) => v.id).map((v: any) => v.id);
        if (variantIds.length > 0) {
          const existingVariants = await tx.productVariant.findMany({
            where: { productId: id },
            include: { images: true },
          });
          const variantsToDelete = existingVariants.filter((v) => !variantIds.includes(v.id));
          if (variantsToDelete.length) {
            await Promise.all(
              variantsToDelete.flatMap((v) =>
                v.images
                  .filter((img) => img.publicId)
                  .map((img) => deleteFromCloudinary(img.publicId!, "image"))
              )
            );
            await tx.productVariantImage.deleteMany({
              where: { variantId: { in: variantsToDelete.map((v) => v.id) } },
            });
            await tx.productVariant.deleteMany({
              where: { id: { in: variantsToDelete.map((v) => v.id) } },
            });
          }
        }
      }

      // Update product
      const dataToUpdate = {
        name,
        description,
        details,
        price,
        stock: productType === "digital" ? 10 : stock,
        productType,
        type,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
      };

      return tx.product.update({
        where: { id },
        data: dataToUpdate,
        include: {
          category: true,
          images: true,
          sizes: true,
          variants: { include: { images: true } },
          digitalFiles: true,
        },
      });
    });
  },
  
  async delete(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          images: true,
          variants: { include: { images: true } },
          digitalFiles: true,
        },
      });

      if (!product) throw new Error("Product not found");

      const productImagePublicIds = product.images
        .filter(img => img.publicId)
        .map(img => ({ publicId: img.publicId!, resourceType: 'image' as const }));

      const variantImagePublicIds = product.variants
        .flatMap(variant => variant.images)
        .filter(img => img.publicId)
        .map(img => ({ publicId: img.publicId!, resourceType: 'image' as const }));

      const digitalPublicIds = product.digitalFiles
        .filter(f => f.publicId)
        .map(f => ({ publicId: f.publicId!, resourceType: 'raw' as const }));

      const allPublicIds = [...productImagePublicIds, ...variantImagePublicIds, ...digitalPublicIds];

      console.log(`Deleting product ${id} with ${allPublicIds.length} Cloudinary assets:`, allPublicIds);

      await prisma.$transaction(async (tx) => {
        try {
          await tx.productVariantImage.deleteMany({
            where: { variantId: { in: product.variants.map(v => v.id) } },
          });
          console.log(`Deleted productVariantImages for product ${id}`);

          await tx.orderItem.deleteMany({
            where: { variantId: { in: product.variants.map(v => v.id) } },
          });
          console.log(`Deleted orderItems for product ${id}`);

          await tx.productVariant.deleteMany({ where: { productId: id } });
          console.log(`Deleted productVariants for product ${id}`);

          await tx.productImage.deleteMany({ where: { productId: id } });
          console.log(`Deleted productImages for product ${id}`);

          await tx.productSize.deleteMany({ where: { productId: id } });
          console.log(`Deleted productSizes for product ${id}`);

          await tx.digitalFile.deleteMany({ where: { productId: id } });
          console.log(`Deleted digitalFiles for product ${id}`);

          
          await tx.orderItem.deleteMany({ where: { productId: id } });
          console.log(`Deleted additional orderItems for product ${id}`);

          await tx.review.deleteMany({ where: { productId: id } });
          console.log(`Deleted reviews for product ${id}`);

          await tx.product.delete({ where: { id } });
          console.log(`Deleted product ${id}`);
        } catch (txError) {
          console.error(`Transaction error for product ${id}:`, txError);
          throw txError;
        }
      });

      if (allPublicIds.length > 0) {
        console.log(`Deleting ${allPublicIds.length} Cloudinary assets`);
        const results = await Promise.allSettled(
          allPublicIds.map(({ publicId, resourceType }) => deleteFromCloudinary(publicId, resourceType))
        );

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to delete Cloudinary asset: public_id=${allPublicIds[index].publicId}, resource_type=${allPublicIds[index].resourceType}, reason:`, result.reason);
          }
        });

        // Throw an error if any deletion failed
        if (results.some(result => result.status === 'rejected')) {
          throw new Error('Some Cloudinary assets failed to delete');
        }
      }

      return { message: "Product and all related data deleted successfully" };
    } catch (err) {
      console.error(`Error in productService.delete for product ${id}:`, err);
      throw err;
    }
  },

  // used by admin to delete a product by ID
  async deleteProductsByCategory(categoryId: string) {
    const products = await prisma.product.findMany({
      where: { categoryId },
      include: { images: true, digitalFiles: true },
    });

    if (products.length === 0) throw new Error("No products found for this category");

    for (const product of products) {
      const publicIds = [
        ...product.images.filter(img => img.publicId).map(img => img.publicId!),
        ...product.digitalFiles.filter(f => f.publicId).map(f => f.publicId!),
      ];
      await Promise.allSettled(
        publicIds.map(publicId => deleteFromCloudinary(publicId))
      );
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.digitalFile.deleteMany({ where: { productId: product.id } });
    }

    await prisma.product.deleteMany({ where: { categoryId } });

    return { message: `Deleted ${products.length} products from category` };
  }, // Used by admin to delete all products in a category 
  async getFilteredProducts({
  search,
  categoryId,
  inStockOnly,
  skip = 0,
  take = 5,
}: {
  search?: string;
  categoryId?: string;
  inStockOnly?: boolean;
  skip?: number;
  take?: number;
}) {
  return await prisma.product.findMany({
    where: {
      name: search ? { contains: search, mode: "insensitive" } : undefined,
      categoryId: categoryId || undefined,
      stock: inStockOnly ? { gt: 0 } : undefined,
    },
    include: { category: true, images: true, sizes: true, digitalFiles: true },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}
,
async countFilteredProducts({
  search,
  categoryId,
  inStockOnly,
}: {
  search?: string;
  categoryId?: string;
  inStockOnly?: boolean;
}) {
  return await prisma.product.count({
    where: {
      name: search ? { contains: search, mode: "insensitive" } : undefined,
      categoryId: categoryId || undefined,
      stock: inStockOnly ? { gt: 0 } : undefined,
    },
  });
},
async getProductWithReviews(id: string) {
  const [product, similarProducts] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: {
          include: {
            parent: true, // Include parent category for frontend compatibility
          },
        },
        sizes: true,
        variants: { include: { images: true } },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    }),
    // Fetch similar products
    prisma.product.findMany({
      where: {
        AND: [
          { id: { not: id } }, // Exclude the current product
          {
            OR: [
              { categoryId: { equals: (await prisma.product.findUnique({ where: { id }, select: { categoryId: true } }))?.categoryId } },
              { type: { equals: (await prisma.product.findUnique({ where: { id }, select: { type: true } }))?.type } },
            ],
          },
        ],
      },
      include: {
        images: true,
        category: {
          include: {
            parent: true, 
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Fallback sorting
      },
      take: 5, // Limit to 5 similar products
    }),
  ]);

  if (!product) throw new Error("Product not found");

  // Randomize similar products
  const shuffledSimilarProducts = similarProducts.sort(() => 0.5 - Math.random()).slice(0, 5);

  return {
    product,
    similarProducts: shuffledSimilarProducts,
  };
},
async getFeaturedProducts(category?: string) {
  const count = Math.floor(Math.random() * 6) + 5; // 5-10 products
  
  // Build the where clause based on category
  const where: any = {};
  
  if (category) {
    // Try to find by parent category first
    where.category = {
      parent: {
        name: category
      }
    };
  }
  
  try {
    // First try with the category filter
    const products = await prisma.product.findMany({
      where,
      include: {
        images: true,
        category: {
          include: {
            parent: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: count, // Get more than we need for randomization
    });
    
    // If we got products, shuffle and return the requested count
    if (products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count).map(product => ({
        ...product,
        digitalFiles: [] // Always empty for security
      }));
    }
    
    // If no products found with category filter, try without it
    if (category) {
      const allProducts = await prisma.product.findMany({
        include: {
          images: true,
          category: {
            include: {
              parent: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: count * 2,
      });
      
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count).map(product => ({
        ...product,
        digitalFiles: []
      }));
    }
    
    // If still no products, return empty array
    return [];
  } catch (error) {
    console.error('Error in getFeaturedProducts:', error);
    throw error;
  }
}
};