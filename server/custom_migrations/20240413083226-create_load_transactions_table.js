'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("load-transactions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      transactionType: {
          type: Sequelize.ENUM(
            "load",
            "deduct",
          ),
          allowNull: false,
          defaultValue: "load",
      },
      personType: {
          type: Sequelize.ENUM(
            "admin",
            "user",
          ),
          allowNull: false,
          defaultValue: "admin",
      },
      targetUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "users", // Ensure the table name is correct
          },
          key: "id",
        },
      },
      sourceUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "users", // Ensure the table name is correct
          },
          key: "id",
        },
      },
      reason: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: "",
      },
      attachmentImg: Sequelize.STRING,
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
    await queryInterface.dropTable("load-transactions");
  }
};
