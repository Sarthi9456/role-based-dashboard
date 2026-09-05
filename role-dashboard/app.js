'use strict';

require('dotenv').config();

const express = require('express');
require('express-async-errors');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout');

// Body parsing & static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method')); // allows <form method="POST"> + ?_method=PUT/DELETE

// Sessions & flash messages
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
      httpOnly: true,
    },
  })
);
app.use(flash());

// Make current user + flash messages available to every view
app.use((req, res, next) => {
  res.locals.currentUser = (req.session && req.session.user) || null;
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  res.locals.currentPath = req.path;
  next();
});

// Routes
app.get('/', (req, res) => res.redirect(req.session.user ? '/dashboard' : '/login'));
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/api', apiRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Not Found', layout: false });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('errors/500', { title: 'Server Error', layout: false });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Role-Based Dashboard running at http://localhost:${PORT}`);
});

module.exports = app;
