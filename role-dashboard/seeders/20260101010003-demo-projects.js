'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('Projects', [
      {
        id: 1,
        name: 'Website Redesign',
        description: 'Revamp the corporate website with a new design system.',
        startDate: '2026-01-05',
        endDate: '2026-03-15',
        status: 'In Progress',
        createdBy: 2, // Mia Manager
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        name: 'Mobile App Launch',
        description: 'Build and ship v1 of the company mobile app.',
        startDate: '2026-02-01',
        endDate: '2026-06-30',
        status: 'Pending',
        createdBy: 1, // Alice Admin
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        name: 'Internal Tools Migration',
        description: 'Migrate internal tooling to the new infrastructure.',
        startDate: '2025-11-01',
        endDate: '2026-01-31',
        status: 'Completed',
        createdBy: 2, // Mia Manager
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await queryInterface.bulkInsert('ProjectEmployees', [
      { projectId: 1, userId: 3, createdAt: now, updatedAt: now },
      { projectId: 1, userId: 4, createdAt: now, updatedAt: now },
      { projectId: 2, userId: 4, createdAt: now, updatedAt: now },
      { projectId: 2, userId: 5, createdAt: now, updatedAt: now },
      { projectId: 3, userId: 3, createdAt: now, updatedAt: now },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('ProjectEmployees', null, {});
    await queryInterface.bulkDelete('Projects', null, {});
  },
};
