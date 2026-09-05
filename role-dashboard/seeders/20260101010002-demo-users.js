'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const plainPassword = process.env.SEED_DEFAULT_PASSWORD || 'Password@123';
    const hash = await bcrypt.hash(plainPassword, 10);

    await queryInterface.bulkInsert('Users', [
      {
        id: 1,
        name: 'Alice Admin',
        email: 'admin@example.com',
        password: hash,
        roleId: 1, // Admin
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        name: 'Mia Manager',
        email: 'manager@example.com',
        password: hash,
        roleId: 2, // Manager
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        name: 'Ethan Employee',
        email: 'employee1@example.com',
        password: hash,
        roleId: 3, // Employee
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 4,
        name: 'Emma Employee',
        email: 'employee2@example.com',
        password: hash,
        roleId: 3, // Employee
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 5,
        name: 'Noah Employee',
        email: 'employee3@example.com',
        password: hash,
        roleId: 3, // Employee
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
