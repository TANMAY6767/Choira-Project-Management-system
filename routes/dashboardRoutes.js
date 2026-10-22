import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/auth.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", authenticate, getDashboard);
