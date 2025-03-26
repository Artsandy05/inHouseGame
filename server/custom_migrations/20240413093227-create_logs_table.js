"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("logs", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      functionality: {
        // Add associatedType column for polymorphic association
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue:""
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue:""
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue:""
      },
      level: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue:""
      },
      associatedId: {
        // Add associatedId column for polymorphic association
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue:0
      },
      associatedType: {
        // Add associatedType column for polymorphic association
        type: Sequelize.STRING,
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

    // Add indexes for associatedId and associatedType columns
    await queryInterface.addIndex("logs", ["associatedId", "associatedType"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("logs");
  },
};
