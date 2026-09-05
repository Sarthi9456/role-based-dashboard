'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const userValidation = (isCreate) => [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('A valid email is required.'),
  body('roleId').notEmpty().withMessage('A role must be selected.'),
  isCreate
    ? body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
    : body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

// Viewing the user list is shared by Admin (full control) and Manager (read-only, employees only).
router.get('/', requireAuth, authorize('Admin', 'Manager'), userController.index);

// Creating, editing, deleting accounts and assigning roles is Admin-only.
router.get('/new', requireAuth, authorize('Admin'), userController.newForm);
router.post('/', requireAuth, authorize('Admin'), userValidation(true), userController.create);
router.get('/:id/edit', requireAuth, authorize('Admin'), userController.editForm);
router.put('/:id', requireAuth, authorize('Admin'), userValidation(false), userController.update);
router.delete('/:id', requireAuth, authorize('Admin'), userController.destroy);

module.exports = router;
