import express from 'express';
import {
  fetchPromotions,
  addPromotion,
  removePromotion,
  validatePromoCode,
} from "../controllers/promotion.controller";
import { isAdmin, verifyUser } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(verifyUser); // Auth middleware

router.get('/',isAdmin, fetchPromotions);
router.post('/',isAdmin, addPromotion);
router.delete('/:id',isAdmin, removePromotion);
// ============================================for public use
router.get('/validate', validatePromoCode);

export default router;
