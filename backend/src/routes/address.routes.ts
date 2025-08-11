import { Router } from "express";
import { AddressController } from "../controllers/address.controller";
import { verifyUser } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyUser);

router.post("/", AddressController.create);
router.get("/", AddressController.getAll);
router.put("/:addressId", AddressController.update);
router.delete("/:addressId", AddressController.delete);

export default router;