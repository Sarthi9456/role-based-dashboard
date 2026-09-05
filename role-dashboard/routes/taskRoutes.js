'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const taskController = require('../controllers/taskController');
const { requireAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required.'),
  body('projectId').notEmpty().withMessage('A project must be selected.'),
  body('priority').isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority.'),
  body('status').isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status.'),
];

// All authenticated roles can view; the controller scopes Employees to only their own tasks.
router.get('/', requireAuth, taskController.index);

// Only Admin and Manager may create/edit tasks and assign them to employees.
router.get('/new', requireAuth, authorize('Admin', 'Manager'), taskController.newForm);
router.post('/', requireAuth, authorize('Admin', 'Manager'), taskValidation, taskController.create);
router.get('/:id/edit', requireAuth, authorize('Admin', 'Manager'), taskController.editForm);
router.put('/:id', requireAuth, authorize('Admin', 'Manager'), taskValidation, taskController.update);

// Status updates: Admin/Manager can update any task; Employees only their own (checked in controller).
router.patch('/:id/status', requireAuth, taskController.updateStatus);

// Deleting a task is restricted to Admin.
router.delete('/:id', requireAuth, authorize('Admin'), taskController.destroy);

module.exports = router;
