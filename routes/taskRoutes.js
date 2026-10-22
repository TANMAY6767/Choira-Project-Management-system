import { Router } from "express";
import { create, getOne, list, remove, update } from "../controllers/taskController.js";
import { authenticate } from "../middleware/auth.js";

export const taskRoutes = Router();

taskRoutes.use(authenticate);
taskRoutes.post("/", create);
taskRoutes.get("/", list);
taskRoutes.get("/:id", getOne);
taskRoutes.put("/:id", update);
taskRoutes.delete("/:id", remove);
