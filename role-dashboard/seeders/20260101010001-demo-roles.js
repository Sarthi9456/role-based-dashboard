'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('Roles', [
      { id: 1, name: 'Admin', createdAt: now, updatedAt: now },
      { id: 2, name: 'Manager', createdAt: now, updatedAt: now },
      { id: 3, name: 'Employee', createdAt: now, updatedAt: now },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Roles', null, {});
  },
};
