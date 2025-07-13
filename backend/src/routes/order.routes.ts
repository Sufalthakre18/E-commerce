import { RequestHandler, Router } from "express";
import { verifyUser } from "../middlewares/auth.middleware";
import { OrderController } from "../controllers/order.controller";
import { deleteRefundDetails } from "../controllers/admin.controller";


const router = Router();

router.use(verifyUser);

router.get("/user",  OrderController.getUserOrders);
router.post("/buy-now", OrderController.createBuyNowOrder);
router.post("/cod", OrderController.createCODOrder); // for cart
router.post("/cod/buy-now",  OrderController.createBuyNowCOD); // for buy now
router.post("/cancel/:id",  OrderController.cancelOrder); 
router.post("/return/:id",  OrderController.returnOrder);
router.post("/refund-details",  OrderController.saveRefundDetails);
router.delete("/refund-details/:orderId",  deleteRefundDetails);
router.post("/razorpay", 
  OrderController.createRazorpayOrder as unknown as RequestHandler
); 
export default router;
