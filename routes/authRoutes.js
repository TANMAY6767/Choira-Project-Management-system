import { Router } from "express";
import { getMe, login, register, updateProfile } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", authenticate, getMe);
authRoutes.put("/profile", authenticate, updateProfile);
