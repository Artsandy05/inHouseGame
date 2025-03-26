'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("host-profile", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      hostName: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      birthday: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      assetId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "game-assets",
          key: "id",
        },
      },
      facebookLink: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
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
    await queryInterface.dropTable("host-profile");
  }
};
