'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("representative_player_transactions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      game_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "games",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ticket_number: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      representative_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      winning_amount: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
      },
      bet_amount: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
      },
      odds: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      ball: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      game_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(200),
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
    await queryInterface.dropTable("representative_player_transactions");
  }
};
