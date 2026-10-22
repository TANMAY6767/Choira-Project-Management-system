import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { getMysql } from "../config/mysql.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResonse.js";
import { statusType } from "../utils/statusType.js";

const validateTaskId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid task ID");
  }
};

const findOwnedProject = async (userId, projectId) => {
  const [rows] = await getMysql().execute(
    "SELECT id FROM projects WHERE id = ? AND user_id = ?",
    [projectId, userId]
  );

  if (!rows[0]) {
    throw new ApiError(statusType.NOT_FOUND, "Project not found");
  }
};

const findOwnedTask = async (userId, taskId) => {
  validateTaskId(taskId);

  const task = await Task.findOne({
    _id: taskId,
    ownerId: userId,
  });

  if (!task) {
    throw new ApiError(statusType.NOT_FOUND, "Task not found");
  }

  return task;
};

export const create = asyncHandler(async (req, res) => {
  const body = req.body || {};

  if (Object.keys(body).some(
    (field) => !["title", "description", "status", "priority", "projectId"].includes(field)
  )) {
    throw new ApiError(statusType.BAD_REQUEST, "Unsupported task fields");
  }

  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.trim().length > 200
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid task title");
  }

  if (
    body.description !== undefined &&
    (typeof body.description !== "string" || body.description.length > 2000)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid description");
  }

  if (
    body.status !== undefined &&
    !["todo", "in_progress", "completed"].includes(body.status)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid task status");
  }

  if (
    body.priority !== undefined &&
    !["low", "medium", "high"].includes(body.priority)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid task priority");
  }

  if (body.projectId === undefined) {
    throw new ApiError(statusType.BAD_REQUEST, "projectId is required");
  }

  const projectId = Number(body.projectId);

  if (!Number.isInteger(projectId) || projectId < 1) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid projectId");
  }

  await findOwnedProject(req.user.id, projectId);

  const task = await Task.create({
    title: body.title.trim(),
    description: body.description,
    status: body.status,
    priority: body.priority,
    projectId,
    ownerId: req.user.id,
  });

  return sendResponse(
    res, true, task, "Task created", statusType.CREATED
  );
});

// Get all tasks
export const list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new ApiError(
      statusType.BAD_REQUEST,
      "Page must be positive and limit must be between 1 and 100"
    );
  }

  const filter = { ownerId: req.user.id };

  if (req.query.status !== undefined) {
    if (!["todo", "in_progress", "completed"].includes(req.query.status)) {
      throw new ApiError(statusType.BAD_REQUEST, "Invalid task status");
    }

    filter.status = req.query.status;
  }

  if (req.query.priority !== undefined) {
    if (!["low", "medium", "high"].includes(req.query.priority)) {
      throw new ApiError(statusType.BAD_REQUEST, "Invalid task priority");
    }

    filter.priority = req.query.priority;
  }

  if (req.query.projectId !== undefined) {
    const projectId = Number(req.query.projectId);

    if (!Number.isInteger(projectId) || projectId < 1) {
      throw new ApiError(statusType.BAD_REQUEST, "Invalid projectId");
    }

    filter.projectId = projectId;
  }

  const tasks = await Task.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalRecords = await Task.countDocuments(filter);

  return sendResponse(
    res,
    true,
    tasks,
    "Tasks loaded",
    statusType.OK,
    {
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    }
  );
});

// Get one task
export const getOne = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req.user.id, req.params.id);

  return sendResponse(res, true, task, "Task loaded", statusType.OK);
});

// Update task
export const update = asyncHandler(async (req, res) => {
  const body = req.body || {};

  if (Object.keys(body).some(
    (field) => !["title", "description", "status", "priority", "projectId"].includes(field)
  )) {
    throw new ApiError(statusType.BAD_REQUEST, "Unsupported task fields");
  }

  if (
    body.title !== undefined &&
    (typeof body.title !== "string" ||
      !body.title.trim() ||
      body.title.trim().length > 200)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid task title");
  }

  if (
    body.description !== undefined &&
    (typeof body.description !== "string" || body.description.length > 2000)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid description");
  }

  if (
    body.status !== undefined &&
    !["todo", "in_progress", "completed"].includes(body.status)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid task status");
  }

  if (
    body.priority !== undefined &&
    !["low", "medium", "high"].includes(body.priority)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid task priority");
  }

  if (body.projectId !== undefined) {
    const projectId = Number(body.projectId);

    if (!Number.isInteger(projectId) || projectId < 1) {
      throw new ApiError(statusType.BAD_REQUEST, "Invalid projectId");
    }
  }

  const task = await findOwnedTask(req.user.id, req.params.id);

  if (
    body.title === undefined &&
    body.description === undefined &&
    body.status === undefined &&
    body.priority === undefined &&
    body.projectId === undefined
  ) {
    throw new ApiError(
      statusType.BAD_REQUEST,
      "Provide at least one task field to update"
    );
  }

  if (body.projectId !== undefined) {
    await findOwnedProject(req.user.id, Number(body.projectId));
    task.projectId = Number(body.projectId);
  }

  if (body.title !== undefined) task.title = body.title.trim();
  if (body.description !== undefined) task.description = body.description;
  if (body.status !== undefined) task.status = body.status;
  if (body.priority !== undefined) task.priority = body.priority;

  await task.save();

  return sendResponse(res, true, task, "Task updated", statusType.OK);
});

// Delete task
export const remove = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req.user.id, req.params.id);

  await task.deleteOne();

  return sendResponse(res, true, null, "Task deleted", statusType.OK);
});