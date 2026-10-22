import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getMysql } from "../config/mysql.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResonse.js";
import { statusType } from "../utils/statusType.js";

const createToken = (userId) =>
  jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
});

export const register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { name, email, password } = body;

  if (Object.keys(body).some((field) => !["name", "email", "password"].includes(field))) {
    throw new ApiError(statusType.BAD_REQUEST, "Unsupported registration fields");
  }

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || !name.trim() || !email.trim() || !password) {
    throw new ApiError(statusType.BAD_REQUEST, "All fields are required");
  }

  if (name.trim().length > 100 || email.trim().length > 255) {
    throw new ApiError(statusType.BAD_REQUEST, "Name or email is too long");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid email");
  }

  if (password.length < 8) {
    throw new ApiError(statusType.BAD_REQUEST, "Password must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const [result] = await getMysql().execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date(),
    };

    return sendResponse(
      res,
      true,
      { user, token: createToken(user.id) },
      "Account created",
      statusType.CREATED
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new ApiError(statusType.CONFLICT, "Email already exists");
    }
    throw error;
  }
});

export const login = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { email, password } = body;

  if (Object.keys(body).some((field) => !["email", "password"].includes(field))) {
    throw new ApiError(statusType.BAD_REQUEST, "Unsupported login fields");
  }

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    throw new ApiError(statusType.BAD_REQUEST, "Email and password are required");
  }

  const [rows] = await getMysql().execute(
    "SELECT id, name, email, password_hash, created_at AS createdAt FROM users WHERE email = ?",
    [email.trim().toLowerCase()]
  );

  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(statusType.UNAUTHORIZED, "Email or password is incorrect");
  }

  delete user.password_hash;

  return sendResponse(
    res,
    true,
    { user, token: createToken(user.id) },
    "Signed in",
    statusType.OK
  );
});

export const getMe = asyncHandler(async (req, res) => {
  const [rows] = await getMysql().execute(
    "SELECT id, name, email, created_at AS createdAt FROM users WHERE id = ?",
    [req.user.id]
  );

  if (!rows[0]) {
    throw new ApiError(statusType.NOT_FOUND, "User not found");
  }

  return sendResponse(res, true, rows[0], "Profile loaded", statusType.OK);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { name, email, password } = body;

  if (Object.keys(body).some((field) => !["name", "email", "password"].includes(field))) {
    throw new ApiError(statusType.BAD_REQUEST, "Unsupported profile fields");
  }

  if (name === undefined && email === undefined && password === undefined) {
    throw new ApiError(statusType.BAD_REQUEST, "Provide a field to update");
  }

  if (password !== undefined && (typeof password !== "string" || password.length < 8)) {
    throw new ApiError(statusType.BAD_REQUEST, "Password must be at least 8 characters");
  }

  if (name !== undefined && (typeof name !== "string" || !name.trim() || name.trim().length > 100)) {
    throw new ApiError(statusType.BAD_REQUEST, "Invalid name");
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new ApiError(statusType.BAD_REQUEST, "Invalid email");
    }
    if (email.trim().length > 255) {
      throw new ApiError(statusType.BAD_REQUEST, "Email is too long");
    }
  }

  const fields = [];
  const values = [];
  if (name !== undefined) {
    fields.push("name = ?");
    values.push(name.trim());
  }
  if (email !== undefined) {
    fields.push("email = ?");
    values.push(email.trim().toLowerCase());
  }
  if (password !== undefined) {
    fields.push("password_hash = ?");
    values.push(await bcrypt.hash(password, 10));
  }

  try {
    await getMysql().execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      [...values, req.user.id]
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new ApiError(statusType.CONFLICT, "Email already exists");
    }
    throw error;
  }

  const [rows] = await getMysql().execute(
    "SELECT id, name, email, created_at AS createdAt FROM users WHERE id = ?",
    [req.user.id]
  );

  if (!rows[0]) {
    throw new ApiError(statusType.NOT_FOUND, "User not found");
  }

  return sendResponse(res, true, rows[0], "Profile updated", statusType.OK);
});
