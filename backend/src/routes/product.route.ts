import { Router } from "express";
import { ProductController } from "../controllers/product.controller";


const router = Router();

router.get("/", ProductController.getAll); // all products
router.get("/filter", ProductController.getAllProducts); // Filtered products
router.get("/:id", ProductController.getById); // Product by ID

export default router;
