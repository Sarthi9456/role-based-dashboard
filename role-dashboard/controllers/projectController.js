'use strict';

const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Project, User, Task, Role } = require('../models');

const PAGE_SIZE = 6;

async function getEmployeeOptions() {
  return User.findAll({
    include: { model: Role, as: 'role', where: { name: 'Employee' } },
    order: [['name', 'ASC']],
  });
}

exports.index = async (req, res) => {
  const { id, role } = req.session.user;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const search = (req.query.search || '').trim();
  const statusFilter = req.query.status || '';

  const where = {};
  if (search) where.name = { [Op.like]: `%${search}%` };
  if (statusFilter) where.status = statusFilter;

  const include = [
    { model: User, as: 'creator', attributes: ['id', 'name'] },
    { model: User, as: 'assignedEmployees', attributes: ['id', 'name'], through: { attributes: [] } },
  ];

  // Employees only ever see projects they have been assigned to.
  if (role === 'Employee') {
    include[1].where = { id };
    include[1].required = true;
  }

  const { rows: projects, count } = await Project.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    distinct: true,
  });

  res.render('projects/index', {
    title: 'Projects',
    projects,
    search,
    statusFilter,
    page,
    totalPages: Math.max(Math.ceil(count / PAGE_SIZE), 1),
  });
};

exports.show = async (req, res) => {
  const { id, role } = req.session.user;

  const project = await Project.findByPk(req.params.id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name'] },
      { model: User, as: 'assignedEmployees', attributes: ['id', 'name'], through: { attributes: [] } },
      {
        model: Task,
        as: 'tasks',
        separate: true, // runs as its own query - avoids breaking when combined with other to-many includes above
        include: [{ model: User, as: 'assignee', attributes: ['id', 'name'] }],
        order: [['createdAt', 'DESC']],
      },
    ],
  });

  if (!project) {
    req.flash('error', 'Project not found.');
    return res.redirect('/projects');
  }

  const isAssigned = project.assignedEmployees.some((e) => e.id === id);
  if (role === 'Employee' && !isAssigned) {
    return res.status(403).render('errors/403', { title: 'Access Denied', layout: false });
  }

  res.render('projects/show', { title: project.name, project });
};

exports.newForm = async (req, res) => {
  const employees = await getEmployeeOptions();
  res.render('projects/form', { title: 'New Project', project: null, employees, selectedEmployeeIds: [] });
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  const employees = await getEmployeeOptions();

  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.render('projects/form', {
      title: 'New Project',
      project: req.body,
      employees,
      selectedEmployeeIds: [].concat(req.body.employeeIds || []).map(Number),
    });
  }

  const { name, description, startDate, endDate, status } = req.body;
  const employeeIds = [].concat(req.body.employeeIds || []).map(Number).filter(Boolean);

  const project = await Project.create({
    name,
    description,
    startDate,
    endDate: endDate || null,
    status: status || 'Pending',
    createdBy: req.session.user.id,
  });

  if (employeeIds.length) {
    await project.setAssignedEmployees(employeeIds);
  }

  req.flash('success', 'Project created successfully.');
  res.redirect('/projects');
};

exports.editForm = async (req, res) => {
  const [project, employees] = await Promise.all([
    Project.findByPk(req.params.id, {
      include: [{ model: User, as: 'assignedEmployees', attributes: ['id'], through: { attributes: [] } }],
    }),
    getEmployeeOptions(),
  ]);

  if (!project) {
    req.flash('error', 'Project not found.');
    return res.redirect('/projects');
  }

  res.render('projects/form', {
    title: 'Edit Project',
    project,
    employees,
    selectedEmployeeIds: project.assignedEmployees.map((e) => e.id),
  });
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  const project = await Project.findByPk(req.params.id);
  const employees = await getEmployeeOptions();

  if (!project) {
    req.flash('error', 'Project not found.');
    return res.redirect('/projects');
  }

  const employeeIds = [].concat(req.body.employeeIds || []).map(Number).filter(Boolean);

  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.render('projects/form', {
      title: 'Edit Project',
      project: { ...project.toJSON(), ...req.body },
      employees,
      selectedEmployeeIds: employeeIds,
    });
  }

  const { name, description, startDate, endDate, status } = req.body;

  await project.update({ name, description, startDate, endDate: endDate || null, status });
  await project.setAssignedEmployees(employeeIds);

  req.flash('success', 'Project updated successfully.');
  res.redirect('/projects');
};

exports.updateStatus = async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) {
    req.flash('error', 'Project not found.');
    return res.redirect('/projects');
  }

  await project.update({ status: req.body.status });
  req.flash('success', 'Project status updated.');
  res.redirect(`/projects/${project.id}`);
};

exports.destroy = async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) {
    req.flash('error', 'Project not found.');
    return res.redirect('/projects');
  }

  await project.destroy(); // soft delete
  req.flash('success', 'Project deleted.');
  res.redirect('/projects');
};