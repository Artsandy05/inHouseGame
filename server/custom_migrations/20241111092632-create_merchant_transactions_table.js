'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("merchant_transactions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      temporaryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "temporary_transaction",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      amount: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      operationId: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      transId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      externalId: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      providerId: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      providerName: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      providerMethod: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      currency: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      fee_amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      qrContent: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      redirectURL: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      signature: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      operation: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      request: {
        type:  Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
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
    await queryInterface.dropTable("merchant_transactions");
  }
};
