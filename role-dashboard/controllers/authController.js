'use strict';

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User, Role } = require('../models');

exports.showLogin = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect('/login');
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email }, include: { model: Role, as: 'role' } });

    if (!user || !user.isActive) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    // Only the minimum needed identity/role info is kept in the session.
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    };

    const redirectTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    return res.redirect(redirectTo);
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

exports.showRegister = (req, res) => {
  res.render('register', { title: 'Register' });
};

// Public self-registration. Deliberately ignores any role the client might
// submit and always creates the account as "Employee" (the lowest-privilege
// role) - promoting someone to Manager/Admin is an Admin-only action done
// afterwards from the Users page, never something a signup form can grant.
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect('/register');
  }

  const { name, email, password } = req.body;

  try {
    const employeeRole = await Role.findOne({ where: { name: 'Employee' } });
    if (!employeeRole) {
      req.flash('error', 'Registration is not available right now. Please contact an administrator.');
      return res.redirect('/register');
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, roleId: employeeRole.id });

    // Auto sign-in the freshly created account.
    req.session.user = { id: user.id, name: user.name, email: user.email, role: employeeRole.name };
    req.flash('success', 'Welcome! Your account has been created.');
    return res.redirect('/dashboard');
  } catch (err) {
    const message =
      err.name === 'SequelizeUniqueConstraintError' ? 'That email is already registered.' : 'Could not create your account. Please try again.';
    req.flash('error', message);
    return res.redirect('/register');
  }
};
