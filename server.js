import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { connectMongo } from "./db.js";
import { connectMysql, initializeMysql } from "./config/mysql.js";
import { ApiError } from "./utils/ApiError.js";
import { authRoutes } from "./routes/authRoutes.js";
import { projectRoutes } from "./routes/projectRoutes.js";

dotenv.config();

const app = express();
const upload = multer();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.none());
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);


app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});


const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  await connectMysql();
  await initializeMysql();
  await connectMongo();

  const port = Number(process.env.PORT) || 8000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Unable to start the server:", error.message);
  process.exitCode = 1;
});