'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const projectController = require('../controllers/projectController');
const { requireAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required.'),
  body('startDate').notEmpty().withMessage('Start date is required.'),
  body('status').isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status.'),
];

// All authenticated roles can view; visibility is scoped per-role inside the controller
// (Employees only ever see projects they are assigned to).
router.get('/', requireAuth, projectController.index);
router.get('/:id', requireAuth, projectController.show);

// Only Admin and Manager may create/edit projects.
router.get('/new', requireAuth, authorize('Admin', 'Manager'), projectController.newForm);
router.post('/', requireAuth, authorize('Admin', 'Manager'), projectValidation, projectController.create);
router.get('/:id/edit', requireAuth, authorize('Admin', 'Manager'), projectController.editForm);
router.put('/:id', requireAuth, authorize('Admin', 'Manager'), projectValidation, projectController.update);
router.patch('/:id/status', requireAuth, authorize('Admin', 'Manager'), projectController.updateStatus);

// Deleting a project is restricted to Admin.
router.delete('/:id', requireAuth, authorize('Admin'), projectController.destroy);

module.exports = router;
