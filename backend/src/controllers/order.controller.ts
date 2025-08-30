import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { generateSignedDownloadUrl } from "../lib/cloudinary";
import { OrderService } from "../services/order.service";
import { Readable } from "nodemailer/lib/xoauth2";
import { createWriteStream, createReadStream, unlink } from 'fs';
import { promisify } from 'util';
import tmp from 'tmp';

const unlinkAsync = promisify(unlink);

interface AuthRequest extends Request {
  user: { id: string; role: string };
}

export const OrderController = {
  async getDownloadLink(req: AuthRequest, res: Response) {
    const { orderId, fileId } = req.params;
    const userId = req.user.id;

    console.log(`Fetching download for orderId=${orderId}, fileId=${fileId}, userId=${userId}`);

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  digitalFiles: true,
                },
              },
            },
          },
          user: true,
        },
      });

      if (!order) {
        console.error(`Order not found: orderId=${orderId}`);
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.userId !== userId && req.user.role !== 'ADMIN') {
        console.error(`Unauthorized access attempt: userId=${userId}, orderId=${orderId}`);
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const digitalFile = order.items
        .flatMap((item) => item.product.digitalFiles)
        .find((file) => file.id === fileId);

      if (!digitalFile) {
        console.error(`Digital file not found: fileId=${fileId}, orderId=${orderId}`);
        return res.status(404).json({ error: 'Digital file not found' });
      }

      console.log(
        `Found digital file: fileId=${fileId}, publicId=${digitalFile.publicId}, fileName=${digitalFile.fileName}`
      );

      // Use the generateSignedDownloadUrl function for consistency
      const fileUrl = generateSignedDownloadUrl(
        digitalFile.publicId,
        digitalFile.fileName,
        3600, // 1 hour expiry
        `User-${userId}` // Optional watermark
      );

      console.log(`Generated signed URL: ${fileUrl}`);

      // Fetch file content
      const response = await fetch(fileUrl);
      if (!response.ok) {
        console.error(`Failed to fetch file from Cloudinary: status=${response.status}, url=${fileUrl}`);
        return res.status(404).json({ error: `File not found in Cloudinary: ${digitalFile.publicId}` });
      }

      if (!response.body) {
        console.error(`Response body is null for publicId=${digitalFile.publicId}`);
        return res.status(500).json({ error: 'Failed to stream file: no response body' });
      }

      // Create temporary file
      const tmpFile = tmp.fileSync({ postfix: '.zip' });
      console.log(`Created temp file: ${tmpFile.name}`);

      // Write file to temporary location
      const writeStream = createWriteStream(tmpFile.name);
      const nodeReadableStream = Readable.from(response.body as ReadableStream<Uint8Array>);
      nodeReadableStream.pipe(writeStream);

      // Wait for write to complete
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

      // Stream file to client
      res.setHeader('Content-Disposition', `attachment; filename="${digitalFile.fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      const readStream = createReadStream(tmpFile.name);
      
      readStream.pipe(res);

      // Clean up temp file after streaming
      readStream.on('end', async () => {
        try {
          await unlinkAsync(tmpFile.name);
          console.log(`Deleted temp file: ${tmpFile.name}`);
        } catch (error) {
          console.error(`Failed to delete temp file: ${tmpFile.name}, error=${error}`);
        }
      });

      readStream.on('error', (error) => {
        console.error(`Error streaming temp file: ${tmpFile.name}, error=${error}`);
        res.status(500).json({ error: 'Failed to stream file' });
      });
    } catch (error) {
      console.error(`Error streaming download: orderId=${orderId}, fileId=${fileId}, error=${error}`);
      return res.status(500).json({ error: 'Failed to download file' });
    }
  },
  async createRazorpayOrder(req: AuthRequest, res: Response) {
    try {
      const { addressId, items, total } = req.body as {
        addressId?: string | null;
        items: { productId: string; quantity: number; sizeId?: string | null; variantId?: string | null }[];
        total: number;
      };
      const userId = req.user.id;

      if (!items || !total) {
        return res.status(400).json({ error: "Items and total are required" });
      }

      const normalizedAddressId = addressId ?? null;

      const result = await OrderService.createOrderWithRazorpayManual(userId, normalizedAddressId, items, total);

      res.json({
        orderId: result.orderId,
        razorpayOrderId: result.razorpayOrderId,
        amount: result.amount,
        currency: result.currency,
        downloadLinks: result.downloadLinks,
      });
    } catch (err: any) {
      console.error("Error creating Razorpay order:", err);
      res.status(500).json({ error: err.message || "Failed to create Razorpay order" });
    }
  },

  async getUserOrders(req: AuthRequest, res: Response) {
    const { id: userId } = req.user;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      const data = await OrderService.getUserOrders(userId, page, limit);
      res.json(data);
    } catch (err: any) {
      console.error("Error fetching user orders:", err);
      res.status(500).json({ error: err.message || "Failed to fetch orders" });
    }
  },

  async createCODOrder(req: AuthRequest, res: Response) {
    const { id: userId } = req.user;
    const { addressId, items, total } = req.body as {
      addressId: string;
      items: { productId: string; quantity: number; sizeId?: string | null; variantId?: string | null }[];
      total: number;
    };

    if (!userId || !addressId || !items || !total) {
      return res.status(400).json({ error: "Missing required fields: userId, addressId, items, total" });
    }

    try {
      const data = await OrderService.createCODOrderManual(userId, addressId, items, total);
      res.json(data);
    } catch (err: any) {
      console.error("Error creating COD order:", err);
      res.status(400).json({ error: err.message || "Failed to create COD order" });
    }
  },

  async createBuyNowCOD(req: AuthRequest, res: Response) {
    const { id: userId } = req.user;
    const { productId, quantity, addressId } = req.body as {
      productId: string;
      quantity: number;
      addressId: string;
    };

    if (!productId || !quantity || !addressId) {
      return res.status(400).json({ error: "Missing required fields: productId, quantity, addressId" });
    }

    try {
      const result = await OrderService.createCODOrderDirect(userId, productId, quantity, addressId);
      res.json(result);
    } catch (err: any) {
      console.error("Error creating buy-now COD order:", err);
      res.status(400).json({ error: err.message || "Failed to create COD order" });
    }
  },

  async cancelOrder(req: AuthRequest, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      const { order, refund } = await OrderService.cancelOrder(userId, id);
      res.json({
        success: true,
        message: refund
          ? "Order cancelled and refund processed successfully."
          : "Order cancelled successfully.",
        order,
        refund,
      });
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      res.status(400).json({ error: err.message || "Failed to cancel order" });
    }
  },

  async returnOrder(req: AuthRequest, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;

    try {
      const order = await OrderService.returnOrder(userId, id);
      res.json({ success: true, message: "Return requested.", order });
    } catch (err: any) {
      console.error("Error requesting return:", err);
      res.status(400).json({ error: err.message || "Failed to request return" });
    }
  },

  async saveRefundDetails(req: AuthRequest, res: Response) {
    const { orderId, fullName, upiId, accountNumber, ifscCode, bankName } = req.body;

    if (!orderId || !fullName) {
      return res.status(400).json({ error: "Order ID and Full Name are required" });
    }

    if (!upiId && (!accountNumber || !ifscCode || !bankName)) {
      return res.status(400).json({ error: "Either UPI ID or complete bank details are required" });
    }

    try {
      const existing = await prisma.refundDetail.findUnique({ where: { orderId } });
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

      res.json({ success: true, message: "Refund details saved successfully" });
    } catch (err: any) {
      console.error("Error saving refund details:", err);
      res.status(500).json({ error: err.message || "Failed to save refund details" });
    }
  },
};