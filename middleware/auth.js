import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { statusType } from "../utils/statusType.js";

export const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(" ") || [];

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(statusType.UNAUTHORIZED, "Authentication token is required"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub) };
    next();
  } catch {
    next(new ApiError(statusType.UNAUTHORIZED, "Authentication token is invalid or expired"));
  }
};
