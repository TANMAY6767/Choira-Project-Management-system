import { Router } from "express";
import { create, getOne, list, remove, update } from "../controllers/projectController.js";
import { authenticate } from "../middleware/auth.js";

export const projectRoutes = Router();

projectRoutes.use(authenticate);
projectRoutes.post("/", create);
projectRoutes.get("/", list);
projectRoutes.get("/:id", getOne);
projectRoutes.put("/:id", update);
projectRoutes.delete("/:id", remove);
