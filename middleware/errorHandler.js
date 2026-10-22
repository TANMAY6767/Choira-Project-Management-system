import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (error, req, res, next) => {
  
  let statusCode = error.statusCode || error.status || 500;
  let message = statusCode >= 500 ? "Internal server error" : error.message || "Request failed";
  let errors = error.errors || [];

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(error.errors).map((item) => item.message);
  }

  if (error.name === "CastError" || error.name === "BSONError") {
    statusCode = 400;
    message = "Invalid task ID";
  }

  if (error.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "A record with that email already exists";
  }

  const apiError = new ApiError(statusCode, message, errors);
  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errors: apiError.errors,
  });
};
