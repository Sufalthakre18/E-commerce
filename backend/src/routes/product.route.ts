import { Router } from "express";
import { ProductController } from "../controllers/product.controller";



const router = Router();

router.get("/", ProductController.getAll); // all products
router.get("/filter", ProductController.getAllProducts); // Filtered products
router.post('/check-digital', ProductController.checkDigital);
router.get("/products-with-reviews/:id", ProductController.getProductWithReviews);

router.get("/featured", ProductController.getFeaturedProducts);
export default router;
