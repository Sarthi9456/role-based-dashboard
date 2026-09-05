'use strict';

const { Op } = require('sequelize');
const { User, Project, Task, ProjectEmployee } = require('../models');

exports.index = async (req, res) => {
  const { id, role } = req.session.user;
  let stats = {};

  try {
    if (role === 'Admin') {
      const [totalUsers, totalProjects, activeProjects, pendingTasks, completedTasks, totalTasks] =
        await Promise.all([
          User.count(),
          Project.count(),
          Project.count({ where: { status: 'In Progress' } }),
          Task.count({ where: { status: 'Pending' } }),
          Task.count({ where: { status: 'Completed' } }),
          Task.count(),
        ]);
      stats = { totalUsers, totalProjects, activeProjects, pendingTasks, completedTasks, totalTasks };
    } else if (role === 'Manager') {
      const [totalEmployees, totalProjects, activeProjects, pendingTasks, completedTasks, totalTasks] =
        await Promise.all([
          User.count({ include: { association: 'role', where: { name: 'Employee' } } }),
          Project.count(),
          Project.count({ where: { status: 'In Progress' } }),
          Task.count({ where: { status: 'Pending' } }),
          Task.count({ where: { status: 'Completed' } }),
          Task.count(),
        ]);
      stats = { totalEmployees, totalProjects, activeProjects, pendingTasks, completedTasks, totalTasks };
    } else {
      // Employee: statistics scoped only to what they are assigned to.
      const assignedProjectIds = (
        await ProjectEmployee.findAll({ where: { userId: id }, attributes: ['projectId'] })
      ).map((row) => row.projectId);

      const [myProjects, myTasks, myPendingTasks, myCompletedTasks] = await Promise.all([
        Promise.resolve(assignedProjectIds.length),
        Task.count({ where: { assignedTo: id } }),
        Task.count({ where: { assignedTo: id, status: { [Op.ne]: 'Completed' } } }),
        Task.count({ where: { assignedTo: id, status: 'Completed' } }),
      ]);
      stats = { myProjects, myTasks, myPendingTasks, myCompletedTasks };
    }

    res.render('dashboard', { title: 'Dashboard', stats });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('errors/500', { title: 'Server Error', layout: false });
  }
};
