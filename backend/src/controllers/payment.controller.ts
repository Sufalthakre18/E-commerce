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

    // For testing purposes, we are using a hardcoded expected signature
    // const expectedSignature = 'fortesting1234564'

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid signature" });
    }

    await prisma.payment.create({
        data: {
            orderId,
            amount: 0, // Optional: fetch from order
            method: "razorpay",
            status: "PAID",
            transactionId: razorpay_payment_id,
        },
    });

    await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
    });

    return res.json({ success: true });
};

// This endpoint handles Razorpay webhooks
export const razorpayWebhook = async (req: Request, res: Response) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const payload = req.body.toString("utf8");

    const signature = req.headers["x-razorpay-signature"] as string;
    
    
  // Temporary for testing
//     const expectedSignature = "fortesting0234564";
//     if (signature !== expectedSignature) {
//     return res.status(400).json({ error: "Invalid signature" });
//   }


    const isValid = verifyRazorpayWebhookSignature(payload, signature, secret);

    if (!isValid) {
        return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = req.body.event;

    if (event === "payment.captured") {
        const paymentId = req.body.payload.payment.entity.id;
        const orderIdMeta = req.body.payload.payment.entity.notes.orderId;

        if (!orderIdMeta) return res.status(400).json({ error: "No orderId found in notes" });

        // Update order + payment status
        await prisma.payment.updateMany({
            where: { transactionId: paymentId },
            data: { status: "PAID" },
        });

        await prisma.order.update({
            where: { id: orderIdMeta },
            data: { status: "PAID" },
        });

        return res.status(200).json({ success: true });
    }

    return res.status(200).json({ message: "Unhandled event" });
};