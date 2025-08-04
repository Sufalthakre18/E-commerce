import { Router } from "express";
import { AdminCategoryController } from "../controllers/adminCategory.controller";
import { isAdmin, verifyUser } from "../middlewares/auth.middleware";

const router = Router();


router.post("/",verifyUser,isAdmin, AdminCategoryController.create);
router.put("/:id",verifyUser,isAdmin, AdminCategoryController.update);
router.delete("/:id",verifyUser,isAdmin, AdminCategoryController.delete);
router.get("/", AdminCategoryController.list);
router.get("/:id/subcategories",verifyUser,isAdmin, AdminCategoryController.subcategories);

export default router;
