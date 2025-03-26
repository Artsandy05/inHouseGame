'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("game_round_player_data", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      gameName: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      gameId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      slots: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      uuid: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      isComplete: {
        type: Sequelize.BOOLEAN,
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
    await queryInterface.dropTable("game_round_player_data");
  }
};
