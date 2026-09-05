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

module.exports = router;
