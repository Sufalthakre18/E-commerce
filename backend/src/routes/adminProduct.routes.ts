import { Router } from "express";
import { verifyUser, isAdmin } from "../middlewares/auth.middleware";
import { ProductController } from "../controllers/product.controller";
import { upload } from "../middlewares/upload";


const router = Router();

router.use(verifyUser, isAdmin);

router.get("/", ProductController.getAllProducts);
router.post("/", upload.array("images", 20), ProductController.create);

router.put(
  '/:id',
  upload.fields([
    { name: 'images', maxCount: 20 },          
    { name: 'variantImages', maxCount: 20 },   
  ]),
  ProductController.update
);

router.delete("/:id", ProductController.delete);
router.delete("/category/:categoryId", ProductController.deleteByCategory);
// image routes is another section which is the adminProductImageRoutes

export default router;