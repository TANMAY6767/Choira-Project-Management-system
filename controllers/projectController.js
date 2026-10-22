import { getMysql } from "../config/mysql.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResonse.js";
import { statusType } from "../utils/statusType.js";
import { Task } from "../models/Task.js";

const parseProjectId = (id) => {
  const projectId = Number(id);

  if (!Number.isInteger(projectId) || projectId < 1) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid project ID");
  }

  return projectId;
};

const findProject = async (projectId, userId) => {
  const [rows] = await getMysql().execute(
    `SELECT id, name, description, status,
            created_at AS createdAt, updated_at AS updatedAt
     FROM projects
     WHERE id = ? AND user_id = ?`,
    [projectId, userId]
  );

  if (!rows[0]) {
    throw new ApiError(statusType.NOT_FOUND, "Project not found");
  }

  return rows[0];
};


export const create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { name, description, status } = body;

  if (Object.keys(body).some((field) => !["name", "description", "status"].includes(field))) {
    throw new ApiError(statusType.BAD_REQUEST, "Unsupported project fields");
  }

  if (typeof name !== "string" || !name.trim() || name.trim().length > 150) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid project name");
  }

  if (
    description !== undefined &&
    description !== null &&
    (typeof description !== "string" || description.length > 2000)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid description");
  }

  if (
    status !== undefined &&
    !["active", "completed", "archived"].includes(status)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid project status");
  }

  const [result] = await getMysql().execute(
    "INSERT INTO projects (user_id, name, description, status) VALUES (?, ?, ?, ?)",
    [req.user.id, name.trim(), description ?? null, status || "active"]
  );

  const project = await findProject(result.insertId, req.user.id);

  return sendResponse(
    res, true, project, "Project created", statusType.CREATED
  );
});


export const list = asyncHandler(async (req, res) => {
  const [projects] = await getMysql().execute(
    `SELECT id, name, description, status,
            created_at AS createdAt, updated_at AS updatedAt
     FROM projects
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [req.user.id]
  );

  return sendResponse(res, true, projects, "Projects loaded", statusType.OK);
});


export const getOne = asyncHandler(async (req, res) => {
  const project = await findProject(
    parseProjectId(req.params.id),
    req.user.id
  );

  return sendResponse(res, true, project, "Project loaded", statusType.OK);
});


export const update = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { name, description, status } = body;
  const projectId = parseProjectId(req.params.id);
  const userId = req.user.id;

  if (Object.keys(body).some((field) => !["name", "description", "status"].includes(field))) {
    throw new ApiError(statusType.BAD_REQUEST, "Unsupported project fields");
  }

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim() || name.trim().length > 150) {
      throw new ApiError(statusType.BAD_REQUEST, "Invalid project name");
    }
  }

  if (
    description !== undefined &&
    description !== null &&
    (typeof description !== "string" || description.length > 2000)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid description");
  }

  if (
    status !== undefined &&
    !["active", "completed", "archived"].includes(status)
  ) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid project status");
  }

  if (name === undefined && description === undefined && status === undefined) {
    throw new ApiError(statusType.BAD_REQUEST, "Provide a field to update");
  }

  await findProject(projectId, userId);

  if (name !== undefined) {
    await getMysql().execute(
      "UPDATE projects SET name = ? WHERE id = ? AND user_id = ?",
      [name.trim(), projectId, userId]
    );
  }

  if (description !== undefined) {
    await getMysql().execute(
      "UPDATE projects SET description = ? WHERE id = ? AND user_id = ?",
      [description, projectId, userId]
    );
  }

  if (status !== undefined) {
    await getMysql().execute(
      "UPDATE projects SET status = ? WHERE id = ? AND user_id = ?",
      [status, projectId, userId]
    );
  }

  const project = await findProject(projectId, userId);

  return sendResponse(res, true, project, "Project updated", statusType.OK);
});


export const remove = asyncHandler(async (req, res) => {
  const projectId = parseProjectId(req.params.id);

  await findProject(projectId, req.user.id);

  await Task.deleteMany({
    ownerId: req.user.id,
    projectId: projectId,
  });

  await getMysql().execute(
    "DELETE FROM projects WHERE id = ? AND user_id = ?",
    [projectId, req.user.id]
  );

  return sendResponse(
    res, true, null, "Project and its tasks deleted", statusType.OK
  );
});
