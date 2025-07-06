import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyUser } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/register-admin', AuthController.registerAdminHandler);
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', verifyUser, AuthController.me);

export default router;