'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("transactions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      ticket_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      wallet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "wallets", // Ensure the table name is correct
          },
          key: "id",
        },
      },
      game_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "games",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      amount: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      odds: {
        type: Sequelize.DECIMAL(32, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      gameRoundCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      previousBalance: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      type: {
        type: Sequelize.ENUM("bet", "wonprize", "losebet", "deposit", "load", "deduct","withdrawal", "sendGift","promo","refund","settlement"),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      callbackId: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 0
      },
      merchantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "merchants",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      loadTransactionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "load-transactions",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
    await queryInterface.dropTable("transactions");
  }
};
