import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    projectId: {
      type: Number,
      required: true,
      min: 1,
    },
    ownerId: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

taskSchema.index({ ownerId: 1, projectId: 1 });

export const Task = mongoose.model("Task", taskSchema);
