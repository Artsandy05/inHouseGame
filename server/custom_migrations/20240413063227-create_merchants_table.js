'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("merchants", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        defaultValue: ""
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ""
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        defaultValue: "",
      },
      type: {
        type: Sequelize.ENUM(
          "instapay",
          "pesonet",
        ),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue:""
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
    await queryInterface.dropTable("merchants");
  }
};
