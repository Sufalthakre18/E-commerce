import express, { Router } from "express";
import { razorpayWebhook, verifyRazorpayPayment } from "../controllers/payment.controller";
import { verifyUser } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyUser); 
router.post("/verify", verifyRazorpayPayment);
router.post("/webhook", express.raw({ type: "application/json" }), razorpayWebhook);


export default router;
