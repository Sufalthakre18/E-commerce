import { Response } from "express";
import { prisma } from "../lib/prisma";
import { razorpay } from "../lib/razorpay";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const getAllOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        include: {
          user: true,
          items: {
            include: {
              product: { include: { images: true, digitalFiles: true } },
              size: true,
              variant: true,
            },
          },
          address: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count(),
    ]);

    // Secure digitalFiles for non-admins
    const securedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          digitalFiles: req.user!.role === "ADMIN" && order.status === "DELIVERED" && item.product.productType === "digital"
            ? item.product.digitalFiles
            : [],
        },
      })),
    }));

    res.json({
      data: securedOrders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to get orders:", error);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: "Invalid status value" });
    return;
  }

  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    res.json({ message: "Order status updated", order: updated });
  } catch (error) {
    console.error("Failed to update order status:", error);
    res.status(500).json({ message: "Server error while updating order status" });
  }
};

export const confirmReturnOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, items: { include: { product: true } } },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.status !== "RETURN_REQUESTED") {
      res.status(400).json({ error: "Return not yet requested" });
      return;
    }

    const isAllDigital = order.items.every(item => item.product.productType === "digital");
    if (isAllDigital) {
      res.status(400).json({ error: "Digital orders cannot be returned" });
      return;
    }

    let deductionCharge = 100;
    let refundAmount = Math.max(order.total - deductionCharge, 0);

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "RETURNED" },
    });

    // Refund processing
    if (order.payment?.method === "razorpay" && order.payment.status === "PAID" && order.payment.transactionId) {
      try {
        const refund = await razorpay.payments.refund(order.payment.transactionId, {
          amount: refundAmount * 100,
        });

        await prisma.refund.create({
          data: {
            orderId,
            amount: refundAmount,
            reason: `Returned item - ₹${deductionCharge} deduction - Razorpay refund`,
            status: "PROCESSED",
            deduction: deductionCharge,
            transactionId: refund.id,
          },
        });
      } catch (err) {
        console.error("Refund failed:", err);
        res.status(500).json({ error: "Razorpay refund failed" });
        return;
      }
    } else {
      await prisma.refund.create({
        data: {
          orderId,
          amount: refundAmount,
          reason: `Returned item - ₹${deductionCharge} deduction - COD, manual refund`,
          deduction: deductionCharge,
          status: "MANUAL",
        },
      });
    }

    res.json({ success: true, message: "Return confirmed. Refund initiated." });
  } catch (error) {
    console.error("Failed to confirm return:", error);
    res.status(500).json({ error: "Server error while confirming return" });
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                category: true,
                productType: true,
                price: true,
                digitalFiles: { select: { id: true, publicId: true, fileName: true } },
              },
            },
            size: true,
            variant: {
              include: {
                images: true,
              },
            },
          },
        },
        payment: true,
        refund: true,
        refunddetail: true,
      },
    });

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Apply digital download logic similar to getUserOrders
    const securedOrder = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          // For admins: show digitalFiles if delivered and digital product
          digitalFiles: req.user!.role === "ADMIN" && order.status === "DELIVERED" && item.product.productType === "digital"
            ? item.product.digitalFiles
            : [],
        },
        // Add download links logic for users (when order is PAID or DELIVERED)
        downloadLinks: item.product.productType === 'digital' && ['PAID', 'DELIVERED'].includes(order.status)
          ? item.product.digitalFiles.map(file => ({
              id: file.id,
              url: '', // URL fetched via /order/download endpoint
              fileName: file.fileName,
              downloadAvailableAt: order.payment?.createdAt || order.createdAt,
              downloadExpirySeconds: 3600, // 1 hour expiry
            }))
          : []
      }))
    };

    res.json(securedOrder);
  } catch (error) {
    console.error("Failed to get order:", error);
    res.status(500).json({ message: "Server error while fetching order" });
  }
};

export const deleteRefundDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { orderId } = req.params;

  try {
    const refund = await prisma.refundDetail.findUnique({
      where: { orderId },
    });

    if (!refund) {
      res.status(404).json({ error: "Refund details not found." });
      return;
    }

    await prisma.refundDetail.delete({
      where: { orderId },
    });

    res.json({ success: true, message: "Refund details permanently deleted" });
  } catch (error) {
    console.error("Error deleting refund details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllRefundDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const refundDetails = await prisma.refundDetail.findMany({
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            status: true,
            total: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map through refunds to include all details and add processed status
    const enrichedRefunds = refundDetails.map(refund => ({
      id: refund.id,
      orderId: refund.orderId,
      fullName: refund.fullName,
      upiId: refund.upiId,
      accountNumber: refund.accountNumber,
      ifscCode: refund.ifscCode,
      bankName: refund.bankName,
      createdAt: refund.createdAt,
      deletedAt: refund.deletedAt,
      processed: !!refund.deletedAt,
      order: {
        id: refund.order.id,
        userId: refund.order.userId,
        status: refund.order.status,
        total: refund.order.total,
      }
    }));

    res.json({ success: true, data: enrichedRefunds });
  } catch (error) {
    console.error("Error fetching refund details", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


