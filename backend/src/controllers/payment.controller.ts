// src/controllers/payment.controller.ts
import crypto from "crypto";
import { Request, Response } from "express";
import { verifyRazorpayWebhookSignature } from "../utils/razorpay.utils";
import { prisma } from "../lib/prisma";

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { productType: true } } } } },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const isAllDigital = order.items.every(item => item.product.productType === "digital");

  await prisma.payment.create({
    data: {
      orderId,
      amount: order.total,
      method: "razorpay",
      status: "PAID",
      transactionId: razorpay_payment_id,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: isAllDigital ? "DELIVERED" : "PAID" }, // Digital orders are delivered immediately
  });

  return res.json({ success: true });
};

export const razorpayWebhook = async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const payload = JSON.stringify(req.body); // Convert body to string for signature verification

  const signature = req.headers["x-razorpay-signature"] as string;
  const isValid = verifyRazorpayWebhookSignature(payload, signature, secret);

  if (!isValid) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const event = req.body.event;

  if (event === "payment.captured") {
    const paymentId = req.body.payload.payment.entity.id;
    const orderIdMeta = req.body.payload.payment.entity.notes.orderId;

    if (!orderIdMeta) return res.status(400).json({ error: "No orderId found in notes" });

    const order = await prisma.order.findUnique({
      where: { id: orderIdMeta },
      include: { items: { include: { product: { select: { productType: true } } } } },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const isAllDigital = order.items.every(item => item.product.productType === "digital");

    await prisma.payment.updateMany({
      where: { transactionId: paymentId },
      data: { status: "PAID" },
    });

    await prisma.order.update({
      where: { id: orderIdMeta },
      data: { status: isAllDigital ? "DELIVERED" : "PAID" }, // Digital orders are delivered immediately
    });

    return res.status(200).json({ success: true });
  }

  return res.status(200).json({ message: "Unhandled event" });
};