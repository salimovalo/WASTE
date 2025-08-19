'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // District access maydonini users jadvaliga qo'shish
    await queryInterface.addColumn('users', 'district_access', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: '[]'
    });
  },

  async down(queryInterface, Sequelize) {
    // District access maydonini olib tashlash
    await queryInterface.removeColumn('users', 'district_access');
  }
};
