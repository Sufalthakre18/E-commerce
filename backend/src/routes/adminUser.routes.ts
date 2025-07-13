import { Router } from "express";
import { AdminUserController } from "../controllers/adminUser.controller";
import { isAdmin } from "../middlewares/auth.middleware";

const router = Router();

router.use(isAdmin);

router.get("/", AdminUserController.list);
router.get("/:userId/orders", AdminUserController.getUserOrders);


export default router;
