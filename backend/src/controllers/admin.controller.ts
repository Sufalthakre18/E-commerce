import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { razorpay } from "../lib/razorpay";

// service logic here that's why it have not created a separate service file for refund details
// all logic here is for admin side that's why it have not service logic

// Backend: getAllOrders controller
export const getAllOrders = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: limit,
      include: {
        user: true,
        items: { include: { product: true , size:true} },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count(),
  ]);

  return res.json({
    data: orders,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
};


export const updateOrderStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  return res.json({ message: "Order status updated", order: updated });
};

export const confirmReturnOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.status !== "RETURN_REQUESTED") {
    return res.status(400).json({ error: "Return not yet requested" });
  }

  let deductionCharge = 100;
  let refundAmount = Math.max(order.total - deductionCharge, 0); // Ensure refund is not negative

  // update order status
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "RETURNED" },
  });

  // 2. Refund processing
  if (
    order.payment?.method === "razorpay" &&
    order.payment.status === "PAID" &&
    order.payment.transactionId
  ) {
    try {
      const refund = await razorpay.payments.refund(order.payment.transactionId, {
        amount: refundAmount * 100, // razorpay expects amount in paisa
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
      return res.status(500).json({ error: "Razorpay refund failed" });
    }
  }
  else {
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

  return res.json({ success: true, message: "Return confirmed. Refund initiated." });
};


export const getOrderById = async (req: Request, res: Response) => {
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
              include: {
                images: true,
                category: true,
              },
            },
            size: true, // this gives size info in each item
          },
        },
        payment: true,
        refund: true,
        refunddetail: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    console.error("Failed to get order:", error);
    return res.status(500).json({ message: "Server error while fetching order" });
  }
};



export const deleteRefundDetails = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    const refund = await prisma.refundDetail.findUnique({
      where: { orderId },
    });

    if (!refund) {
      return res.status(404).json({ error: "Refund details not found." });
    }

    await prisma.refundDetail.delete({
      where: { orderId },
    });

    return res.json({ success: true, message: "Refund details permanently deleted" });
  } catch (error) {
    console.error("Error deleting refund details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllRefundDetails = async (req: Request, res: Response) => {
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

    // Add processed flag to each refund
    const enrichedRefunds = refundDetails.map((refund:any) => ({
      ...refund,
      processed: !!refund.deletedAt,
    }));

    return res.json({ success: true, data: enrichedRefunds });
  } catch (error) {
    console.error("Error fetching refund details", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const getRefundDetailsByOrderId = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    const refund = await prisma.refundDetail.findUnique({
      where: { orderId },
    });

    if (!refund || refund.deletedAt) {
      return res.status(404).json({ error: "No refund details found for this order." });
    }

    return res.json({ success: true, refund });
  } catch (error) {
    console.error("error fetching refund details", error);
    return res.status(500).json({ error: "Something went wrong while fetching refund details." });
  }
};

export const refundStatusUpdate = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    const refundDetail = await prisma.refundDetail.findUnique({
      where: { orderId },
    });

    if (!refundDetail) {
      return res.status(404).json({ success: false, message: 'Refund detail not found' });
    }

    const updated = await prisma.refundDetail.update({
      where: { orderId },
      data: {
        deletedAt: new Date(), 
      },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PATCH refund-details/:orderId]', err);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};
