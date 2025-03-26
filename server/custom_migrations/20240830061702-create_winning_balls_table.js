'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("winning-balls", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      gamesId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "games", // Assuming you have a Provinces table
          key: "id",
        },
      },
      zodiac: {
        type: Sequelize.STRING,
         allowNull: false,
      },
      game: {
        type: Sequelize.STRING,
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
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("winning-balls");
  }
};
