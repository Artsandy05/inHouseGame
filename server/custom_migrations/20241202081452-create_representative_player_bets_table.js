'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("representative_player_bets", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      representative_bet_info_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "representative_bet_info",
          key: "id",
        },
      },
      zodiac_ball_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_bet: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
      },
      bet_type: {
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
    await queryInterface.dropTable("representative_player_bets");
  }
};
