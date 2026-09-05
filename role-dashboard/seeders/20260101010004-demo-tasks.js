'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('Tasks', [
      {
        title: 'Design homepage wireframes',
        description: 'Create low-fidelity wireframes for the new homepage.',
        projectId: 1,
        assignedTo: 3,
        priority: 'High',
        dueDate: '2026-01-20',
        status: 'Completed',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Implement responsive navbar',
        description: 'Build the new responsive navigation component.',
        projectId: 1,
        assignedTo: 4,
        priority: 'Medium',
        dueDate: '2026-02-10',
        status: 'In Progress',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure build and deploy pipeline for the mobile app.',
        projectId: 2,
        assignedTo: 5,
        priority: 'High',
        dueDate: '2026-03-01',
        status: 'Pending',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Write onboarding docs',
        description: 'Document onboarding flow for new mobile app users.',
        projectId: 2,
        assignedTo: 4,
        priority: 'Low',
        dueDate: '2026-04-15',
        status: 'Pending',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'Migrate authentication service',
        description: 'Move the legacy auth service to the new infra.',
        projectId: 3,
        assignedTo: 3,
        priority: 'High',
        dueDate: '2026-01-15',
        status: 'Completed',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Tasks', null, {});
  },
};
