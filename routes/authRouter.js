import { Router } from "express";
import { login } from "../controllers/authController.js";
import verifyIdToken from "../middlewares/verifyIdToken.js";
const router = Router();

router.post("/login", verifyIdToken, login);
export default router;
