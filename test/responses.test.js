import test from "node:test";
import assert from "node:assert/strict";
import { sendResponse } from "../utils/apiResonse.js";
import { errorHandler } from "../middleware/errorHandler.js";

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("success responses include pagination metadata at the top level", () => {
  const res = createResponse();
  const pagination = { page: 1, limit: 10, totalRecords: 0, totalPages: 0 };

  sendResponse(res, true, [], "Tasks loaded", 200, { pagination });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success: true,
    data: [],
    message: "Tasks loaded",
    statusCode: 200,
    pagination,
  });
});

test("errors use the same response envelope and preserve the HTTP status", () => {
  const res = createResponse();

  errorHandler({ statusCode: 404, message: "Task not found" }, {}, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, {
    success: false,
    data: null,
    message: "Task not found",
    errors: [],
    statusCode: 404,
  });
});
