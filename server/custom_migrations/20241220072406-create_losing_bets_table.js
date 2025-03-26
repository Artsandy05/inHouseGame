'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("losing-bets", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      transactionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "transactions",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ball: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      betAmount: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      prize: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });
  },
  

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("losing-bets");
  }
};
