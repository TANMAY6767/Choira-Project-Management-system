import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResonse.js";
import { statusType } from "../utils/statusType.js";
import { getDashboardStats } from "../services/dashboardService.js";

export const getDashboard = asyncHandler(async (req, res) => {
  return sendResponse(
    res,
    true,
    await getDashboardStats(req.user.id),
    "Dashboard loaded",
    statusType.OK
  );
});
