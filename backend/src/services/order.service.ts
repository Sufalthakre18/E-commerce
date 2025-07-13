import { prisma } from "../lib/prisma";
import { razorpay } from "../lib/razorpay";

export const OrderService = {
    async createOrderWithRazorpayManual(
        userId: string,
        addressId: string,
        items: { productId: string; quantity: number; sizeId?: string | null }[],
        total: number
    ) {
        if (items.length === 0) throw new Error("Cart is empty");

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
                    })),
                },
            },
        });

        const razorpayOrder = await razorpay.orders.create({
            amount: total * 100,
            currency: "INR",
            receipt: order.id,
            payment_capture: true,
        });

        return {
            orderId: order.id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        };
    },
    async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    images: true, 
                                },
                            },
                            size: true,
                        },
                    },
                    payment: true,
                    address: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.order.count({ where: { userId } }),
        ]);

        return {
            orders,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        };
    },
    async createBuyNowOrder(userId: string, addressId: string, productId: string, quantity: number) {
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) throw new Error("Product not found");
        if (product.stock < quantity) throw new Error("Insufficient stock");

        const total = product.price * quantity;

        // Step 1: Create Order in DB
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
        });

        // Step 2: Create Razorpay Order
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
        };
    },
    async createCODOrderManual(
        userId: string,
        addressId: string,
        items: { productId: string; quantity: number; sizeId?: string | null }[]
        ,
        total: number
    ) {
        if (items.length === 0) throw new Error("Cart is empty");

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

                        sizeId: item.sizeId ?? null
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
        };
    }, // for cart
    async createCODOrderDirect(
        userId: string,
        productId: string,
        quantity: number,
        addressId: string
    ) {
        const product = await prisma.product.findUnique({ where: { id: productId } });

        if (!product) throw new Error("Product not found");

        const total = product.price * quantity;

        // Create the order
        const order = await prisma.order.create({
            data: {
                userId,
                addressId,
                total,
                status: "PROCESSING", 
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
                        status: "PENDING", // Payment after delivery
                    },
                },
            },
        });

        return {
            orderId: order.id,
            total,
            status: order.status,
            message: "COD order placed successfully",
        };
    }, // for buy now
    // Cancel Order
    async cancelOrder(userId: string, orderId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true },
        });

        if (!order || order.userId !== userId) {
            throw new Error("Order not found or access denied.");
        }

        if (!["PENDING", "PROCESSING", "PAID"].includes(order.status)) {
            throw new Error("Only pending, processing, or paid orders can be cancelled.");
        }

        let refundInfo = null;

        // razorpay Refund Logic
        if (order.payment?.method === "razorpay" && order.payment.status === "PAID") {
            const transactionId = order.payment.transactionId;
            const refundAmount = order.total;

            if (!transactionId) {
                throw new Error("No Razorpay transaction ID found for refund.");
            }

            try {
                // trigger refund from Razorpay
                const refund = await razorpay.payments.refund(transactionId, {
                    amount: refundAmount,
                    speed: "normal",
                    notes: { reason: "Order cancelled" },
                });

                // save refund in DB
                refundInfo = await prisma.refund.create({
                    data: {
                        orderId,
                        amount: refundAmount,
                        reason: "Order cancelled",
                        status: "PROCESSED",
                        deduction: 0,
                        transactionId: refund.id, // updated field
                    },
                });

            } catch (err: any) {
                console.error("Refund failed:", err);

                await prisma.refund.create({
                    data: {
                        orderId,
                        amount: order.total,
                        reason: "Refund failed on cancellation",
                        status: "FAILED",
                        deduction: 0,
                        transactionId: null,
                    },
                });

                throw new Error("Refund via Razorpay failed. Please contact support.");
            }
        }

        // update order status
        const cancelled = await prisma.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED" },
        });

        return {
            order: cancelled,
            refund: refundInfo,
        };
    }
    ,

    // request Return Order
    async returnOrder(userId: string, orderId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order || order.userId !== userId) {
            throw new Error("Order not found or access denied.");
        }

        if (order.status !== "DELIVERED") {
            throw new Error("Only delivered orders can be returned.");
        }

        const returned = await prisma.order.update({
            where: { id: orderId },
            data: { status: "RETURNED" },
        });

        return returned;
    }


};
