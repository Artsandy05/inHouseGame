'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("golden_goose_rounds", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      result: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      transaction_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      game_id: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      round_id: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      winning_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      jackpot_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      jackpot_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      crack_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      eggs: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
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
    await queryInterface.dropTable("golden_goose_rounds");
  }
};
