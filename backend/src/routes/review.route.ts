import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { verifyUser } from "../middlewares/auth.middleware";

const router = Router();



router.post("/",verifyUser, ReviewController.create);
router.put("/:id",verifyUser, ReviewController.update);
router.get("/product/:productId", ReviewController.getByProduct);
router.delete("/:id",verifyUser, ReviewController.delete);

export default router;
