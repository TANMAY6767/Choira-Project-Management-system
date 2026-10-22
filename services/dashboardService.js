import { Task } from "../models/Task.js";
import { getMysql } from "../config/mysql.js";

export const getDashboardStats = async (userId) => {
  const [projectResult, totalTasks, pendingTasks, completedTasks, highPriorityTasks] = await Promise.all([
    getMysql().execute(
      `SELECT COUNT(*) AS total,
        SUM(status = 'active') AS active,
        SUM(status = 'completed') AS completed
      FROM projects WHERE user_id = ?`,
      [userId]
    ),
    Task.countDocuments({ ownerId: userId }),
    Task.countDocuments({ ownerId: userId, status: { $ne: "completed" } }),
    Task.countDocuments({ ownerId: userId, status: "completed" }),
    Task.countDocuments({ ownerId: userId, priority: "high" }),
  ]);

  // The MySQL driver returns [rows, fields] for execute().
  const projects = projectResult[0][0];
  return {
    totalProjects: Number(projects.total),
    activeProjects: Number(projects.active || 0),
    completedProjects: Number(projects.completed || 0),
    totalTasks,
    pendingTasks,
    completedTasks,
    highPriorityTasks,
  };
};
