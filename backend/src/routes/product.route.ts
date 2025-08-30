import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { verifyUser } from "../middlewares/auth.middleware";


const router = Router();

router.get("/", ProductController.getAll); // all products
router.get("/filter", ProductController.getAllProducts); // Filtered products
router.get("/:id", ProductController.getById); // Product by ID
router.post('/check-digital', ProductController.checkDigital);

export default router;
