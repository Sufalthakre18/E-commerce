import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyUser } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/register-admin', AuthController.registerAdminHandler);
router.post('/login', AuthController.login);
router.post('/otp/send', AuthController.sendOtp);
router.post('/otp/verify', AuthController.verifyOtp);
router.post('/google', AuthController.google);
router.get('/me', verifyUser, AuthController.me);

export default router;