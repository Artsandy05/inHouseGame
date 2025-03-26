"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("referrals", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      inviterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      playerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userType: {
        type: Sequelize.ENUM(
          "site",
          "online",
        ),
        allowNull: false,
        defaultValue: "online",
      },
      commission: {
        type: Sequelize.DECIMAL(5, 2), // Example: 999.99
        allowNull: false,
        defaultValue: 0,
      },
      commissionAgent: {
        type: Sequelize.DECIMAL(5, 2), // Example: 999.99
        allowNull: false,
        defaultValue: 0,
      },
      suggestedCommission: {
        type: Sequelize.DECIMAL(5, 2), // Example: 999.99
        allowNull: false,
        defaultValue: 0,
      },
      suggestedCommissionAgent: {
        type: Sequelize.DECIMAL(5, 2), // Example: 999.99
        allowNull: false,
        defaultValue: 0,
      },
      suggestedCommisionStatus: {
        type: Sequelize.ENUM(
          "idle",
          "forapproval",
        ),
        allowNull: false,
        defaultValue: "idle",
      },
      suggestedCommissionUpdatedAt: {
        type: Sequelize.DATE,
        defaultValue: null,
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
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("referrals");
  },
};
