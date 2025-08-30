import { prisma } from "../lib/prisma";
import { razorpay } from "../lib/razorpay";

interface OrderItemInput {
  productId: string;
  quantity: number;
  sizeId?: string | null;
  variantId?: string | null;
}

export const OrderService = {
  async createOrderWithRazorpayManual(
    userId: string,
    addressId: string | null,
    items: OrderItemInput[],
    total: number
  ) {
    if (items.length === 0) throw new Error("Cart is empty");

    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productType: true, stock: true, price: true },
    });

    const isAllDigital = products.every(p => p.productType === "digital");
    const hasDigital = products.some(p => p.productType === "digital");

    if (isAllDigital && addressId) {
      throw new Error("Address not required for digital-only orders");
    }
    if (!isAllDigital && !addressId) {
      throw new Error("Address required for orders with physical products");
    }

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.productType !== "digital" && product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        total,
        status: "PENDING",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            sizeId: item.sizeId ?? null,
            variantId: item.variantId ?? null,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, productType: true, digitalFiles: true },
            },
          },
        },
      },
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt: order.id,
      payment_capture: true,
      notes: {
        orderId: order.id,
      },
    });

    return {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      downloadLinks: [], // Download links provided only after payment
    };
  },

  async getUserOrders(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const orders = await prisma.order.findMany({
    where: { userId },
    skip,
    take: limit,
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              productType: true,
              digitalFiles: { select: { id: true, publicId: true, fileName: true } },
            },
          },
          size: true,
          variant: true,
        },
      },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    orders: orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        downloadLinks: item.product.productType === 'digital' && ['PAID', 'DELIVERED'].includes(order.status)
          ? item.product.digitalFiles.map(file => ({
              id: file.id,
              url: '', // URL fetched via /order/download
              fileName: file.fileName,
              downloadAvailableAt: order.payment?.createdAt || order.createdAt, // Use payment creation time or order creation time
              downloadExpirySeconds: 3600, // 1 hour expiry
            }))
          : []
      }))
    })),
    total: await prisma.order.count({ where: { userId } })
  };
},

  async createBuyNowOrder(userId: string, addressId: string | null, productId: string, quantity: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, stock: true, productType: true, digitalFiles: true },
    });

    if (!product) throw new Error("Product not found");
    if (product.productType !== "digital" && product.stock < quantity) {
      throw new Error("Insufficient stock");
    }
    if (product.productType === "digital" && addressId) {
      throw new Error("Address not required for digital products");
    }
    if (product.productType !== "digital" && !addressId) {
      throw new Error("Address required for physical products");
    }

    const total = product.price * quantity;

    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        total,
        status: "PENDING",
        items: {
          create: [
            {
              productId,
              quantity,
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, productType: true, digitalFiles: true },
            },
          },
        },
      },
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt: order.id,
      payment_capture: true,
      notes: {
        orderId: order.id,
      },
    });

    return {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      downloadLinks: [],
    };
  },

  async createCODOrderManual(
    userId: string,
    addressId: string,
    items: OrderItemInput[],
    total: number
  ) {
    if (items.length === 0) throw new Error("Cart is empty");

    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productType: true },
    });

    if (products.some(p => p.productType === "digital")) {
      throw new Error("COD not allowed for orders containing digital products");
    }

    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        total,
        status: "PENDING",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            sizeId: item.sizeId || null,
            variantId: item.variantId || null,
          })),
        },
        payment: {
          create: {
            amount: total,
            method: "COD",
            status: "UNPAID",
          },
        },
      },
      include: { payment: true },
    });

    return {
      orderId: order.id,
      status: order.status,
      total: order.total,
      payment: order.payment,
      downloadLinks: [],
    };
  },

  async createCODOrderDirect(
    userId: string,
    productId: string,
    quantity: number,
    addressId: string
  ) {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) throw new Error("Product not found");
    if (product.productType === "digital") {
      throw new Error("COD not allowed for digital products");
    }
    if (product.stock < quantity) throw new Error("Insufficient stock");

    const total = product.price * quantity;

    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        total,
        status: "PENDING",
        items: {
          create: [
            {
              productId,
              quantity,
            },
          ],
        },
        payment: {
          create: {
            amount: total,
            method: "COD",
            status: "PENDING",
          },
        },
      },
    });

    return {
      orderId: order.id,
      total,
      status: order.status,
      message: "COD order placed successfully",
      downloadLinks: [],
    };
  },

 async cancelOrder(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        items: {
          include: {
            product: {
              select: { id: true, productType: true, price: true, digitalFiles: true },
            },
          },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new Error("Order not found or access denied.");
    }

    if (!["PENDING", "PROCESSING", "PAID"].includes(order.status)) {
      throw new Error("Only pending, processing, or paid orders can be cancelled.");
    }

    if (
      order.status === "DELIVERED" &&
      order.items.some(item => item.product.productType === "digital")
    ) {
      throw new Error("Delivered digital orders cannot be cancelled.");
    }

    let refundInfo = null;

    if (order.payment?.method === "razorpay" && order.payment.status === "PAID") {
      const transactionId = order.payment.transactionId;

      // Calculate refund amount only for physical products
      const physicalItemsTotal = order.items
        .filter(item => item.product.productType !== "digital")
        .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      if (physicalItemsTotal <= 0) {
        throw new Error("No physical products to refund in this order.");
      }

      if (!transactionId) {
        throw new Error("No Razorpay transaction ID found for refund.");
      }

      try {
        const refund = await razorpay.payments.refund(transactionId, {
          amount: physicalItemsTotal * 100, // Refund only physical items total in paise
          speed: "normal",
          notes: { reason: "Order cancelled - refunding physical products only" },
        });

        refundInfo = await prisma.refund.create({
          data: {
            orderId,
            amount: physicalItemsTotal,
            reason: "Order cancelled - refunding physical products only",
            status: "PROCESSED",
            deduction: 0,
            transactionId: refund.id,
          },
        });
      } catch (err: any) {
        console.error("Refund failed:", err);
        await prisma.refund.create({
          data: {
            orderId,
            amount: physicalItemsTotal,
            reason: "Refund failed on cancellation",
            status: "FAILED",
            deduction: 0,
            transactionId: null,
          },
        });
        throw new Error("Refund via Razorpay failed. Please contact support.");
      }
    }

    const cancelled = await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, productType: true, digitalFiles: true },
            },
          },
        },
      },
    });

    return {
      order: {
        ...cancelled,
        items: cancelled.items.map(item => ({
          ...item,
          downloadLinks: [],
        })),
      },
      refund: refundInfo,
    };
  },

  async returnOrder(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order || order.userId !== userId) {
      throw new Error("Order not found or access denied.");
    }

    if (order.status !== "DELIVERED") {
      throw new Error("Only delivered orders can be returned.");
    }

    if (order.items.some(item => item.product.productType === "digital")) {
      throw new Error("Digital products cannot be returned.");
    }

    const returned = await prisma.order.update({
      where: { id: orderId },
      data: { status: "RETURN_REQUESTED" },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, productType: true, digitalFiles: true },
            },
          },
        },
      },
    });

    return {
      ...returned,
      items: returned.items.map(item => ({
        ...item,
        downloadLinks: [],
      })),
    };
  },
};