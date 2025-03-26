'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("representative_bet_info", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      representative_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      game_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      ticket_number: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      total_number_of_bets: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
      },
      payment_amount: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
      },
      change_amount: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      }, 
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("representative_bet_info");
  }
};
