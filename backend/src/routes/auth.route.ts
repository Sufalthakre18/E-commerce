import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { isAdmin, verifyUser } from '../middlewares/auth.middleware';
import { sendOtpLimiter, verifyOtpLimiter } from '../middlewares/rateLimiters';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/register-admin', AuthController.registerAdminHandler);
router.post('/login', AuthController.login);
router.post('/otp/send',sendOtpLimiter, AuthController.sendOtp);
router.post('/otp/verify',verifyOtpLimiter, AuthController.verifyOtp);
router.post('/google', AuthController.google);
router.get('/me', verifyUser, AuthController.me);
router.get("/list",verifyUser,isAdmin, AuthController.list);
export default router;