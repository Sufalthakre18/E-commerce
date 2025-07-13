import { Router } from "express";
import { confirmReturnOrder, deleteRefundDetails, getAllOrders, getAllRefundDetails, getOrderById, getRefundDetailsByOrderId, refundStatusUpdate, updateOrderStatus } from "../controllers/admin.controller";
import { verifyUser } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/auth.middleware";


const router = Router();

router.use(verifyUser, isAdmin);

router.get("/orders", getAllOrders);
router.patch("/orders/:orderId", updateOrderStatus);
router.post("/return/confirm/:orderId", confirmReturnOrder); //automatic with razorpay
router.get("/orders/:id",  getOrderById);

router.get("/refund-details", getAllRefundDetails); // mannual pay and deduct 100 manually for shipping
router.get("/refund-details/:orderId", getRefundDetailsByOrderId);
router.delete("/refund-details/:orderId",  deleteRefundDetails);
router.patch("/refund-details/:orderId",  refundStatusUpdate);

export default router;
