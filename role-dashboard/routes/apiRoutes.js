'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { User, Project, Task, Role } = require('../models');

// GET /api/me - current logged in user
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// GET /api/users - Admin/Manager only
router.get('/users', requireAuth, authorize('Admin', 'Manager'), async (req, res) => {
  const users = await User.findAll({ include: { model: Role, as: 'role' } });
  res.json({ users: users.map((u) => u.toSafeJSON()) });
});

// GET /api/projects - scoped per role
router.get('/projects', requireAuth, async (req, res) => {
  const { id, role } = req.session.user;
  const include = [{ model: User, as: 'assignedEmployees', attributes: ['id', 'name'], through: { attributes: [] } }];
  if (role === 'Employee') {
    include[0].where = { id };
    include[0].required = true;
  }
  const projects = await Project.findAll({ include });
  res.json({ projects });
});

// GET /api/tasks - scoped per role
router.get('/tasks', requireAuth, async (req, res) => {
  const { id, role } = req.session.user;
  const where = role === 'Employee' ? { assignedTo: id } : {};
  const tasks = await Task.findAll({
    where,
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name'] },
      { model: User, as: 'assignee', attributes: ['id', 'name'] },
    ],
  });
  res.json({ tasks });
});

// GET /api/dashboard/stats - Admin/Manager only, quick JSON summary
router.get('/dashboard/stats', requireAuth, authorize('Admin', 'Manager'), async (req, res) => {
  const [totalUsers, totalProjects, activeProjects, pendingTasks, completedTasks] = await Promise.all([
    User.count(),
    Project.count(),
    Project.count({ where: { status: 'In Progress' } }),
    Task.count({ where: { status: 'Pending' } }),
    Task.count({ where: { status: 'Completed' } }),
  ]);
  res.json({ totalUsers, totalProjects, activeProjects, pendingTasks, completedTasks });
});

module.exports = router;
