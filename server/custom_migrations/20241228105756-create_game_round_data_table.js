'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("game_round_data", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      state: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      gameId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gamesTableId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      walkinPlayers: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      playerCurrentBalance: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      isComplete: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      gameName: {
        type: Sequelize.STRING(200),
        allowNull: true,
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
    await queryInterface.dropTable("game_round_data");
  }
};
