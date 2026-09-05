'use strict';

const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Task, Project, User, Role } = require('../models');

const PAGE_SIZE = 8;

async function getFormOptions() {
  const [projects, employees] = await Promise.all([
    Project.findAll({ order: [['name', 'ASC']] }),
    User.findAll({ include: { model: Role, as: 'role', where: { name: 'Employee' } }, order: [['name', 'ASC']] }),
  ]);
  return { projects, employees };
}

exports.index = async (req, res) => {
  const { id, role } = req.session.user;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const search = (req.query.search || '').trim();
  const statusFilter = req.query.status || '';
  const priorityFilter = req.query.priority || '';

  const where = {};
  if (search) where.title = { [Op.like]: `%${search}%` };
  if (statusFilter) where.status = statusFilter;
  if (priorityFilter) where.priority = priorityFilter;

  // Employees only ever see tasks assigned directly to them.
  if (role === 'Employee') where.assignedTo = id;

  const { rows: tasks, count } = await Task.findAndCountAll({
    where,
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name'] },
      { model: User, as: 'assignee', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  res.render('tasks/index', {
    title: 'Tasks',
    tasks,
    search,
    statusFilter,
    priorityFilter,
    page,
    totalPages: Math.max(Math.ceil(count / PAGE_SIZE), 1),
  });
};

exports.newForm = async (req, res) => {
  const { projects, employees } = await getFormOptions();
  res.render('tasks/form', { title: 'New Task', task: null, projects, employees });
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  const { projects, employees } = await getFormOptions();

  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.render('tasks/form', { title: 'New Task', task: req.body, projects, employees });
  }

  const { title, description, projectId, assignedTo, priority, dueDate, status } = req.body;

  await Task.create({
    title,
    description,
    projectId,
    assignedTo: assignedTo || null,
    priority: priority || 'Medium',
    dueDate: dueDate || null,
    status: status || 'Pending',
  });

  req.flash('success', 'Task created successfully.');
  res.redirect('/tasks');
};

exports.editForm = async (req, res) => {
  const [task, { projects, employees }] = await Promise.all([Task.findByPk(req.params.id), getFormOptions()]);

  if (!task) {
    req.flash('error', 'Task not found.');
    return res.redirect('/tasks');
  }

  res.render('tasks/form', { title: 'Edit Task', task, projects, employees });
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  const task = await Task.findByPk(req.params.id);
  const { projects, employees } = await getFormOptions();

  if (!task) {
    req.flash('error', 'Task not found.');
    return res.redirect('/tasks');
  }

  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.render('tasks/form', { title: 'Edit Task', task: { ...task.toJSON(), ...req.body }, projects, employees });
  }

  const { title, description, projectId, assignedTo, priority, dueDate, status } = req.body;

  await task.update({
    title,
    description,
    projectId,
    assignedTo: assignedTo || null,
    priority,
    dueDate: dueDate || null,
    status,
  });

  req.flash('success', 'Task updated successfully.');
  res.redirect('/tasks');
};

// Employees may only flip the status of their own task; Admin/Manager may update any task.
exports.updateStatus = async (req, res) => {
  const { id, role } = req.session.user;
  const task = await Task.findByPk(req.params.id);

  if (!task) {
    req.flash('error', 'Task not found.');
    return res.redirect('/tasks');
  }

  if (role === 'Employee' && task.assignedTo !== id) {
    return res.status(403).render('errors/403', { title: 'Access Denied', layout: false });
  }

  await task.update({ status: req.body.status });
  req.flash('success', 'Task status updated.');
  res.redirect(req.get('referer') || '/tasks');
};

exports.destroy = async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) {
    req.flash('error', 'Task not found.');
    return res.redirect('/tasks');
  }

  await task.destroy(); // soft delete
  req.flash('success', 'Task deleted.');
  res.redirect('/tasks');
};
