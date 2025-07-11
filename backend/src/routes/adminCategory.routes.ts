import { Router } from "express";
import { AdminCategoryController } from "../controllers/adminCategory.controller";
import { isAdmin, verifyUser } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyUser,isAdmin); // verifyUser all routes

router.post("/", AdminCategoryController.create);
router.put("/:id", AdminCategoryController.update);
router.delete("/:id", AdminCategoryController.delete);
router.get("/", AdminCategoryController.list);
router.get("/:id/subcategories", AdminCategoryController.subcategories);

export default router;
