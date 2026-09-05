'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/auth');

router.get('/login', redirectIfAuthenticated, authController.showLogin);

router.post(
  '/login',
  redirectIfAuthenticated,
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  authController.login
);

router.post('/logout', authController.logout);

router.get('/register', redirectIfAuthenticated, authController.showRegister);

router.post(
  '/register',
  redirectIfAuthenticated,
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match.'),
  ],
  authController.register
);

module.exports = router;
