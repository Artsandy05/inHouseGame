'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('golden_goose_prizes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: true,
        defaultValue: 0,
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('golden_goose_prizes');
  }
};