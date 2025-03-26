'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("games", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      config_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "configs",
          key: "id",
        },
      },
      game_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "games-list",
          key: "id",
        },
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      label: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gross: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      totalWins: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      totalLose: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      totalCommission: {
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
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("games");
  }
};
