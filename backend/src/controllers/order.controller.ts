import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import { prisma } from "../lib/prisma";
import { razorpay } from "../lib/razorpay";

// Define a custom interface for the request to include 
interface AuthRequest extends Request {
  user: { id: string }; // Add more fields if needed
}

export const OrderController = {
  async createRazorpayOrder(req: AuthRequest, res: Response) {
    try {
      const { addressId, items, total,variantId,sizeId } = req.body;
      const userId = req.user.id;

      // create the DB order with status "PENDING"
      const order = await prisma.order.create({
        data: {
          userId,
          addressId,
          total,
          status: "PENDING",
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              sizeId: item.sizeId ,
              variantId: item.variantId 
            })),
          },
        },
      });

      // create Razorpay Order
      const razorpayOrder = await razorpay.orders.create({
        amount: total * 100, // in paisa
        currency: "INR",
        receipt: order.id,
        notes: {
          orderId: order.id, // attach DB orderId in notes
        },
      });

      res.json({
        orderId: order.id, // your internal DB order id
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    } catch (err) {
      console.error("error creating razorpay order:", err);
      res.status(500).json({ error: "Failed to create Razorpay order" });
    }
  },
  async getUserOrders(req: Request, res: Response) {
    const { id: userId } = (req as AuthRequest).user;
    if (!userId) {
      return res.status(400).json({ error: "user ID is required" });
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const data = await OrderService.getUserOrders(userId, page, limit);
    return res.json(data);
  },
  async createBuyNowOrder(req: Request, res: Response) {
    const { id: userId } = (req as AuthRequest).user;
    const { productId, quantity, addressId } = req.body;

    if (!productId || !quantity || !addressId) {
      return res.status(400).json({ error: "missing required fields" });
    }

    try {
      const data = await OrderService.createBuyNowOrder(userId, addressId, productId, quantity);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
  async createCODOrder(req: Request, res: Response) {
    const { id: userId } = (req as AuthRequest).user;
    const { addressId, items, total } = req.body;

    if (!userId || !addressId || !items || !total) {
      return res.status(400).json({ error: "missing required fields" });
    }

    try {
      const data = await OrderService.createCODOrderManual(userId, addressId, items, total);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },// for cart
  async createBuyNowCOD(req: Request, res: Response) {
    const { id: userId } = (req as AuthRequest).user;
    const { productId, quantity, addressId } = req.body;

    if (!productId || !quantity || !addressId) {
      return res.status(400).json({ error: "missing required fields" });
    }

    try {
      const result = await OrderService.createCODOrderDirect(
        userId,
        productId,
        quantity,
        addressId
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }, // for buy now
  async cancelOrder(req: Request, res: Response) {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;

    try {
      const { order, refund } = await OrderService.cancelOrder(userId, id);
      res.json({
        success: true,
        message: refund
          ? "order cancelled and refund processed successfully."
          : "order cancelled successfully.",
        order,
        refund,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  ,
  async returnOrder(req: Request, res: Response) {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id: id } });
    if (!order) return res.status(404).json({ error: "order not found" });

    if (order.status !== "DELIVERED") {
      return res.status(400).json({ error: "only delivered orders can be returned" });
    }

    await prisma.order.update({
      where: { id: id },
      data: { status: "RETURN_REQUESTED" },
    });

    return res.json({ success: true, message: "Return requested." });
  } // for return request
  ,
  async saveRefundDetails(req: Request, res: Response) {
    const { orderId, fullName, upiId, accountNumber, ifscCode, bankName } = req.body;

    if (!orderId || !fullName) {
      return res.status(400).json({ error: "Order ID and Full Name are required" });
    }

    if (!upiId && (!accountNumber || !ifscCode || !bankName)) {
      return res.status(400).json({ error: "either UPI ID or complete bank details are required" });
    }

    const existing = await prisma.refundDetail.findUnique({ where: { orderId } });
    console.log('existing refund detail', existing);
    if (existing) {
      return res.status(409).json({ error: "Refund details already submitted for this order" });
    }

    await prisma.refundDetail.create({
      data: {
        orderId,
        fullName,
        upiId,
        accountNumber,
        ifscCode,
        bankName,
      },
    });

    return res.json({ success: true, message: "Refund details saved successfully" });
  }, // for saving refund details for COD orders
};
