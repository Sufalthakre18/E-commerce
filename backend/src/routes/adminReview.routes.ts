import { Router } from "express";
import { AdminReviewController } from "../controllers/adminReview.controller";
import { isAdmin, verifyUser } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyUser); // require login
router.use(isAdmin); // require admin role

router.get("/", AdminReviewController.getAll); // GET /api/admin/reviews
router.delete("/:id", AdminReviewController.delete); // DELETE /api/admin/reviews/:id
router.get("/product/:productId", AdminReviewController.getByProduct);
export default router;
