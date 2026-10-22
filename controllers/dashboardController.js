import { Task } from "../models/Task.js";
import { getMysql } from "../config/mysql.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResonse.js";
import { statusType } from "../utils/statusType.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const [projectRows, totalTasks, pendingTasks, completedTasks, highPriorityTasks] = await Promise.all([
    getMysql().execute(
      `SELECT COUNT(*) AS total,
        SUM(status = 'active') AS active,
        SUM(status = 'completed') AS completed
      FROM projects WHERE user_id = ?`,
      [req.user.id]
    ),
    Task.countDocuments({ ownerId: req.user.id }),
    Task.countDocuments({ ownerId: req.user.id, status: { $ne: "completed" } }),
    Task.countDocuments({ ownerId: req.user.id, status: "completed" }),
    Task.countDocuments({ ownerId: req.user.id, priority: "high" }),
  ]);

  // Project counts come from MySQL and task counts come from MongoDB.
  const projects = projectRows[0][0];
  return sendResponse(
    res,
    true,
    {
      totalProjects: Number(projects.total),
      activeProjects: Number(projects.active || 0),
      completedProjects: Number(projects.completed || 0),
      totalTasks,
      pendingTasks,
      completedTasks,
      highPriorityTasks,
    },
    "Dashboard loaded",
    statusType.OK
  );
});
