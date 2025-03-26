'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("zoloz_transactions", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      isInitialize: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isCheckResult: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      result: {
        type:  Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      clientCfg: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      ekycResult: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      extBasicInfo: {
        type:  Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      extCancelInfo: {
        type:  Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      extCustomInfo: {
        type:  Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      extFaceInfo: {
        type:  Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      extIdInfo: {
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
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("zoloz_transactions");
  }
};
