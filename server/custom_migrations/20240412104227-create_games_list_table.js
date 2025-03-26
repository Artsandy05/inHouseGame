"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("games-list", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // Each province name should be unique
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ""
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isStreaming: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      moderatorRoute: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ""
      },
      gameRoute: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ""
      },
      banner: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ""
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("games-list");
  },
};
