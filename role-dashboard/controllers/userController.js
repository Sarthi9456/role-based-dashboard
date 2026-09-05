'use strict';

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User, Role } = require('../models');

const PAGE_SIZE = 8;

exports.index = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const search = (req.query.search || '').trim();

  const where = search
    ? {
        [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }],
      }
    : {};

  // Managers may only browse Employee accounts; Admins see everyone.
  const include = { model: Role, as: 'role' };
  if (req.session.user.role === 'Manager') {
    include.where = { name: 'Employee' };
  }

  const { rows: users, count } = await User.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  res.render('users/index', {
    title: 'Users',
    users,
    search,
    page,
    totalPages: Math.max(Math.ceil(count / PAGE_SIZE), 1),
  });
};

exports.newForm = async (req, res) => {
  const roles = await Role.findAll({ order: [['id', 'ASC']] });
  res.render('users/form', { title: 'Add User', user: null, roles });
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  const roles = await Role.findAll({ order: [['id', 'ASC']] });

  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.render('users/form', { title: 'Add User', user: req.body, roles });
  }

  const { name, email, password, roleId } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash, roleId });
    req.flash('success', 'User created successfully.');
    res.redirect('/users');
  } catch (err) {
    const message = err.name === 'SequelizeUniqueConstraintError' ? 'That email is already in use.' : 'Could not create user.';
    req.flash('error', message);
    res.render('users/form', { title: 'Add User', user: req.body, roles });
  }
};

exports.editForm = async (req, res) => {
  const [user, roles] = await Promise.all([
    User.findByPk(req.params.id),
    Role.findAll({ order: [['id', 'ASC']] }),
  ]);

  if (!user) {
    req.flash('error', 'User not found.');
    return res.redirect('/users');
  }

  res.render('users/form', { title: 'Edit User', user, roles });
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  const roles = await Role.findAll({ order: [['id', 'ASC']] });
  const user = await User.findByPk(req.params.id);

  if (!user) {
    req.flash('error', 'User not found.');
    return res.redirect('/users');
  }

  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.render('users/form', { title: 'Edit User', user: { ...user.toJSON(), ...req.body }, roles });
  }

  const { name, email, roleId, password, isActive } = req.body;

  try {
    const updates = { name, email, roleId, isActive: isActive === 'on' };
    if (password && password.trim().length > 0) {
      updates.password = await bcrypt.hash(password, 10);
    }
    await user.update(updates);
    req.flash('success', 'User updated successfully.');
    res.redirect('/users');
  } catch (err) {
    const message = err.name === 'SequelizeUniqueConstraintError' ? 'That email is already in use.' : 'Could not update user.';
    req.flash('error', message);
    res.render('users/form', { title: 'Edit User', user: { ...user.toJSON(), ...req.body }, roles });
  }
};

exports.destroy = async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    req.flash('error', 'User not found.');
    return res.redirect('/users');
  }

  if (user.id === req.session.user.id) {
    req.flash('error', 'You cannot delete your own account while logged in.');
    return res.redirect('/users');
  }

  await user.destroy(); // soft delete (paranoid: true)
  req.flash('success', 'User deleted.');
  res.redirect('/users');
};
