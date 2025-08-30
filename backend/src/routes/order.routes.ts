// src/routes/order.routes.ts
import { RequestHandler, Router } from "express";
import { verifyUser } from "../middlewares/auth.middleware";
import { OrderController } from "../controllers/order.controller";
import { deleteRefundDetails, getOrderById } from "../controllers/admin.controller";

const router = Router();

router.use(verifyUser);

router.get("/user", OrderController.getUserOrders as unknown as RequestHandler);
router.post("/cod", OrderController.createCODOrder as unknown as RequestHandler);
router.post("/cod/buy-now", OrderController.createBuyNowCOD as unknown as RequestHandler);
router.post("/cancel/:id", OrderController.cancelOrder as unknown as RequestHandler);
router.post("/return/:id", OrderController.returnOrder as unknown as RequestHandler);
router.post("/refund-details", OrderController.saveRefundDetails as unknown as RequestHandler);
router.delete("/refund-details/:orderId", deleteRefundDetails);
router.get("/user/:id", getOrderById);
router.post("/razorpay", OrderController.createRazorpayOrder as unknown as RequestHandler);
router.get("/download/:orderId/:fileId", OrderController.getDownloadLink as unknown as RequestHandler); // New download endpoint

export default router;