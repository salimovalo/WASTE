const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('districts', 'tozamakon_id', {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [3, 50]
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('districts', 'tozamakon_id');
  }
};
